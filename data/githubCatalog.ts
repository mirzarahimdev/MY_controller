import { GITHUB_USERNAME } from './projects';

/**
 * GitHub API rate-limit yoki token yo‘qligida ham
 * mirzarahimdev ning ma’lum barcha repolari ko‘rinsin.
 */
export const KNOWN_GITHUB_REPOS: Array<{
  name: string;
  private?: boolean;
  description?: string;
  homepage?: string | null;
}> = [
  {
    name: 'Eduflix',
    private: true,
    description: 'O‘quv markazlari CRM',
    homepage: 'https://eduflix.uz',
  },
  {
    name: 'Mehmonxona',
    private: true,
    description: 'Mehmonxona boshqaruvi',
    homepage: 'https://mehmon.it-zone.uz',
  },
  {
    name: 'Anti-APK_Bot',
    private: true,
    description: 'Anti-APK Telegram/UserBot',
  },
  {
    name: 'Dasturlash_web',
    private: true,
    description: 'CodePraktika / dasturlash platformasi',
    // DNS hozir ishlamaydi — seed URL orqali tekshiriladi
    homepage: 'https://codepraktika.uz',
  },
  {
    name: 'Restoran_web',
    description: 'FoodUZ restoran/yetkazib berish',
    homepage: 'https://fooduz.uz',
  },
  {
    name: 'MY_controller',
    private: true,
    description: 'MyKontroller monitoring ilovasi',
  },
  {
    name: 'Dastrulash_web-2',
    description: 'Dasturlash web v2',
  },
  {
    name: 'Shazam_Bot',
    description: 'Musiqa aniqlash boti',
  },
  {
    name: 'JizPI_Bot',
    description: 'JizPI Telegram boti',
  },
  {
    name: 'MyGarden_bot',
    description: 'Bog‘dorchilik boti',
  },
];

export function knownReposAsGithub() {
  return KNOWN_GITHUB_REPOS.map((r, i) => ({
    id: 9000 + i,
    name: r.name,
    full_name: `${GITHUB_USERNAME}/${r.name}`,
    html_url: `https://github.com/${GITHUB_USERNAME}/${r.name}`,
    description: r.description || null,
    homepage: r.homepage || null,
    language: null as string | null,
    private: Boolean(r.private),
    fork: false,
  }));
}
