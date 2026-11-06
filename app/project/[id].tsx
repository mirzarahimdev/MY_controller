import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { HistoryChart } from '../../components/HistoryChart';
import { StatusBadge } from '../../components/StatusBadge';
import { colors, radius, spacing } from '../../constants/theme';
import { useProjects } from '../../context/ProjectsContext';
import {
  formatCheckedAt,
  getDeployLabel,
  getStatusColor,
  getTypeLabel,
} from '../../utils/status';

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={last ? styles.rowLast : styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getById, refreshOne, removeProject } = useProjects();
  const project = getById(id);
  const [busy, setBusy] = useState(false);

  if (!project) {
    return (
      <View style={styles.center}>
        <Text style={styles.missing}>Loyiha topilmadi</Text>
      </View>
    );
  }

  const onRefresh = async () => {
    setBusy(true);
    try {
      await refreshOne(project.id);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = () => {
    Alert.alert('O‘chirish', `"${project.name}" o‘chirilsinmi?`, [
      { text: 'Bekor', style: 'cancel' },
      {
        text: 'O‘chirish',
        style: 'destructive',
        onPress: async () => {
          await removeProject(project.id);
          router.back();
        },
      },
    ]);
  };

  const statusColor = getStatusColor(project.status);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroBand}>
        <View style={{ width: 5, alignSelf: 'stretch', backgroundColor: statusColor, borderRadius: 4 }} />
        <View style={styles.heroBody}>
          <View style={styles.header}>
            <Text style={styles.name}>{project.name}</Text>
            <StatusBadge status={project.status} />
          </View>
          <Text style={styles.desc}>{project.description}</Text>
        </View>
      </View>

      <HistoryChart history={project.history} />

      <Text style={styles.sectionTitle}>Server / deploy</Text>
      <View style={styles.card}>
        <Row label="Holat" value={getDeployLabel(project.deployStatus)} />
        <Row label="Domen" value={project.deployHost || '—'} />
        <Row label="Qayerda" value={project.deployWhere || '—'} />
        <Row label="Stack" value={project.deployStack || '—'} />
        <Row
          label="Batafsil"
          value={project.deployNotes || '—'}
          last
        />
      </View>

      <Text style={styles.sectionTitle}>Monitoring</Text>
      <View style={styles.card}>
        <Row label="Turi" value={getTypeLabel(project.type)} />
        <Row
          label="Health URL"
          value={project.url || 'Yo‘q — bot/mobile uchun qo‘lda kiriting'}
        />
        <Row label="Auth" value={project.hasAuthToken ? 'Token saqlangan' : 'Yo‘q'} />
        <Row
          label="Javob vaqti"
          value={project.responseMs != null ? `${project.responseMs} ms` : '—'}
        />
        <Row
          label="Uptime (tarixdan)"
          value={project.uptimePercent != null ? `${project.uptimePercent}%` : '—'}
        />
        <Row
          label="Ogohlantirish"
          value={project.notifyOnDown === false ? 'O‘chirilgan' : 'Yoqilgan'}
        />
        <Row
          label="So‘nggi tekshiruv"
          value={formatCheckedAt(project.lastChecked)}
          last={!project.notes}
        />
        {project.notes ? <Row label="Izoh" value={project.notes} last /> : null}
      </View>

      <Pressable style={busy ? styles.primaryBusy : styles.primary} onPress={onRefresh} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.primaryText}>Qayta tekshirish</Text>
          </>
        )}
      </Pressable>

      <Pressable style={styles.secondary} onPress={() => router.push(`/add?id=${project.id}`)}>
        <Ionicons name="create-outline" size={18} color={colors.accent} />
        <Text style={styles.secondaryText}>Tahrirlash</Text>
      </Pressable>

      <Pressable style={styles.danger} onPress={onDelete}>
        <Ionicons name="trash-outline" size={18} color={colors.offline} />
        <Text style={styles.dangerText}>O‘chirish</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  missing: { color: colors.muted, fontWeight: '600' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.soft,
    marginBottom: 8,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroBand: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  heroBody: { flex: 1, padding: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  name: {
    flex: 1,
    fontSize: 24,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  desc: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowLast: { paddingVertical: 14 },
  rowLabel: {
    fontSize: 12,
    color: colors.soft,
    fontWeight: '600',
    marginBottom: 4,
  },
  rowValue: {
    fontSize: 15,
    color: colors.ink,
    fontWeight: '600',
  },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  primaryBusy: {
    backgroundColor: colors.accentDark,
    borderRadius: radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondary: {
    borderRadius: radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accentSoft,
    marginBottom: 10,
  },
  secondaryText: { color: colors.accent, fontWeight: '700', fontSize: 15 },
  danger: {
    borderRadius: radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerSoft,
  },
  dangerText: { color: colors.offline, fontWeight: '700', fontSize: 15 },
});
