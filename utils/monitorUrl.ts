/** Production health uchun yaroqli URL — GitHub sahifa/API emas */
export function isMonitorableUrl(url?: string | null): boolean {
  if (!url || !String(url).trim()) return false;
  try {
    const u = new URL(String(url).trim());
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    const host = u.hostname.toLowerCase();
    if (host === 'github.com' || host === 'www.github.com') return false;
    if (host === 'api.github.com') return false;
    if (host === 'raw.githubusercontent.com') return false;
    if (host === 'gist.github.com') return false;
    return true;
  } catch {
    return false;
  }
}

export function sanitizeMonitorUrl(url?: string | null): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  return isMonitorableUrl(trimmed) ? trimmed : undefined;
}
