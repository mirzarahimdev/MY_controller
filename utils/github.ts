import { API_URL } from '../constants/config';
import { knownReposAsGithub } from '../data/githubCatalog';
import { GITHUB_USERNAME } from '../data/projects';
import { Project, ProjectType } from '../types/project';
import { isMonitorableUrl, sanitizeMonitorUrl } from './monitorUrl';

export type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  private: boolean;
  fork: boolean;
  owner?: { login?: string };
};

function inferType(repo: GithubRepo): ProjectType {
  const n = repo.name.toLowerCase();
  if (n.includes('bot') || n.includes('_bot') || n.includes('-bot')) {
    return 'telegram_bot';
  }
  if (
    n.includes('app') ||
    n.includes('android') ||
    n.includes('ios') ||
    n.includes('mobile') ||
    n.includes('apk')
  ) {
    return 'mobile_app';
  }
  return 'website';
}

export function repoToProject(repo: GithubRepo): Project {
  const type = inferType(repo);
  const home = sanitizeMonitorUrl(repo.homepage);
  const hasLiveUrl = Boolean(home && isMonitorableUrl(home));
  return {
    id: `gh:${repo.full_name}`,
    name: repo.name,
    type,
    // Faqat haqiqiy production URL — GitHub sahifa/API monitoring emas
    url: hasLiveUrl ? home : undefined,
    description:
      repo.description ||
      `GitHub${repo.private ? ' (private)' : ''}: ${repo.html_url}`,
    status: 'unknown',
    notifyOnDown: hasLiveUrl,
    history: [],
    deployStatus: hasLiveUrl ? 'partial' : 'not_deployed',
    deployHost: hasLiveUrl ? home : '—',
    deployWhere: hasLiveUrl
      ? 'GitHub homepage (tasdiqlanmagan)'
      : 'GitHub repo — production URL yo‘q',
    deployStack: repo.language || '—',
    deployNotes: `Repo: ${repo.html_url}`,
  };
}

/** Faqat fork va profile README repolarini tashlab ketamiz */
function filterRepos(data: GithubRepo[], username: string): GithubRepo[] {
  const u = username.toLowerCase();
  return data.filter((r) => {
    if (r.fork) return false;
    if (r.name.toLowerCase() === u) return false;
    return true;
  });
}

/** API + known katalogni birlashtirish (API ustun) */
export function mergeRepoLists(
  fromApi: GithubRepo[],
  username: string
): GithubRepo[] {
  const map = new Map<string, GithubRepo>();
  for (const r of knownReposAsGithub()) {
    map.set(r.full_name.toLowerCase(), r);
  }
  for (const r of fromApi) {
    map.set(r.full_name.toLowerCase(), r);
  }
  // Boshqa user repolari (token orqali) ham qoladi
  return filterRepos(Array.from(map.values()), username).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

async function fetchAllPages(
  firstUrl: string,
  headers: Record<string, string>
): Promise<GithubRepo[]> {
  const all: GithubRepo[] = [];
  let url: string | null = firstUrl;

  while (url) {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitHub API ${res.status}: ${body.slice(0, 160)}`);
    }
    const page = (await res.json()) as GithubRepo[];
    if (!Array.isArray(page)) {
      throw new Error('GitHub javobi noto‘g‘ri');
    }
    all.push(...page);

    const link = res.headers.get('link') || res.headers.get('Link') || '';
    const next = link
      .split(',')
      .map((p) => p.trim())
      .find((p) => p.includes('rel="next"'));
    if (next) {
      const m = next.match(/<([^>]+)>/);
      url = m?.[1] || null;
    } else {
      url = null;
    }
  }

  return all;
}

async function fetchViaProxy(
  username: string,
  token?: string
): Promise<GithubRepo[]> {
  const qs = encodeURIComponent(username);
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token?.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  const res = await fetch(`${API_URL}/github/repos?username=${qs}&all=1`, {
    headers,
  });
  const data = (await res.json()) as {
    ok?: boolean;
    repos?: GithubRepo[];
    error?: string;
  };

  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Proxy HTTP ${res.status}`);
  }

  return data.repos || [];
}

async function fetchDirect(
  username: string,
  token?: string
): Promise<GithubRepo[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (token?.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  const url = token?.trim()
    ? 'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner'
    : `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&type=owner`;

  return fetchAllPages(url, headers);
}

/**
 * Barcha GitHub repolarini olish.
 * API ishlamasa (rate limit) — known katalog + oldingi cache qo‘llanadi.
 */
export async function fetchGithubRepos(
  username = GITHUB_USERNAME,
  token?: string
): Promise<GithubRepo[]> {
  const user = username.trim() || GITHUB_USERNAME;
  let fromApi: GithubRepo[] = [];

  try {
    fromApi = await fetchViaProxy(user, token);
  } catch {
    try {
      fromApi = await fetchDirect(user, token);
    } catch {
      fromApi = [];
    }
  }

  // Token bilan kelgan repolar boshqa username bo‘lishi mumkin — saqlaymiz
  if (token?.trim() && fromApi.length > 0) {
    const owned = fromApi.filter(
      (r) =>
        (r.owner?.login || r.full_name.split('/')[0] || '').toLowerCase() ===
          user.toLowerCase() ||
        r.full_name.toLowerCase().startsWith(`${user.toLowerCase()}/`)
    );
    // Agar filter bo‘sh qolsa — hammasi
    fromApi = owned.length > 0 ? owned : fromApi;
  }

  const merged = mergeRepoLists(fromApi, user);
  if (merged.length === 0) {
    throw new Error(
      'GitHub repolari topilmadi. Token qo‘shing yoki proxy/internetni tekshiring.'
    );
  }
  return merged;
}

export function mergeProjects(existing: Project[], incoming: Project[]): {
  next: Project[];
  added: number;
} {
  const map = new Map(existing.map((p) => [p.id, p]));
  let added = 0;
  for (const p of incoming) {
    if (!map.has(p.id)) {
      map.set(p.id, p);
      added += 1;
    }
  }
  // GitHub loyihalari oldinda
  const gh = incoming.map((p) => map.get(p.id)!);
  const rest = Array.from(map.values()).filter(
    (p) => !incoming.some((i) => i.id === p.id)
  );
  return { next: [...gh, ...rest], added };
}
