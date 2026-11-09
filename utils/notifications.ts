import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let channelReady = false;

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android' || channelReady) return;
  try {
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Loyiha ogohlantirishlari',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: '#C0392B',
      sound: 'default',
    });
  } catch {
    // Expo Go (SDK 53+) ba'zida channel API null beradi — local notify ishlayveradi
  }
  channelReady = true;
}

/** Ilova startida chaqiring — ruxsat + Android channel */
export async function setupNotifications(): Promise<boolean> {
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

async function sendLocal(title: string, body: string) {
  const ok = await ensureNotificationPermission();
  if (!ok) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: 'alerts' } : {}),
    },
    trigger: null,
  });
  return true;
}

export async function notifyProjectDown(
  name: string,
  status: string,
  detail?: string
) {
  const extra = detail ? ` · ${detail}` : '';
  await sendLocal(
    '⚠️ MyKontroller — muammo',
    `"${name}" holati: ${status}${extra}`
  );
}

export async function notifyProblemsBatch(
  items: Array<{ name: string; status: string; notes?: string }>
) {
  if (items.length === 0) return;
  if (items.length === 1) {
    await notifyProjectDown(items[0].name, items[0].status, items[0].notes);
    return;
  }
  const preview = items
    .slice(0, 4)
    .map((i) => `${i.name} (${i.status})`)
    .join(', ');
  const more = items.length > 4 ? ` va yana ${items.length - 4} ta` : '';
  await sendLocal(
    `⚠️ MyKontroller — ${items.length} ta muammo`,
    `${preview}${more}`
  );
}

export async function notifyProjectRecovered(name: string) {
  await sendLocal('✅ MyKontroller', `"${name}" yana online`);
}

export async function notifyGithubProjectsAdded(names: string[]) {
  if (names.length === 0) return;
  const body =
    names.length === 1
      ? `Yangi GitHub loyiha: ${names[0]}`
      : `${names.length} ta yangi GitHub loyiha: ${names.slice(0, 3).join(', ')}${
          names.length > 3 ? '…' : ''
        }`;
  await sendLocal('MyKontroller · GitHub', body);
}
