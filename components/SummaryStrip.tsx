import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { StatusSummary } from '../types/project';

function Cell({
  label,
  value,
  color,
  last,
}: {
  label: string;
  value: number;
  color: string;
  last?: boolean;
}) {
  return (
    <View style={last ? styles.cell : styles.cellBorder}>
      <Text style={{ fontSize: 22, fontWeight: '800', color }}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function SummaryStrip({ summary }: { summary: StatusSummary }) {
  return (
    <View style={styles.wrap}>
      <Cell label="Jami" value={summary.total} color={colors.ink} />
      <Cell label="Ishlayapti" value={summary.online} color={colors.online} />
      <Cell label="Sekin" value={summary.degraded} color={colors.degraded} />
      <Cell label="Yo‘q" value={summary.offline} color={colors.offline} last />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  cellBorder: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },
});
