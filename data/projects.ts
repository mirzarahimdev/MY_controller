import { Project } from '../types/project';

export const GITHUB_USERNAME = 'mirzarahimdev';

/** Seed o‘zgarganda bump — URL + deploy maydonlari yangilanadi */
export const GITHUB_SEED_VERSION = 'mirzarahimdev.v4-all';

function page(repo: string): string {
  return `https://github.com/${GITHUB_USERNAME}/${repo}`;
}

function project(
  partial: Omit<Project, 'status' | 'history'> & { status?: Project['status'] }
): Project {
  return {
    status: 'unknown',
    history: [],
    notifyOnDown: true,
    deployStatus: 'not_deployed',
    ...partial,
  };
}

export const INITIAL_PROJECTS: Project[] = [
  project({
    id: 'gh:mirzarahimdev/Eduflix',
    name: 'Eduflix',
    type: 'website',
    url: 'https://eduflix.uz',
    description:
      'O‘quv markazlari CRM. Frontend production da (eduflix.uz). Mini App davomat + Click to‘lov.',
    deployStatus: 'live',
    deployHost: 'eduflix.uz · www.eduflix.uz',
    deployWhere: 'Vercel (Next.js frontend)',
    deployStack: 'Next.js + FastAPI backend',
    deployNotes:
      'Frontend Vercel da. Backend alohida VPS (eduflix.it-zone.uz). /backend proxy orqali API.',
    notifyOnDown: true,
  }),
  project({
    id: 'live:eduflix-api',
    name: 'Eduflix API',
    type: 'website',
    url: 'http://eduflix.it-zone.uz/health',
    description: 'Eduflix FastAPI backend health endpoint.',
    deployStatus: 'live',
    deployHost: 'eduflix.it-zone.uz',
    deployWhere: 'VPS Docker · konteyner eduflix_backend · /root/Eduflix_backend/',
    deployStack: 'FastAPI / Uvicorn (Docker)',
    deployNotes:
      'deploy_to_server.sh orqali chiqariladi. Health: /health → {"status":"ok"}. Keepalive/monitoring skriptlari bor.',
    notifyOnDown: true,
  }),
  project({
    id: 'gh:mirzarahimdev/Mehmonxona',
    name: 'Mehmon Hona',
    type: 'website',
    url: 'https://mehmon.it-zone.uz',
    description: 'Mehmonxona boshqaruvi (xonalar, bronlar). Frontend Vercel, API VPS da.',
    deployStatus: 'live',
    deployHost: 'mehmon.it-zone.uz',
    deployWhere: 'Vercel (Vite FE) + VPS nginx (API)',
    deployStack: 'React/Vite + backend API',
    deployNotes:
      'vercel.json /api ni mehmon.it-zone.uz/api ga yo‘naltiradi. Backend 502 bo‘lsa sayt ham yiqiladi.',
    notifyOnDown: true,
  }),
  project({
    id: 'live:emakon-api',
    name: 'E-Makon API',
    type: 'website',
    url: 'https://api.e-makon.uz/health/',
    description: 'Bog‘dorchilik xizmatlari API (Django/DRF). Production health.',
    deployStatus: 'live',
    deployHost: 'api.e-makon.uz · e-makon.uz',
    deployWhere: 'VPS Docker Compose + host nginx TLS · /srv/e-makon',
    deployStack: 'Django/DRF + Postgres + Redis + Gunicorn',
    deployNotes:
      'Panel: admin.e-makon.uz, superadmin.e-makon.uz (pm2). Telegram bot ham compose da. GitHub: juraevdev/e-makon',
    notifyOnDown: true,
  }),
  project({
    id: 'live:emakon-site',
    name: 'E-Makon sayt',
    type: 'website',
    url: 'https://e-makon.uz',
    description: 'E-Makon asosiy sayt / landing.',
    deployStatus: 'live',
    deployHost: 'e-makon.uz · www.e-makon.uz',
    deployWhere: 'VPS nginx → Docker stack',
    deployStack: 'Nginx + Docker Compose',
    deployNotes: 'API bilan bir VPS stack. Health alohida: api.e-makon.uz/health/',
    notifyOnDown: true,
  }),
  project({
    id: 'gh:mirzarahimdev/Anti-APK_Bot',
    name: 'Anti-APK Bot',
    type: 'telegram_bot',
    url: undefined,
    description:
      'Guruhlarda .apk/.exe ni o‘chiradi. Serverda systemd orqali 24/7 ishlaydi (HTTP yo‘q).',
    deployStatus: 'vps_bot',
    deployHost: 'Public domen yo‘q (faqat Telegram)',
    deployWhere: 'VPS · /opt/anti-apk · systemd: anti-apk',
    deployStack: 'Python Telethon UserBot (+ Bot API)',
    deployNotes:
      'DEPLOY.md: pack.ps1 → scp → setup.sh. Tekshiruv: systemctl status anti-apk yoki Telegram /status. Health URL yo‘q.',
    notifyOnDown: false,
  }),
  project({
    id: 'gh:mirzarahimdev/Restoran_web',
    name: 'FoodUZ',
    type: 'website',
    url: 'https://fooduz.uz',
    description: 'Food delivery / restoran buyurtma. Domen bor, lekin deploy barqaror emas.',
    deployStatus: 'partial',
    deployHost: 'fooduz.uz (reklama/brand)',
    deployWhere: 'To‘liq Vercel/systemd hujjati yo‘q — lokal Vite + FastAPI',
    deployStack: 'React/Vite + FastAPI',
    deployNotes:
      'Production deploy docs yo‘q. Domen javob bersa ham 5xx bo‘lishi mumkin. Lokal health: localhost:8000/api/health',
    notifyOnDown: true,
  }),
  project({
    id: 'gh:mirzarahimdev/Dasturlash_web',
    name: 'CodePraktika',
    type: 'website',
    url: 'https://codepraktika.uz',
    description: 'Amaliy dasturlash platformasi. Domen bor, deploy qisman / nosoz.',
    deployStatus: 'partial',
    deployHost: 'codepraktika.uz',
    deployWhere: 'Dockerfile + nginx image (backend:8000 proxy) — VPS path hujjatsiz',
    deployStack: 'React/Vite + Monaco + Docker/nginx',
    deployNotes: `${page('Dasturlash_web')} · Hozirda domen 5xx qaytarishi mumkin.`,
    notifyOnDown: true,
  }),
  project({
    id: 'gh:mirzarahimdev/Dastrulash_web-2',
    name: 'Dastrulash Web 2',
    type: 'website',
    url: `https://api.github.com/repos/${GITHUB_USERNAME}/Dastrulash_web-2`,
    description: 'Dasturlash web v2. Public production URL topilmadi.',
    deployStatus: 'not_deployed',
    deployHost: '—',
    deployWhere: 'Serverga chiqarilmagan (yoki URL noma’lum)',
    deployStack: 'TypeScript',
    deployNotes: page('Dastrulash_web-2'),
    notifyOnDown: false,
  }),
  project({
    id: 'gh:mirzarahimdev/Shazam_Bot',
    name: 'Shazam Bot',
    type: 'telegram_bot',
    url: undefined,
    description: 'Musiqa aniqlash boti. Lokal papka bo‘sh — server deploy topilmadi.',
    deployStatus: 'not_deployed',
    deployHost: '—',
    deployWhere: 'Serverga chiqarilmagan',
    deployStack: 'Python (GitHub)',
    deployNotes: page('Shazam_Bot'),
    notifyOnDown: false,
  }),
  project({
    id: 'gh:mirzarahimdev/JizPI_Bot',
    name: 'JizPI Bot',
    type: 'telegram_bot',
    url: undefined,
    description: 'JizPI Telegram boti. Server deploy hujjati topilmadi.',
    deployStatus: 'not_deployed',
    deployHost: '—',
    deployWhere: 'Serverga chiqarilmagan (yoki noma’lum)',
    deployStack: 'Python',
    deployNotes: page('JizPI_Bot'),
    notifyOnDown: false,
  }),
  project({
    id: 'gh:mirzarahimdev/MyGarden_bot',
    name: 'MyGarden Bot',
    type: 'telegram_bot',
    url: undefined,
    description: 'Bog‘dorchilik boti. Server deploy hujjati topilmadi.',
    deployStatus: 'not_deployed',
    deployHost: '—',
    deployWhere: 'Serverga chiqarilmagan (yoki noma’lum)',
    deployStack: 'Python',
    deployNotes: page('MyGarden_bot'),
    notifyOnDown: false,
  }),
  project({
    id: 'local:sudo-card-scanner',
    name: 'SUDO Card Scanner',
    type: 'mobile_app',
    url: undefined,
    description: 'Expo QR skaner (IT Park). Server emas — mobil APK.',
    deployStatus: 'not_deployed',
    deployHost: '—',
    deployWhere: 'Play/APK (server hosting yo‘q)',
    deployStack: 'Expo / React Native',
    deployNotes: 'Offline ilova. VPS/Vercel deploy qo‘llanilmaydi.',
    notifyOnDown: false,
  }),
];
