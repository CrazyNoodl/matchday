// Unit tests for src/supabase/auth.ts
// Mocks the Supabase client to isolate auth function behavior.

import {
  getCurrentUserId,
  signInWithEmail,
  signUpWithEmail,
  resetPasswordForEmail,
  updatePassword,
  signOut,
} from '../auth';
import { supabase } from '@/supabase/client';

jest.mock('@/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn(),
    },
  },
  supabaseConfigured: true,
}));

jest.mock('@/utils/authRecovery', () => ({
  buildRecoveryRedirectUrl: () => 'matchday://reset-password',
}));

const mockGetSession = supabase.auth.getSession as jest.Mock;
const mockSignInWithPassword = supabase.auth.signInWithPassword as jest.Mock;
const mockSignUp = supabase.auth.signUp as jest.Mock;
const mockResetPasswordForEmail = supabase.auth.resetPasswordForEmail as jest.Mock;
const mockUpdateUser = supabase.auth.updateUser as jest.Mock;
const mockSignOut = supabase.auth.signOut as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getCurrentUserId ────────────────────────────────────────────────────────

describe('getCurrentUserId', () => {
  it('returns the user ID when a session exists', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-abc-123' } } } });
    expect(await getCurrentUserId()).toBe('user-abc-123');
  });

  it('returns null when session is null', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    expect(await getCurrentUserId()).toBeNull();
  });

  it('returns null when session is undefined', async () => {
    mockGetSession.mockResolvedValue({ data: { session: undefined } });
    expect(await getCurrentUserId()).toBeNull();
  });
});

// ─── signInWithEmail ─────────────────────────────────────────────────────────

describe('signInWithEmail', () => {
  it('returns { error: null } on successful sign in', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    const result = await signInWithEmail('user@example.com', 'secret');
    expect(result).toEqual({ error: null });
  });

  it('calls signInWithPassword with the provided credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    await signInWithEmail('user@example.com', 'secret');
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret',
    });
  });

  it('returns the error message string from Supabase on failure', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });
    const result = await signInWithEmail('user@example.com', 'wrongpass');
    expect(result).toEqual({ error: 'Invalid login credentials' });
  });

  it('calls signInWithPassword exactly once per invocation', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    await signInWithEmail('a@b.com', 'pass');
    expect(mockSignInWithPassword).toHaveBeenCalledTimes(1);
  });
});

// ─── signUpWithEmail ─────────────────────────────────────────────────────────

describe('signUpWithEmail', () => {
  it('returns { error: null } on successful sign up', async () => {
    mockSignUp.mockResolvedValue({ error: null });
    const result = await signUpWithEmail('new@example.com', 'password123');
    expect(result).toEqual({ error: null });
  });

  it('calls signUp with the provided credentials', async () => {
    mockSignUp.mockResolvedValue({ error: null });
    await signUpWithEmail('new@example.com', 'password123');
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
    });
  });

  it('returns error message when email is already registered', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'User already registered' } });
    const result = await signUpWithEmail('existing@example.com', 'pass');
    expect(result).toEqual({ error: 'User already registered' });
  });

  it('returns error message for weak password', async () => {
    mockSignUp.mockResolvedValue({
      error: { message: 'Password should be at least 6 characters' },
    });
    const result = await signUpWithEmail('new@example.com', '12');
    expect(result).toEqual({ error: 'Password should be at least 6 characters' });
  });
});

// ─── resetPasswordForEmail ───────────────────────────────────────────────────

describe('resetPasswordForEmail', () => {
  it('returns { error: null } on success', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    const result = await resetPasswordForEmail('user@example.com');
    expect(result).toEqual({ error: null });
  });

  it('calls resetPasswordForEmail with the email and a redirectTo URL', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    await resetPasswordForEmail('user@example.com');
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
      redirectTo: 'matchday://reset-password',
    });
  });

  it('returns the error message string from Supabase on failure', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'Unable to send email' } });
    const result = await resetPasswordForEmail('user@example.com');
    expect(result).toEqual({ error: 'Unable to send email' });
  });
});

// ─── updatePassword ──────────────────────────────────────────────────────────

describe('updatePassword', () => {
  it('returns { error: null } on success', async () => {
    mockUpdateUser.mockResolvedValue({ error: null });
    const result = await updatePassword('newSecret123');
    expect(result).toEqual({ error: null });
  });

  it('calls updateUser with the new password', async () => {
    mockUpdateUser.mockResolvedValue({ error: null });
    await updatePassword('newSecret123');
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newSecret123' });
  });

  it('returns the error message string from Supabase on failure', async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: 'Password should be at least 6 characters' },
    });
    const result = await updatePassword('123');
    expect(result).toEqual({ error: 'Password should be at least 6 characters' });
  });
});

// ─── signOut ─────────────────────────────────────────────────────────────────

describe('signOut', () => {
  it('calls supabase.auth.signOut with scope: local', async () => {
    mockSignOut.mockResolvedValue({});
    await signOut();
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('calls signOut exactly once', async () => {
    mockSignOut.mockResolvedValue({});
    await signOut();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('resolves without throwing even if Supabase returns an error object', async () => {
    mockSignOut.mockResolvedValue({ error: { message: 'Network error' } });
    await expect(signOut()).resolves.toBeUndefined();
  });
});

// Tests for supabaseConfigured=false are in auth.unconfigured.test.ts.
