import { createClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import type { Database } from './types';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Native: persist the auth session to MMKV so login survives app restart.
// Without this, Supabase falls back to an in-memory-only session (the
// default AsyncStorage adapter isn't installed in this project) and every
// cold launch drops the user back to the login screen. Lazy-require so the
// native module doesn't get pulled in on web, mirroring src/store/index.ts.
// Falls back to an in-memory Map if the native module isn't available
// (e.g. Jest), same as the main store's storage adapter.
function buildAuthStorage() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
    const mmkv = createMMKV({ id: 'supabase-auth' });
    return {
      getItem: (key: string): string | null => mmkv.getString(key) ?? null,
      setItem: (key: string, value: string): void => mmkv.set(key, value),
      removeItem: (key: string): void => {
        mmkv.remove(key);
      },
    };
  } catch (e) {
    console.warn('[supabase/client] MMKV unavailable, falling back to in-memory storage:', e);
    Sentry.captureException(e, { tags: { storageOp: 'authStorageMmkvInit' } });
    const memory = new Map<string, string>();
    return {
      getItem: (key: string): string | null => memory.get(key) ?? null,
      setItem: (key: string, value: string): void => {
        memory.set(key, value);
      },
      removeItem: (key: string): void => {
        memory.delete(key);
      },
    };
  }
}

export const supabase = supabaseConfigured
  ? createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        // On web, leave storage undefined — Supabase's default localStorage
        // adapter already persists sessions there.
        storage: Platform.OS === 'web' ? undefined : buildAuthStorage(),
      },
    })
  : (null as unknown as ReturnType<typeof createClient<Database>>);
