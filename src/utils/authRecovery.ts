import { Platform } from 'react-native';

export interface RecoveryTokens {
  accessToken: string;
  refreshToken: string;
}

// Supabase's password-recovery email redirects to
// `${redirectTo}#access_token=...&refresh_token=...&type=recovery` (implicit
// flow — detectSessionInUrl is off, see src/supabase/client.ts, so this must
// be parsed and exchanged for a session manually).
export function parseRecoveryTokens(url: string): RecoveryTokens | null {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return null;
  const params = new URLSearchParams(url.slice(hashIndex + 1));
  if (params.get('type') !== 'recovery') return null;
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

// Lazy `require()`s here, not top-level `import`s: expo-linking pulls in
// expo-modules-core's native EventEmitter, which isn't mocked by this
// project's bare-bones Jest config and crashes any test that transitively
// imports this module (same fix as src/analytics.ts's expo-constants require).
export function buildRecoveryRedirectUrl(): string {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants').default as typeof import('expo-constants').default;
    const baseUrl =
      (Constants.expoConfig?.experiments as Record<string, string> | undefined)?.baseUrl ?? '';
    return `${window.location.origin}${baseUrl}/reset-password`;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Linking = require('expo-linking') as typeof import('expo-linking');
  return Linking.createURL('reset-password');
}
