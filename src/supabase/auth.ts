import { supabase, supabaseConfigured } from './client';

// Signs in anonymously if no session exists.
// The UUID is stored in Supabase auth — persisted across devices via the
// JWT stored in localStorage/SecureStore.
export async function ensureAnonymousSession(): Promise<string | null> {
  if (!supabaseConfigured) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn('[auth] anonymous sign-in failed:', error.message);
    return null;
  }
  return data.user?.id ?? null;
}

export async function getCurrentUserId(): Promise<string | null> {
  if (!supabaseConfigured) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}
