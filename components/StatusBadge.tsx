import React from 'react';
import { Text, View } from 'react-native';
import { ProjectStatus } from '../types/project';
import { getStatusColor, getStatusLabel } from '../utils/status';

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const color = getStatusColor(status);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        borderWidth: 1,
        backgroundColor: `${color}18`,
        borderColor: color,
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontSize: 12, fontWeight: '700', color }}>{getStatusLabel(status)}</Text>
    </View>
  );
}
