import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import {
  AUTO_CHECK_INTERVAL_MS,
  AUTO_GITHUB_SYNC_INTERVAL_MS,
} from '../constants/config';
import { GITHUB_USERNAME } from '../data/projects';
import { Project, ProjectInput, ProjectStatus } from '../types/project';
import {
  fetchGithubRepos,
  mergeProjects,
  repoToProject,
} from '../utils/github';
import {
  notifyGithubProjectsAdded,
  notifyProblemsBatch,
  notifyProjectRecovered,
  setupNotifications,
} from '../utils/notifications';
import {
  deleteAuthToken,
  getGithubToken,
  saveAuthToken,
  saveGithubToken,
} from '../utils/secure';
import {
  AppSettings,
  loadProjects,
  loadSettings,
  reseedProjects,
  saveProjects,
  saveSettings,
} from '../utils/storage';
import { checkProjectHealth, getStatusLabel, summarize } from '../utils/status';

type ProjectsContextValue = {
  projects: Project[];
  loading: boolean;
  checking: boolean;
  githubSyncing: boolean;
  settings: AppSettings;
  summary: ReturnType<typeof summarize>;
  refreshAll: () => Promise<void>;
  refreshOne: (id: string) => Promise<void>;
  addProject: (input: ProjectInput) => Promise<void>;
  importProjects: (incoming: Project[]) => Promise<number>;
  syncCatalog: () => Promise<{ added: number; total: number }>;
  syncFromGithub: (opts?: {
    silent?: boolean;
  }) => Promise<{ added: number; total: number; names: string[] }>;
  updateProject: (id: string, input: ProjectInput) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  getById: (id: string) => Project | undefined;
  setAutoCheckEnabled: (enabled: boolean) => Promise<void>;
  setAutoGithubSyncEnabled: (enabled: boolean) => Promise<void>;
  setProblemAlertsEnabled: (enabled: boolean) => Promise<void>;
  setGithubUsername: (username: string) => Promise<void>;
  setGithubToken: (token: string) => Promise<void>;
};

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    autoCheckEnabled: true,
    autoCheckIntervalMs: AUTO_CHECK_INTERVAL_MS,
    autoGithubSyncEnabled: true,
    githubUsername: GITHUB_USERNAME,
    autoGithubSyncIntervalMs: AUTO_GITHUB_SYNC_INTERVAL_MS,
    problemAlertsEnabled: true,
    recoveryAlertsEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [githubSyncing, setGithubSyncing] = useState(false);
  const projectsRef = useRef(projects);
  projectsRef.current = projects;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const githubSyncInFlight = useRef(false);
  /** Bir xil offline uchun spam qilmaslik */
  const alertedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        await setupNotifications();
        const [stored, storedSettings] = await Promise.all([
          loadProjects(),
          loadSettings(),
        ]);
        setProjects(stored);
        setSettings(storedSettings);
        settingsRef.current = storedSettings;
        projectsRef.current = stored;
        // Allaqachon offline bo‘lganlarni "alerted" deb belgilash — ochilishda spam yo‘q
        for (const p of stored) {
          if (p.status === 'offline' || p.status === 'degraded') {
            alertedIdsRef.current.add(p.id);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next: Project[]) => {
    setProjects(next);
    await saveProjects(next);
  }, []);

  const persistSettings = useCallback(async (next: AppSettings) => {
    setSettings(next);
    settingsRef.current = next;
    await saveSettings(next);
  }, []);

  const shouldAlertProject = useCallback((p: Project) => {
    const s = settingsRef.current;
    if (s.problemAlertsEnabled === false) return false;
    // Loyihada aniq o‘chirilgan bo‘lsa — skip
    if (p.notifyOnDown === false) return false;
    return true;
  }, []);

  const collectTransitionAlerts = useCallback(
    (
      prev: Project,
      nextStatus: ProjectStatus,
      notes?: string
    ): {
      problem?: { name: string; status: string; notes?: string };
      recovered?: string;
    } => {
      const isBad = nextStatus === 'offline' || nextStatus === 'degraded';
      const wasBad = prev.status === 'offline' || prev.status === 'degraded';

      if (isBad && !wasBad && shouldAlertProject(prev)) {
        if (!alertedIdsRef.current.has(prev.id)) {
          alertedIdsRef.current.add(prev.id);
          return {
            problem: {
              name: prev.name,
              status: getStatusLabel(nextStatus),
              notes,
            },
          };
        }
      }

      if (!isBad && wasBad && nextStatus === 'online') {
        alertedIdsRef.current.delete(prev.id);
        if (
          settingsRef.current.recoveryAlertsEnabled !== false &&
          prev.notifyOnDown !== false
        ) {
          return { recovered: prev.name };
        }
      }

      // Status o‘zgarmagan offline → spam yo‘q
      if (isBad && wasBad && prev.status !== nextStatus && shouldAlertProject(prev)) {
        // offline ↔ degraded o‘zgarishi
        return {
          problem: {
            name: prev.name,
            status: getStatusLabel(nextStatus),
            notes,
          },
        };
      }

      return {};
    },
    [shouldAlertProject]
  );

  const refreshOne = useCallback(
    async (id: string) => {
      const list = projectsRef.current;
      const target = list.find((p) => p.id === id);
      if (!target) return;
      const result = await checkProjectHealth(target);
      const nextStatus = result.status || 'unknown';
      const t = collectTransitionAlerts(target, nextStatus, result.notes);
      if (t.problem) await notifyProblemsBatch([t.problem]);
      if (t.recovered) await notifyProjectRecovered(t.recovered);
      const next = list.map((p) => (p.id === id ? { ...p, ...result } : p));
      await persist(next);
    },
    [collectTransitionAlerts, persist]
  );

  const refreshAll = useCallback(async () => {
    setChecking(true);
    try {
      const list = projectsRef.current;
      const problems: Array<{ name: string; status: string; notes?: string }> = [];
      const recovered: string[] = [];

      const updated = await Promise.all(
        list.map(async (p) => {
          try {
            const result = await checkProjectHealth(p);
            const nextStatus = result.status || 'unknown';
            const t = collectTransitionAlerts(p, nextStatus, result.notes);
            if (t.problem) problems.push(t.problem);
            if (t.recovered) recovered.push(t.recovered);
            return { ...p, ...result };
          } catch (e) {
            const lastChecked = new Date().toISOString();
            const notes = e instanceof Error ? e.message : 'Tekshiruv xatosi';
            const t = collectTransitionAlerts(p, 'offline', notes);
            if (t.problem) problems.push(t.problem);
            return {
              ...p,
              status: 'offline' as const,
              lastChecked,
              notes,
            };
          }
        })
      );

      await persist(updated);
      if (problems.length > 0) await notifyProblemsBatch(problems);
      for (const name of recovered) {
        await notifyProjectRecovered(name);
      }
    } finally {
      setChecking(false);
    }
  }, [collectTransitionAlerts, persist]);

  const addProject = useCallback(
    async (input: ProjectInput) => {
      const id = input.id?.trim() || Date.now().toString();
      if (projectsRef.current.some((p) => p.id === id)) {
        return;
      }
      if (input.authToken) {
        await saveAuthToken(id, input.authToken);
      }
      const next: Project = {
        id,
        name: input.name,
        type: input.type,
        url: input.url,
        description: input.description,
        status: 'unknown',
        hasAuthToken: Boolean(input.authToken),
        authHeaderName: input.authHeaderName || 'Authorization',
        notifyOnDown: input.notifyOnDown ?? true,
        history: [],
        deployStatus: 'not_deployed',
      };
      await persist([next, ...projectsRef.current]);
    },
    [persist]
  );

  const importProjects = useCallback(
    async (incoming: Project[]) => {
      const { next, added } = mergeProjects(projectsRef.current, incoming);
      if (added > 0) {
        await persist(next);
      }
      return added;
    },
    [persist]
  );

  const syncCatalog = useCallback(async () => {
    const beforeIds = new Set(projectsRef.current.map((p) => p.id));
    const next = await reseedProjects(projectsRef.current);
    const added = next.filter((p) => !beforeIds.has(p.id)).length;
    await persist(next);
    return { added, total: next.length };
  }, [persist]);

  const syncFromGithub = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (githubSyncInFlight.current) {
        return { added: 0, total: projectsRef.current.length, names: [] as string[] };
      }
      githubSyncInFlight.current = true;
      if (!opts?.silent) setGithubSyncing(true);
      try {
        const s = settingsRef.current;
        const username = (s.githubUsername || GITHUB_USERNAME).trim();
        const token = await getGithubToken();
        const repos = await fetchGithubRepos(username, token);
        const incoming = repos.map(repoToProject);
        const before = projectsRef.current;
        const beforeIds = new Set(before.map((p) => p.id));
        const { next, added } = mergeProjects(before, incoming);
        if (added > 0) {
          await persist(next);
          const names = next
            .filter((p) => !beforeIds.has(p.id))
            .map((p) => p.name);
          await notifyGithubProjectsAdded(names);
          await persistSettings({
            ...s,
            lastGithubSyncAt: new Date().toISOString(),
          });
          return { added, total: next.length, names };
        }
        await persistSettings({
          ...s,
          lastGithubSyncAt: new Date().toISOString(),
        });
        return { added: 0, total: before.length, names: [] };
      } finally {
        githubSyncInFlight.current = false;
        if (!opts?.silent) setGithubSyncing(false);
      }
    },
    [persist, persistSettings]
  );

  const updateProject = useCallback(
    async (id: string, input: ProjectInput) => {
      if (input.authToken !== undefined) {
        if (input.authToken) await saveAuthToken(id, input.authToken);
        else await deleteAuthToken(id);
      }
      const next = projectsRef.current.map((p) =>
        p.id === id
          ? {
              ...p,
              name: input.name,
              type: input.type,
              url: input.url,
              description: input.description,
              authHeaderName: input.authHeaderName || p.authHeaderName || 'Authorization',
              hasAuthToken:
                input.authToken !== undefined
                  ? Boolean(input.authToken)
                  : p.hasAuthToken,
              notifyOnDown: input.notifyOnDown ?? p.notifyOnDown ?? true,
            }
          : p
      );
      await persist(next);
    },
    [persist]
  );

  const removeProject = useCallback(
    async (id: string) => {
      await deleteAuthToken(id);
      await persist(projectsRef.current.filter((p) => p.id !== id));
    },
    [persist]
  );

  const getById = useCallback(
    (id: string) => projectsRef.current.find((p) => p.id === id),
    []
  );

  const setAutoCheckEnabled = useCallback(
    async (enabled: boolean) => {
      await persistSettings({ ...settingsRef.current, autoCheckEnabled: enabled });
    },
    [persistSettings]
  );

  const setAutoGithubSyncEnabled = useCallback(
    async (enabled: boolean) => {
      await persistSettings({
        ...settingsRef.current,
        autoGithubSyncEnabled: enabled,
      });
    },
    [persistSettings]
  );

  const setProblemAlertsEnabled = useCallback(
    async (enabled: boolean) => {
      await persistSettings({
        ...settingsRef.current,
        problemAlertsEnabled: enabled,
      });
    },
    [persistSettings]
  );

  const setGithubUsername = useCallback(
    async (username: string) => {
      await persistSettings({
        ...settingsRef.current,
        githubUsername: username.trim() || GITHUB_USERNAME,
      });
    },
    [persistSettings]
  );

  const setGithubToken = useCallback(async (token: string) => {
    await saveGithubToken(token);
  }, []);

  // Health-check interval
  useEffect(() => {
    if (loading || !settings.autoCheckEnabled) return;
    if (projects.length === 0) return;

    const tick = () => {
      if (AppState.currentState === 'active') {
        refreshAll();
      }
    };

    const id = setInterval(tick, settings.autoCheckIntervalMs || AUTO_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [
    loading,
    settings.autoCheckEnabled,
    settings.autoCheckIntervalMs,
    projects.length,
    refreshAll,
  ]);

  // Ochilganda + interval: GitHubdagi BARCHA repolar
  useEffect(() => {
    if (loading) return;

    const run = () => {
      if (AppState.currentState !== 'active') return;
      if (!settingsRef.current.autoGithubSyncEnabled) {
        // Sync o‘chirilgan bo‘lsa ham birinchi marta katalogni to‘ldiramiz
        return;
      }
      syncFromGithub({ silent: true }).catch(() => undefined);
    };

    // Har doim ochilishda bir marta (auto sync o‘chirilgan bo‘lsa ham)
    syncFromGithub({ silent: true }).catch(() => undefined);

    if (!settings.autoGithubSyncEnabled) return;

    const id = setInterval(
      run,
      settings.autoGithubSyncIntervalMs || AUTO_GITHUB_SYNC_INTERVAL_MS
    );
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });

    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [
    loading,
    settings.autoGithubSyncEnabled,
    settings.autoGithubSyncIntervalMs,
    settings.githubUsername,
    syncFromGithub,
  ]);

  const value = useMemo(
    () => ({
      projects,
      loading,
      checking,
      githubSyncing,
      settings,
      summary: summarize(projects),
      refreshAll,
      refreshOne,
      addProject,
      importProjects,
      syncCatalog,
      syncFromGithub,
      updateProject,
      removeProject,
      getById,
      setAutoCheckEnabled,
      setAutoGithubSyncEnabled,
      setProblemAlertsEnabled,
      setGithubUsername,
      setGithubToken,
    }),
    [
      projects,
      loading,
      checking,
      githubSyncing,
      settings,
      refreshAll,
      refreshOne,
      addProject,
      importProjects,
      syncCatalog,
      syncFromGithub,
      updateProject,
      removeProject,
      getById,
      setAutoCheckEnabled,
      setAutoGithubSyncEnabled,
      setProblemAlertsEnabled,
      setGithubUsername,
      setGithubToken,
    ]
  );

  return (
    <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjects must be used within ProjectsProvider');
  return ctx;
}
