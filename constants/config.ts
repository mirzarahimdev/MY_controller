import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Health-check proxy. Emulator/device uchun PC LAN IP ni o'zgartiring.
 * .env: EXPO_PUBLIC_API_URL=http://10.1.20.212:8787
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.linkingUri?.replace(/^exp:\/\//, '').split('/')[0];

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== '127.0.0.1' && host !== 'localhost') {
      return `http://${host}:8787`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8787';
  }

  return 'http://127.0.0.1:8787';
}

export const API_URL = resolveApiUrl();
export const AUTO_CHECK_INTERVAL_MS = 60_000;
/** GitHub yangi repolarni qidirish oralig‘i (ilova ochiq bo‘lganda) */
export const AUTO_GITHUB_SYNC_INTERVAL_MS = 5 * 60_000;
export const HISTORY_LIMIT = 48;
