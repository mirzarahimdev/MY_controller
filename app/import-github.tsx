import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { useProjects } from '../context/ProjectsContext';
import { GITHUB_USERNAME } from '../data/projects';
import { Project } from '../types/project';
import {
  fetchGithubRepos,
  GithubRepo,
  repoToProject,
} from '../utils/github';
import { getTypeLabel } from '../utils/status';

export default function ImportGithubScreen() {
  const router = useRouter();
  const {
    projects,
    addProject,
    importProjects,
    setGithubUsername,
    setGithubToken,
    settings,
  } = useProjects();
  const [username, setUsername] = useState(
    settings.githubUsername || GITHUB_USERNAME
  );
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const existingIds = useMemo(() => new Set(projects.map((p) => p.id)), [projects]);

  const onFetch = async () => {
    if (!username.trim() && !token.trim()) {
      Alert.alert('Xato', 'GitHub username yoki token kiriting');
      return;
    }
    setLoading(true);
    try {
      const user = username.trim() || GITHUB_USERNAME;
      await setGithubUsername(user);
      if (token.trim()) await setGithubToken(token.trim());
      const list = await fetchGithubRepos(user, token);
      setRepos(list);
      const next: Record<string, boolean> = {};
      for (const r of list) {
        const id = `gh:${r.full_name}`;
        next[r.full_name] = !existingIds.has(id);
      }
      setSelected(next);
      if (list.length === 0) {
        Alert.alert('Bo‘sh', 'Ochiq repo topilmadi. Private uchun token qo‘shing.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Yuklash muvaffaqiyatsiz';
      Alert.alert(
        'Xato',
        msg.includes('Network') || msg.includes('ulanib')
          ? `${msg}\n\nPC da proxy server ishlasin (npm run server) va telefon bir xil Wi‑Fi da bo‘lsin.`
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  const toggle = (fullName: string) => {
    setSelected((prev) => ({ ...prev, [fullName]: !prev[fullName] }));
  };

  const selectAllNew = () => {
    const next: Record<string, boolean> = {};
    for (const r of repos) {
      const id = `gh:${r.full_name}`;
      next[r.full_name] = !existingIds.has(id);
    }
    setSelected(next);
  };

  const importSelected = async (incoming: Project[]) => {
    if (typeof importProjects === 'function') {
      return importProjects(incoming);
    }

    // Fast Refresh ba'zan eski context qoldiradi — addProject bilan zaxira
    let added = 0;
    for (const p of incoming) {
      if (existingIds.has(p.id)) continue;
      await addProject({
        id: p.id,
        name: p.name,
        type: p.type,
        url: p.url,
        description: p.description,
        notifyOnDown: p.notifyOnDown,
      });
      added += 1;
    }
    return added;
  };

  const onImport = async () => {
    const incoming: Project[] = repos
      .filter((r) => selected[r.full_name])
      .map(repoToProject);
    if (incoming.length === 0) {
      Alert.alert('Tanlang', 'Kamida bitta repo tanlang');
      return;
    }
    setImporting(true);
    try {
      const added = await importSelected(incoming);
      Alert.alert(
        'Tayyor',
        added > 0 ? `${added} ta loyiha qo‘shildi` : 'Yangi loyiha yo‘q (hammasi bor)',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert(
        'Xato',
        e instanceof Error ? e.message : 'Import muvaffaqiyatsiz. Ilovani Reload qiling.'
      );
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.hint}>
        GitHubdagi barcha repolaringiz (public + private) shu yerda chiqadi.
        Private va rate-limit uchun Personal Access Token (repo scope) majburiy
        emas, lekin tavsiya etiladi — bir marta saqlanadi.
      </Text>

      <Text style={styles.label}>GitHub username</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={GITHUB_USERNAME}
        placeholderTextColor={colors.soft}
      />

      <Text style={styles.label}>Token (ixtiyoriy, private uchun)</Text>
      <TextInput
        style={styles.input}
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
        secureTextEntry
        placeholder="ghp_..."
        placeholderTextColor={colors.soft}
      />

      <Pressable
        style={loading ? styles.btnBusy : styles.btn}
        onPress={onFetch}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="logo-github" size={18} color="#fff" />
            <Text style={styles.btnText}>Repolarni yuklash</Text>
          </>
        )}
      </Pressable>

      {repos.length > 0 ? (
        <>
          <View style={styles.listHeader}>
            <Text style={styles.count}>{repos.length} ta repo</Text>
            <Pressable onPress={selectAllNew}>
              <Text style={styles.link}>Yangi hammasini tanlash</Text>
            </Pressable>
          </View>

          {repos.map((r) => {
            const id = `gh:${r.full_name}`;
            const exists = existingIds.has(id);
            const on = Boolean(selected[r.full_name]);
            return (
              <Pressable
                key={r.full_name}
                style={on ? styles.rowOn : styles.row}
                onPress={() => toggle(r.full_name)}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.rowName}>{r.name}</Text>
                  <Text style={styles.rowMeta}>
                    {getTypeLabel(repoToProject(r).type)}
                    {r.private ? ' · private' : ''}
                    {exists ? ' · allaqachon bor' : ''}
                  </Text>
                </View>
                <Ionicons
                  name={on ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={on ? colors.accent : colors.soft}
                />
              </Pressable>
            );
          })}

          <Pressable
            style={importing ? styles.btnBusy : styles.btn}
            onPress={onImport}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Import ({selectedCount})</Text>
            )}
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  hint: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.soft,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: colors.ink,
  },
  btn: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  btnBusy: {
    marginTop: spacing.md,
    backgroundColor: colors.accentDark,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  listHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: { color: colors.soft, fontWeight: '600' },
  link: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 8,
  },
  rowOn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 8,
  },
  rowMain: { flex: 1 },
  rowName: { fontWeight: '700', color: colors.ink, fontSize: 15 },
  rowMeta: { marginTop: 2, color: colors.muted, fontSize: 12 },
});
