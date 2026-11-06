import * as SecureStore from 'expo-secure-store';

/** SecureStore faqat [A-Za-z0-9._-] qabul qiladi */
function sanitizeId(projectId: string): string {
  return projectId.replace(/[^a-zA-Z0-9._-]/g, '_');
}

const tokenKey = (projectId: string) => `mk.token.${sanitizeId(projectId)}`;

export async function saveAuthToken(projectId: string, token?: string) {
  const key = tokenKey(projectId);
  if (!token) {
    await SecureStore.deleteItemAsync(key).catch(() => undefined);
    return;
  }
  await SecureStore.setItemAsync(key, token);
}

export async function getAuthToken(projectId: string): Promise<string | undefined> {
  try {
    const value = await SecureStore.getItemAsync(tokenKey(projectId));
    return value || undefined;
  } catch {
    return undefined;
  }
}

export async function deleteAuthToken(projectId: string) {
  await SecureStore.deleteItemAsync(tokenKey(projectId)).catch(() => undefined);
}

const GITHUB_TOKEN_KEY = 'mk.github.pat';

export async function saveGithubToken(token?: string) {
  if (!token?.trim()) {
    await SecureStore.deleteItemAsync(GITHUB_TOKEN_KEY).catch(() => undefined);
    return;
  }
  await SecureStore.setItemAsync(GITHUB_TOKEN_KEY, token.trim());
}

export async function getGithubToken(): Promise<string | undefined> {
  try {
    const value = await SecureStore.getItemAsync(GITHUB_TOKEN_KEY);
    return value || undefined;
  } catch {
    return undefined;
  }
}
