import { supabase, supabaseConfigured } from './client';
import { buildRecoveryRedirectUrl } from '@/utils/authRecovery';

export async function getCurrentUserId(): Promise<string | null> {
  if (!supabaseConfigured) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: 'Supabase not configured' };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: 'Supabase not configured' };
  const { error } = await supabase.auth.signUp({ email, password });
  return { error: error?.message ?? null };
}

export async function resetPasswordForEmail(email: string): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: 'Supabase not configured' };
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: buildRecoveryRedirectUrl(),
  });
  return { error: error?.message ?? null };
}

export async function updatePassword(newPassword: string): Promise<{ error: string | null }> {
  if (!supabaseConfigured) return { error: 'Supabase not configured' };
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<void> {
  if (!supabaseConfigured) return;
  // scope: 'local' clears the local session without a network call,
  // avoiding failures if the API is unreachable
  await supabase.auth.signOut({ scope: 'local' });
}
