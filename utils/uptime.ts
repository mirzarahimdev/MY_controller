import { CheckHistoryItem } from '../types/project';

export function calcUptimePercent(history: CheckHistoryItem[] = []): number | undefined {
  if (!history.length) return undefined;
  const up = history.filter((h) => h.status === 'online' || h.status === 'degraded').length;
  return Math.round((up / history.length) * 1000) / 10;
}
