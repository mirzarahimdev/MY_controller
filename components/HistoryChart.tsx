import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { CheckHistoryItem } from '../types/project';
import { getStatusColor } from '../utils/status';

export function HistoryChart({ history = [] }: { history?: CheckHistoryItem[] }) {
  const items = useMemo(() => history.slice(-24), [history]);

  if (!items.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Hali tarix yo‘q — tekshiruvdan keyin chiqadi</Text>
      </View>
    );
  }

  const maxMs = Math.max(...items.map((i) => i.responseMs || 1), 1);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>So‘nggi tekshiruvlar</Text>
      <View style={styles.chart}>
        {items.map((item, idx) => {
          const h = Math.max(8, Math.round(((item.responseMs || 0) / maxMs) * 72));
          return (
            <View key={`${item.at}-${idx}`} style={styles.col}>
              <View
                style={{
                  width: 8,
                  height: h,
                  borderRadius: 4,
                  backgroundColor: getStatusColor(item.status),
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Chap → o‘ng: eski → yangi</Text>
        <Text style={styles.legendText}>{items.length} ta nuqta</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 12,
  },
  chart: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  legend: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendText: {
    fontSize: 11,
    color: colors.soft,
    fontWeight: '600',
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
  },
});
