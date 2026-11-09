import cors from 'cors';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 8787;
const MAX_TIMEOUT_MS = 15000;

app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'mykontroller-proxy' });
});

/**
 * GitHub repos proxy — telefon to'g'ridan-to'g'ri api.github.com ga
 * ulana olmasa (CORS/SSL/User-Agent), PC orqali yuklaydi.
 * Query: ?username=...  Header (ixtiyoriy): Authorization: Bearer <token>
 */
app.get('/github/repos', async (req, res) => {
  const username = String(req.query.username || '').trim();
  const auth = req.headers.authorization;
  const token =
    typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')
      ? auth.slice(7).trim()
      : '';

  if (!username && !token) {
    return res.status(400).json({ ok: false, error: 'username or token required' });
  }

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'MyKontroller-Proxy',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const firstUrl = token
    ? 'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner'
    : `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&type=owner`;

  try {
    const repos = [];
    let url = firstUrl;

    while (url) {
      const response = await fetch(url, { headers });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text.slice(0, 200) };
      }

      if (!response.ok) {
        return res.status(response.status).json({
          ok: false,
          error: data?.message || `GitHub HTTP ${response.status}`,
        });
      }

      if (Array.isArray(data)) repos.push(...data);

      const link = response.headers.get('link') || '';
      const next = link
        .split(',')
        .map((p) => p.trim())
        .find((p) => p.includes('rel="next"'));
      url = next ? (next.match(/<([^>]+)>/) || [])[1] : null;
    }

    return res.json({ ok: true, repos });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: error instanceof Error ? error.message : 'GitHubga ulanib bo‘lmadi',
    });
  }
});

/**
 * Server-side health check — CORS/SSL client cheklovlarini aylanib o'tadi.
 * Body: { url, method?, headers?, timeoutMs? }
 */
app.post('/check', async (req, res) => {
  const { url, method = 'GET', headers = {}, timeoutMs = 8000 } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ ok: false, error: 'url required' });
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ ok: false, error: 'invalid url' });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({ ok: false, error: 'only http/https allowed' });
  }

  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Math.min(Number(timeoutMs) || 8000, MAX_TIMEOUT_MS)
  );

  try {
    const response = await fetch(url, {
      method: String(method || 'GET').toUpperCase(),
      headers: {
        'User-Agent': 'MyKontroller-Proxy',
        Accept: 'application/json, text/plain, */*',
        ...sanitizeHeaders(headers),
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    const responseMs = Date.now() - started;
    const httpOk = response.status >= 200 && response.status < 400;
    const bodyText = await response.text().catch(() => '');
    const path = parsed.pathname || '';
    const looksHealth = /\/health\/?$/i.test(path) || /\/api\/health\/?$/i.test(path);

    let bodyOk = true;
    let bodyNote;
    if (httpOk && looksHealth && bodyText) {
      try {
        const json = JSON.parse(bodyText);
        const st = String(json?.status ?? json?.ok ?? '').toLowerCase();
        const db = json?.database != null ? String(json.database).toLowerCase() : null;
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
        // HTML/health bo‘lmasa — faqat HTTP kodiga tayanamiz
      }
    }

    const ok = httpOk && bodyOk;
    return res.json({
      ok,
      status: ok ? (responseMs > 1500 ? 'degraded' : 'online') : 'offline',
      httpStatus: response.status,
      responseMs,
      notes: ok
        ? responseMs > 1500
          ? 'Javob sekin'
          : bodyNote
        : bodyNote || `HTTP ${response.status}`,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    clearTimeout(timeout);
    const responseMs = Date.now() - started;
    const message =
      error?.name === 'AbortError'
        ? 'Timeout'
        : error instanceof Error
          ? error.message
          : 'Ulanib bo‘lmadi';

    return res.json({
      ok: false,
      status: 'offline',
      httpStatus: 0,
      responseMs,
      notes: message,
      checkedAt: new Date().toISOString(),
    });
  }
});

function sanitizeHeaders(headers) {
  if (!headers || typeof headers !== 'object') return {};
  const out = {};
  for (const [key, value] of Object.entries(headers)) {
    if (typeof key !== 'string' || typeof value !== 'string') continue;
    const lower = key.toLowerCase();
    if (['host', 'content-length', 'connection'].includes(lower)) continue;
    out[key] = value;
  }
  return out;
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MyKontroller proxy listening on http://0.0.0.0:${PORT}`);
});
