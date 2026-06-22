// Tests for src/supabase/auth.ts when Supabase is not configured (no env vars set).
// Each function must return a safe fallback without calling the Supabase client.

jest.mock('@/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  },
  supabaseConfigured: false,
}));

import { getCurrentUserId, signInWithEmail, signUpWithEmail, signOut } from '../auth';
import { supabase } from '@/supabase/client';

const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;
const mockSignUp = supabase.auth.signUp as jest.Mock;
const mockSignOut = supabase.auth.signOut as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('when supabaseConfigured is false', () => {
  it('getCurrentUserId returns null without calling supabase', async () => {
    expect(await getCurrentUserId()).toBeNull();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('signInWithEmail returns the "not configured" error without calling supabase', async () => {
    const result = await signInWithEmail('a@b.com', 'pass');
    expect(result).toEqual({ error: 'Supabase not configured' });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('signUpWithEmail returns the "not configured" error without calling supabase', async () => {
    const result = await signUpWithEmail('a@b.com', 'pass');
    expect(result).toEqual({ error: 'Supabase not configured' });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('signOut resolves silently without calling supabase', async () => {
    await expect(signOut()).resolves.toBeUndefined();
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
