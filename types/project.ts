export type ProjectType = 'telegram_bot' | 'website' | 'mobile_app';
export type ProjectStatus = 'online' | 'offline' | 'degraded' | 'unknown';

/** Serverga chiqarilganlik holati */
export type DeployStatus = 'live' | 'partial' | 'vps_bot' | 'not_deployed';

export interface CheckHistoryItem {
  at: string;
  status: ProjectStatus;
  responseMs?: number;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  url?: string;
  description: string;
  status: ProjectStatus;
  lastChecked?: string;
  responseMs?: number;
  uptimePercent?: number;
  notes?: string;
  /** Auth header qiymati SecureStore da saqlanadi, bu yerda faqat flag */
  hasAuthToken?: boolean;
  authHeaderName?: string;
  history?: CheckHistoryItem[];
  notifyOnDown?: boolean;

  /** Server / deploy ma’lumotlari */
  deployStatus?: DeployStatus;
  /** Domenlar, masalan eduflix.uz */
  deployHost?: string;
  /** Qayerda ishlaydi: Vercel, VPS Docker, systemd... */
  deployWhere?: string;
  /** Texnologiyalar */
  deployStack?: string;
  /** Qo‘shimcha izoh */
  deployNotes?: string;
}

export interface StatusSummary {
  total: number;
  online: number;
  offline: number;
  degraded: number;
  unknown: number;
}

export type ProjectInput = {
  id?: string;
  name: string;
  type: ProjectType;
  url?: string;
  description: string;
  authHeaderName?: string;
  authToken?: string;
  notifyOnDown?: boolean;
};
