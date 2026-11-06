import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { Project } from '../types/project';
import {
  formatCheckedAt,
  getDeployColor,
  getDeployLabel,
  getStatusColor,
  getTypeIcon,
  getTypeLabel,
} from '../utils/status';
import { StatusBadge } from './StatusBadge';

export function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const statusColor = getStatusColor(project.status);
  const deployColor = getDeployColor(project.deployStatus);

  return (
    <Pressable
      onPress={() => router.push(`/project/${project.id}`)}
      style={({ pressed }) => (pressed ? styles.rowPressed : styles.row)}
    >
      <View style={{ width: 4, alignSelf: 'stretch', backgroundColor: statusColor, borderRadius: 4 }} />
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.iconWrap}>
            <Ionicons
              name={getTypeIcon(project.type) as keyof typeof Ionicons.glyphMap}
              size={18}
              color={colors.accent}
            />
          </View>
          <View style={styles.meta}>
            <Text style={styles.name} numberOfLines={1}>
              {project.name}
            </Text>
            <Text style={styles.type}>
              {getTypeLabel(project.type)} · {getDeployLabel(project.deployStatus)}
            </Text>
          </View>
          <StatusBadge status={project.status} />
        </View>
        <Text style={styles.desc} numberOfLines={2}>
          {project.description}
        </Text>
        {project.deployHost && project.deployHost !== '—' ? (
          <Text style={[styles.deployHost, { color: deployColor }]} numberOfLines={1}>
            {project.deployHost}
          </Text>
        ) : null}
        {project.url ? (
          <Text style={styles.url} numberOfLines={1}>
            {project.url}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {project.responseMs != null ? `${project.responseMs} ms` : '— ms'}
          </Text>
          <Text style={styles.footerText}>{formatCheckedAt(project.lastChecked)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  rowPressed: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    opacity: 0.9,
  },
  body: {
    flex: 1,
    padding: spacing.md,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  type: {
    fontSize: 12,
    color: colors.soft,
    marginTop: 2,
  },
  desc: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  deployHost: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
  },
  url: {
    marginTop: 4,
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 12,
    color: colors.soft,
    fontWeight: '600',
  },
});
