import { API_URL, HISTORY_LIMIT } from '../constants/config';
import { colors } from '../constants/theme';
import {
  CheckHistoryItem,
  DeployStatus,
  Project,
  ProjectStatus,
  ProjectType,
  StatusSummary,
} from '../types/project';
import { isMonitorableUrl } from './monitorUrl';
import { getAuthToken } from './secure';
import { calcUptimePercent } from './uptime';

export { calcUptimePercent } from './uptime';

export function getStatusColor(status: ProjectStatus): string {
  switch (status) {
    case 'online':
      return colors.online;
    case 'offline':
      return colors.offline;
    case 'degraded':
      return colors.degraded;
    default:
      return colors.unknown;
  }
}

export function getStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case 'online':
      return 'Ishlayapti';
    case 'offline':
      return 'Ishlamayapti';
    case 'degraded':
      return 'Sekin';
    default:
      return 'Tekshirilmagan';
  }
}

export function getTypeLabel(type: ProjectType): string {
  switch (type) {
    case 'telegram_bot':
      return 'Telegram bot';
    case 'website':
      return 'Veb-sayt';
    case 'mobile_app':
      return 'Mobile ilova';
  }
}

export function getTypeIcon(type: ProjectType): string {
  switch (type) {
    case 'telegram_bot':
      return 'paper-plane';
    case 'website':
      return 'globe';
    case 'mobile_app':
      return 'phone-portrait';
  }
}

export function getDeployLabel(status?: DeployStatus): string {
  switch (status) {
    case 'live':
      return 'Serverda';
    case 'partial':
      return 'Qisman';
    case 'vps_bot':
      return 'VPS bot';
    case 'not_deployed':
      return 'Deploy yo‘q';
    default:
      return 'Noma’lum';
  }
}

export function getDeployColor(status?: DeployStatus): string {
  switch (status) {
    case 'live':
      return colors.online;
    case 'partial':
      return colors.degraded;
    case 'vps_bot':
      return colors.accent;
    case 'not_deployed':
      return colors.soft;
    default:
      return colors.unknown;
  }
}

export function summarize(projects: Project[]): StatusSummary {
  return projects.reduce(
    (acc, p) => {
      acc.total += 1;
      acc[p.status] += 1;
      return acc;
    },
    { total: 0, online: 0, offline: 0, degraded: 0, unknown: 0 } as StatusSummary
  );
}

export function formatCheckedAt(iso?: string): string {
  if (!iso) return 'Hali tekshirilmagan';
  const d = new Date(iso);
  return d.toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function appendHistory(
  prev: CheckHistoryItem[] | undefined,
  item: CheckHistoryItem
): CheckHistoryItem[] {
  return [...(prev || []), item].slice(-HISTORY_LIMIT);
}

async function checkViaProxy(
  project: Project
): Promise<Pick<Project, 'status' | 'lastChecked' | 'responseMs' | 'notes'>> {
  const token = await getAuthToken(project.id);
  const headers: Record<string, string> = {};
  if (token) {
    headers[project.authHeaderName || 'Authorization'] = token.startsWith('Bearer ')
      ? token
      : `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: project.url,
      headers,
      timeoutMs: 8000,
    }),
  });

  if (!res.ok) {
    throw new Error(`Proxy HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    status: ProjectStatus;
    responseMs?: number;
    notes?: string;
    checkedAt?: string;
  };

  return {
    status: data.status || 'unknown',
    lastChecked: data.checkedAt || new Date().toISOString(),
    responseMs: data.responseMs,
    notes: data.notes,
  };
}

async function checkDirect(
  project: Project
): Promise<Pick<Project, 'status' | 'lastChecked' | 'responseMs' | 'notes'>> {
  const started = Date.now();
  const token = await getAuthToken(project.id);
  const headers: Record<string, string> = {};
  if (token) {
    headers[project.authHeaderName || 'Authorization'] = token.startsWith('Bearer ')
      ? token
      : `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(project.url!, {
      method: 'GET',
      headers: { Accept: 'application/json, text/plain, */*', ...headers },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const ms = Date.now() - started;
    const bodyText = await res.text().catch(() => '');
    let path = '';
    try {
      path = new URL(project.url!).pathname;
    } catch {
      path = '';
    }
    const looksHealth = /\/health\/?$/i.test(path) || /\/api\/health\/?$/i.test(path);
    let bodyOk = true;
    let bodyNote: string | undefined;
    if (res.ok && looksHealth && bodyText) {
      try {
        const json = JSON.parse(bodyText) as {
          status?: string;
          ok?: boolean | string;
          database?: string;
          service?: string;
        };
        const st = String(json?.status ?? json?.ok ?? '').toLowerCase();
        const db =
          json?.database != null ? String(json.database).toLowerCase() : null;
        const healthy =
          st === 'ok' ||
          st === 'healthy' ||
          st === 'up' ||
          st === 'pass' ||
          st === 'true' ||
          json?.ok === true;
        if (!healthy && st) {
          bodyOk = false;
          bodyNote = `Health body: status=${json.status}`;
        } else if (db && db !== 'ok' && db !== 'healthy' && db !== 'up') {
          bodyOk = false;
          bodyNote = `Database: ${json.database}`;
        } else if (healthy) {
          bodyNote = json.service ? `OK · ${json.service}` : 'Health OK';
        }
      } catch {
        // ignore
      }
    }
    if (res.ok && bodyOk) {
      return {
        status: ms > 1500 ? 'degraded' : 'online',
        lastChecked: new Date().toISOString(),
        responseMs: ms,
        notes: ms > 1500 ? 'Javob sekin' : bodyNote,
      };
    }
    return {
      status: 'offline',
      lastChecked: new Date().toISOString(),
      responseMs: ms,
      notes: bodyNote || `HTTP ${res.status}`,
    };
  } catch (e) {
    clearTimeout(timeout);
    return {
      status: 'offline',
      lastChecked: new Date().toISOString(),
      responseMs: Date.now() - started,
      notes: e instanceof Error ? e.message : 'Ulanib bo‘lmadi',
    };
  }
}

/** Avval proxy, ishlamasa to‘g‘ridan-to‘g‘ri fetch */
export async function checkProjectHealth(project: Project): Promise<Partial<Project>> {
  if (!isMonitorableUrl(project.url)) {
    const lastChecked = new Date().toISOString();
    const reason = project.url
      ? 'GitHub/repo URL — production health emas'
      : project.type === 'telegram_bot'
        ? 'HTTP health yo‘q (Telegram bot)'
        : project.type === 'mobile_app'
          ? 'HTTP health yo‘q (mobile ilova)'
          : 'Tekshiriladigan production URL yo‘q';
    const history = appendHistory(project.history, {
      at: lastChecked,
      status: 'unknown',
      notes: reason,
    });
    return {
      status: 'unknown',
      lastChecked,
      responseMs: undefined,
      notes: reason,
      // Soxta GitHub URL larni saqlamaymiz
      ...(project.url && !isMonitorableUrl(project.url) ? { url: undefined } : {}),
      history,
      uptimePercent: calcUptimePercent(history),
    };
  }

  let result: Pick<Project, 'status' | 'lastChecked' | 'responseMs' | 'notes'>;
  try {
    result = await checkViaProxy(project);
  } catch {
    result = await checkDirect(project);
  }

  const history = appendHistory(project.history, {
    at: result.lastChecked || new Date().toISOString(),
    status: result.status,
    responseMs: result.responseMs,
    notes: result.notes,
  });

  return {
    ...result,
    history,
    uptimePercent: calcUptimePercent(history),
  };
}
