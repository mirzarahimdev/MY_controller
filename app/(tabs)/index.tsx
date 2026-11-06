import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProjectCard } from '../../components/ProjectCard';
import { SummaryStrip } from '../../components/SummaryStrip';
import { colors, radius, spacing } from '../../constants/theme';
import { useProjects } from '../../context/ProjectsContext';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    projects,
    summary,
    checking,
    githubSyncing,
    refreshAll,
    loading,
    settings,
    setAutoCheckEnabled,
    setAutoGithubSyncEnabled,
    setProblemAlertsEnabled,
    syncCatalog,
    syncFromGithub,
  } = useProjects();

  const alerts = useMemo(
    () => projects.filter((p) => p.status === 'offline' || p.status === 'degraded'),
    [projects]
  );

  const onSyncCatalog = async () => {
    const { added, total } = await syncCatalog();
    Alert.alert(
      'Katalog',
      added > 0
        ? `${added} ta yangi loyiha qo‘shildi. Jami: ${total}`
        : `Barcha katalog loyihalari bor. Jami: ${total}`
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.md,
        paddingBottom: insets.bottom + 28,
      }}
      refreshControl={
        <RefreshControl refreshing={checking} onRefresh={refreshAll} tintColor={colors.accent} />
      }
    >
      <View style={styles.hero}>
        <Text style={styles.brand}>MyKontroller</Text>
        <Text style={styles.subtitle}>
          Bot, sayt va mobile loyihalaringiz holatini kuzating
        </Text>

        <View style={styles.actions}>
          <Pressable
            style={checking ? styles.btnPrimaryBusy : styles.btnPrimary}
            onPress={refreshAll}
            disabled={checking}
          >
            {checking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.btnPrimaryText}>Tekshirish</Text>
              </>
            )}
          </Pressable>

          <Pressable style={styles.btnGhost} onPress={() => router.push('/add')}>
            <Ionicons name="add" size={18} color={colors.accent} />
            <Text style={styles.btnGhostText}>Qo‘shish</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.btnGithub}
          onPress={() => router.push('/import-github')}
        >
          <Ionicons name="logo-github" size={18} color={colors.accent} />
          <Text style={styles.btnGhostText}>GitHubdan import</Text>
        </Pressable>
      </View>

      <View style={styles.autoRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.autoTitle}>Avtomatik tekshiruv</Text>
          <Text style={styles.autoSub}>Har 1 daqiqada (ilova ochiq bo‘lganda)</Text>
        </View>
        <Switch
          value={settings.autoCheckEnabled}
          onValueChange={setAutoCheckEnabled}
          trackColor={{ true: colors.accent, false: colors.line }}
        />
      </View>

      <View style={styles.autoRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.autoTitle}>Muammo bildirishnomasi</Text>
          <Text style={styles.autoSub}>
            Offline / sekin bo‘lsa avtomatik notification (tiklanganda ham)
          </Text>
        </View>
        <Switch
          value={settings.problemAlertsEnabled !== false}
          onValueChange={setProblemAlertsEnabled}
          trackColor={{ true: colors.accent, false: colors.line }}
        />
      </View>

      <View style={styles.autoRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.autoTitle}>GitHub avto-sync</Text>
          <Text style={styles.autoSub}>
            @{settings.githubUsername || 'mirzarahimdev'} · har 5 daqiqa + ilova ochilganda
            {settings.lastGithubSyncAt
              ? `\nOxirgi: ${new Date(settings.lastGithubSyncAt).toLocaleString('uz-UZ')}`
              : ''}
          </Text>
        </View>
        <Switch
          value={settings.autoGithubSyncEnabled}
          onValueChange={setAutoGithubSyncEnabled}
          trackColor={{ true: colors.accent, false: colors.line }}
        />
      </View>

      <Pressable
        style={githubSyncing ? styles.syncBtnBusy : styles.syncBtn}
        onPress={async () => {
          try {
            const { added, total, names } = await syncFromGithub();
            Alert.alert(
              'GitHub sync',
              added > 0
                ? `Yangi: ${names.join(', ')}\nJami: ${total}`
                : `Yangi repo yo‘q. Jami: ${total}`
            );
          } catch (e) {
            Alert.alert(
              'Xato',
              e instanceof Error ? e.message : 'GitHub sync muvaffaqiyatsiz'
            );
          }
        }}
        disabled={githubSyncing}
      >
        {githubSyncing ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <>
            <Ionicons name="logo-github" size={18} color={colors.accent} />
            <Text style={styles.syncText}>Hozir GitHubdan yangilash</Text>
          </>
        )}
      </Pressable>

      <SummaryStrip summary={summary} />

      {projects.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="rocket-outline" size={26} color={colors.accent} />
          <View style={styles.emptyCopy}>
            <Text style={styles.emptyTitle}>Loyiha qo‘shing</Text>
            <Text style={styles.emptyText}>Bot, sayt yoki mobile API URL ni kiriting</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.sectionHead}>
        <Text style={styles.section}>Muammolar</Text>
        <Text style={styles.sectionMeta}>{alerts.length} ta</Text>
      </View>
      {projects.length > 0 && alerts.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="checkmark-circle" size={26} color={colors.online} />
          <View style={styles.emptyCopy}>
            <Text style={styles.emptyTitle}>Hammasi joyida</Text>
            <Text style={styles.emptyText}>Offline yoki sekin loyiha yo‘q</Text>
          </View>
        </View>
      ) : (
        alerts.map((p) => <ProjectCard key={p.id} project={p} />)
      )}

      <View style={styles.sectionHeadSpaced}>
        <Text style={styles.section}>Barcha loyihalar</Text>
        <Text style={styles.sectionMeta}>{projects.length} ta</Text>
      </View>
      {projects.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="folder-open-outline" size={26} color={colors.soft} />
          <View style={styles.emptyCopy}>
            <Text style={styles.emptyTitle}>Ro‘yxat bo‘sh</Text>
            <Text style={styles.emptyText}>Katalogni yangilang yoki GitHubdan import qiling</Text>
          </View>
        </View>
      ) : (
        projects.map((p) => <ProjectCard key={p.id} project={p} />)
      )}

      <Pressable style={styles.catalogBtn} onPress={onSyncCatalog}>
        <Ionicons name="cloud-download-outline" size={18} color={colors.accent} />
        <Text style={styles.syncText}>Mahalliy katalog ({projects.length})</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  hero: {
    marginBottom: spacing.lg,
  },
  brand: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
    maxWidth: 320,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.md,
  },
  btnGithub: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  autoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  autoTitle: {
    fontWeight: '700',
    color: colors.ink,
    fontSize: 15,
  },
  autoSub: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 12,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  btnPrimaryBusy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.accentDark,
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  btnGhost: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
  },
  btnGhostText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 15,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionHeadSpaced: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  section: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.ink,
  },
  sectionMeta: {
    fontSize: 13,
    color: colors.soft,
    fontWeight: '600',
  },
  link: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '700',
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },
  emptyCopy: {
    flex: 1,
  },
  emptyTitle: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 15,
  },
  syncBtn: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  syncBtnBusy: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  catalogBtn: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  syncText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  emptyText: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 13,
  },
});
