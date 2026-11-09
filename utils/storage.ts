import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTO_CHECK_INTERVAL_MS, AUTO_GITHUB_SYNC_INTERVAL_MS } from '../constants/config';
import {
  GITHUB_SEED_VERSION,
  GITHUB_USERNAME,
  INITIAL_PROJECTS,
} from '../data/projects';
import { Project } from '../types/project';
import { isMonitorableUrl, sanitizeMonitorUrl } from './monitorUrl';

/** Soxta GitHub URL larni monitoringdan olib tashlash */
function scrubProject(p: Project): Project {
  const url = sanitizeMonitorUrl(p.url);
  if (url === p.url) return p;
  return {
    ...p,
    url,
    status: url ? p.status : p.status === 'online' || p.status === 'degraded' ? 'unknown' : p.status,
    notes:
      !url && p.url && !isMonitorableUrl(p.url)
        ? 'GitHub/repo URL olib tashlandi — production health emas'
        : p.notes,
  };
}

const PROJECTS_KEY = 'mykontroller.projects.v2';
const SETTINGS_KEY = 'mykontroller.settings.v1';
const SEED_KEY = 'mykontroller.github_seed.version';

export type AppSettings = {
  autoCheckEnabled: boolean;
  autoCheckIntervalMs: number;
  /** GitHubdan yangi repolarni avtomatik tortish */
  autoGithubSyncEnabled: boolean;
  githubUsername: string;
  autoGithubSyncIntervalMs: number;
  lastGithubSyncAt?: string;
  /** Offline/degraded bo‘lganda bildirishnoma */
  problemAlertsEnabled: boolean;
  /** Online ga qaytganda bildirishnoma */
  recoveryAlertsEnabled: boolean;
};

const DEFAULT_SETTINGS: AppSettings = {
  autoCheckEnabled: true,
  autoCheckIntervalMs: AUTO_CHECK_INTERVAL_MS,
  autoGithubSyncEnabled: true,
  githubUsername: GITHUB_USERNAME,
  autoGithubSyncIntervalMs: AUTO_GITHUB_SYNC_INTERVAL_MS,
  problemAlertsEnabled: true,
  recoveryAlertsEnabled: true,
};

/** Seed bilan merge: yangi qo‘shadi, mavjudlarning nom/URL/tavsifini yangilaydi */
export function upsertFromSeed(stored: Project[], seed: Project[]): Project[] {
  const map = new Map(stored.map((p) => [p.id, scrubProject(p)]));

  for (const s of seed) {
    const prev = map.get(s.id);
    if (!prev) {
      map.set(s.id, scrubProject({ ...s }));
      continue;
    }
    map.set(
      s.id,
      scrubProject({
        ...prev,
        name: s.name,
        type: s.type,
        url: s.url,
        description: s.description,
        notifyOnDown: s.notifyOnDown ?? prev.notifyOnDown,
        deployStatus: s.deployStatus,
        deployHost: s.deployHost,
        deployWhere: s.deployWhere,
        deployStack: s.deployStack,
        deployNotes: s.deployNotes,
        // status/history/response saqlanadi — keyingi Tekshirish yangilaydi
      })
    );
  }

  // Seed tartibida, keyin qo‘lda qo‘shilganlar
  const seedIds = new Set(seed.map((p) => p.id));
  const ordered = seed.map((s) => map.get(s.id)!);
  for (const p of map.values()) {
    if (!seedIds.has(p.id)) ordered.push(scrubProject(p));
  }
  return ordered;
}

export async function loadProjects(): Promise<Project[]> {
  const raw = await AsyncStorage.getItem(PROJECTS_KEY);
  const stored: Project[] = raw ? (JSON.parse(raw) as Project[]) : [];
  const seededVersion = await AsyncStorage.getItem(SEED_KEY);

  if (seededVersion === GITHUB_SEED_VERSION) {
    const scrubbed = stored.map(scrubProject);
    const changed = scrubbed.some((p, i) => p.url !== stored[i]?.url);
    if (changed) {
      await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(scrubbed));
    }
    return scrubbed;
  }

  const next = upsertFromSeed(stored, INITIAL_PROJECTS);
  await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(next));
  await AsyncStorage.setItem(SEED_KEY, GITHUB_SEED_VERSION);
  return next;
}

/** Katalogni majburiy qayta qo‘llash (barcha seed loyihalar) */
export async function reseedProjects(stored?: Project[]): Promise<Project[]> {
  const current =
    stored ??
    (JSON.parse((await AsyncStorage.getItem(PROJECTS_KEY)) || '[]') as Project[]);
  const next = upsertFromSeed(current, INITIAL_PROJECTS);
  await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(next));
  await AsyncStorage.setItem(SEED_KEY, GITHUB_SEED_VERSION);
  return next;
}

export async function saveProjects(projects: Project[]) {
  await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export async function loadSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as AppSettings) };
}

export async function saveSettings(settings: AppSettings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
