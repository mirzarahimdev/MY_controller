import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProjectCard } from '../../components/ProjectCard';
import { colors, radius, spacing } from '../../constants/theme';
import { useProjects } from '../../context/ProjectsContext';
import { ProjectType } from '../../types/project';
import { getDeployLabel, getTypeLabel } from '../../utils/status';

type FilterKey = 'all' | 'server' | ProjectType;

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Hammasi' },
  { key: 'server', label: 'Serverda' },
  { key: 'telegram_bot', label: 'Botlar' },
  { key: 'website', label: 'Saytlar' },
  { key: 'mobile_app', label: 'Mobile' },
];

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { projects, syncCatalog } = useProjects();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      const typeOk =
        filter === 'all'
          ? true
          : filter === 'server'
            ? p.deployStatus === 'live' || p.deployStatus === 'vps_bot' || p.deployStatus === 'partial'
            : p.type === filter;
      if (!typeOk) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.url || '').toLowerCase().includes(q) ||
        (p.deployHost || '').toLowerCase().includes(q) ||
        (p.deployWhere || '').toLowerCase().includes(q) ||
        getTypeLabel(p.type).toLowerCase().includes(q) ||
        getDeployLabel(p.deployStatus).toLowerCase().includes(q)
      );
    });
  }, [filter, projects, query]);

  return (
    <View style={styles.screen}>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.soft} />
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Qidirish..."
          placeholderTextColor={colors.soft}
          autoCapitalize="none"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.soft} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.toolbar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={active ? styles.chipActive : styles.chip}
              >
                <Text style={active ? styles.chipTextActive : styles.chipText}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          style={styles.ghBtn}
          onPress={async () => {
            const { added, total } = await syncCatalog();
            Alert.alert(
              'Katalog',
              added > 0 ? `${added} ta qo‘shildi · jami ${total}` : `Jami ${total} ta loyiha`
            );
            setFilter('all');
          }}
        >
          <Ionicons name="cloud-download-outline" size={18} color={colors.ink} />
        </Pressable>
        <Pressable
          style={styles.ghBtn}
          onPress={() => router.push('/import-github')}
        >
          <Ionicons name="logo-github" size={18} color={colors.ink} />
        </Pressable>
        <Pressable style={styles.addBtn} onPress={() => router.push('/add')}>
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <Text style={styles.count}>
          {filtered.length} ta ·{' '}
          {filter === 'all'
            ? 'barcha turi'
            : filter === 'server'
              ? 'serverdagi'
              : getTypeLabel(filter)}
        </Text>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="folder-open-outline" size={32} color={colors.soft} />
            <Text style={styles.emptyTitle}>Loyiha topilmadi</Text>
            <Text style={styles.emptyText}>Boshqa filtr/qidiruv yoki yangi qo‘shing</Text>
            <Pressable
              style={styles.emptyGh}
              onPress={() => router.push('/import-github')}
            >
              <Ionicons name="logo-github" size={16} color="#fff" />
              <Text style={styles.emptyGhText}>GitHubdan import</Text>
            </Pressable>
          </View>
        ) : (
          filtered.map((p) => <ProjectCard key={p.id} project={p} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  searchWrap: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  search: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
    padding: 0,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
    gap: 8,
  },
  filtersScroll: {
    flex: 1,
    minWidth: 0,
  },
  filters: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 8,
    alignItems: 'center',
  },
  ghBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  chipText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyGh: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  emptyGhText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  count: {
    marginBottom: spacing.sm,
    color: colors.soft,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  emptyText: { fontSize: 13, color: colors.muted },
});
