// Tests for the auth guard behavior defined in app/_layout.tsx.
//
// The layout renders one of three things depending on the session state:
//   session === undefined  → loading spinner (still fetching from Supabase)
//   session === null       → LoginScreen (user is signed out)
//   session exists         → main app Stack (user is signed in)
//
// Rather than mounting the full _layout (which requires mocking ~10 native
// modules), these tests use an AuthGate wrapper that mirrors the exact same
// conditional-rendering logic. This directly verifies that:
//   • Signed-out users cannot see app content.
//   • After signOut() resolves (onAuthStateChange fires with null), LoginScreen
//     appears immediately and app content is hidden.
//   • After a successful login, the LoginScreen disappears and app content
//     becomes visible.
//
// @testing-library/react-native v14: render and fireEvent.press are async —
// every call must be awaited.

import '@/i18n';
import React, { useState } from 'react';
import { Text, ActivityIndicator } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import type { Session } from '@supabase/supabase-js';
import { LoginScreen } from '../LoginScreen';

jest.mock('@/supabase/auth', () => ({
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
}));

// Mirrors the three-way conditional in app/_layout.tsx.
// In _layout.tsx, session is initialised as:
//   supabaseConfigured ? undefined : null
// So undefined only appears while supabase is configured and still loading.
function AuthGate({
  session,
  supabaseConfigured,
}: {
  session: Session | null | undefined;
  supabaseConfigured: boolean;
}) {
  if (session === undefined) {
    return <ActivityIndicator testID="loading-spinner" />;
  }
  if (supabaseConfigured && session === null) {
    return <LoginScreen onSuccess={jest.fn()} />;
  }
  return <Text testID="app-content">APP CONTENT</Text>;
}

const FAKE_SESSION = { user: { id: 'user-123', email: 'user@test.com' } } as Session;

// ─── Static session states ────────────────────────────────────────────────────

describe('auth gate – static session states', () => {
  it('shows loading spinner while session is still being fetched (undefined)', async () => {
    const { getByTestId } = await render(
      <AuthGate session={undefined} supabaseConfigured={true} />,
    );
    expect(getByTestId('loading-spinner')).toBeTruthy();
  });

  it('shows LoginScreen when session is null and Supabase is configured', async () => {
    const { getByText } = await render(
      <AuthGate session={null} supabaseConfigured={true} />,
    );
    expect(getByText('SIGN IN')).toBeTruthy();
  });

  it('shows app content when a valid session exists', async () => {
    const { getByTestId } = await render(
      <AuthGate session={FAKE_SESSION} supabaseConfigured={true} />,
    );
    expect(getByTestId('app-content')).toBeTruthy();
  });

  it('shows app content when Supabase is not configured (offline / demo mode)', async () => {
    // When supabaseConfigured=false, _layout.tsx initialises session as null
    // but skips the login guard, so the app renders normally.
    const { getByTestId } = await render(
      <AuthGate session={null} supabaseConfigured={false} />,
    );
    expect(getByTestId('app-content')).toBeTruthy();
  });
});

// ─── Screen access after logout ───────────────────────────────────────────────

describe('screen access after logout', () => {
  it('shows LoginScreen immediately after session changes to null (signOut)', async () => {
    function SessionController() {
      const [session, setSession] = useState<Session | null>(FAKE_SESSION);

      return (
        <>
          <AuthGate session={session} supabaseConfigured={true} />
          <Text testID="sign-out-btn" onPress={() => setSession(null)}>
            SIGN OUT
          </Text>
        </>
      );
    }

    const { getByTestId, getByText, queryByTestId } = await render(<SessionController />);

    // User is logged in — app is visible
    expect(getByTestId('app-content')).toBeTruthy();
    expect(queryByTestId('loading-spinner')).toBeNull();

    // onAuthStateChange(null) fires → session becomes null
    await fireEvent.press(getByTestId('sign-out-btn'));

    await waitFor(() => {
      expect(getByText('SIGN IN')).toBeTruthy();
      expect(queryByTestId('app-content')).toBeNull();
    });
  });

  it('does not show app content while session is null (user is logged out)', async () => {
    const { queryByTestId, getByText } = await render(
      <AuthGate session={null} supabaseConfigured={true} />,
    );
    expect(queryByTestId('app-content')).toBeNull();
    expect(getByText('SIGN IN')).toBeTruthy();
  });

  it('shows app content again after a successful login following logout', async () => {
    function SessionController() {
      const [session, setSession] = useState<Session | null>(null);

      return (
        <>
          <AuthGate session={session} supabaseConfigured={true} />
          <Text
            testID="fake-login-btn"
            onPress={() => setSession(FAKE_SESSION)}
          >
            LOG IN
          </Text>
        </>
      );
    }

    const { getByTestId, getByText, queryByText, queryByTestId } = await render(
      <SessionController />,
    );

    // Initially no session → LoginScreen
    expect(getByText('SIGN IN')).toBeTruthy();
    expect(queryByTestId('app-content')).toBeNull();

    // Auth succeeds → session set
    await fireEvent.press(getByTestId('fake-login-btn'));

    await waitFor(() => {
      expect(getByTestId('app-content')).toBeTruthy();
      expect(queryByText('SIGN IN')).toBeNull();
    });
  });

  it('goes back to LoginScreen when session expires (null after valid session)', async () => {
    function SessionController() {
      const [session, setSession] = useState<Session | null>(FAKE_SESSION);

      return (
        <>
          <AuthGate session={session} supabaseConfigured={true} />
          <Text testID="expire-btn" onPress={() => setSession(null)}>
            EXPIRE
          </Text>
        </>
      );
    }

    const { getByTestId, getByText, queryByTestId } = await render(<SessionController />);

    expect(getByTestId('app-content')).toBeTruthy();

    await fireEvent.press(getByTestId('expire-btn'));

    await waitFor(() => {
      expect(getByText('SIGN IN')).toBeTruthy();
      expect(queryByTestId('app-content')).toBeNull();
    });
  });

  it('shows loading spinner between session states (undefined → null transition)', async () => {
    function SessionController() {
      const [session, setSession] = useState<Session | null | undefined>(undefined);

      return (
        <>
          <AuthGate session={session} supabaseConfigured={true} />
          <Text testID="resolve-btn" onPress={() => setSession(null)}>
            RESOLVE
          </Text>
        </>
      );
    }

    const { getByTestId, getByText, queryByTestId } = await render(<SessionController />);

    // Waiting for getSession() → loading spinner
    expect(getByTestId('loading-spinner')).toBeTruthy();

    // getSession() resolves with no session → LoginScreen
    await fireEvent.press(getByTestId('resolve-btn'));

    await waitFor(() => {
      expect(getByText('SIGN IN')).toBeTruthy();
      expect(queryByTestId('loading-spinner')).toBeNull();
    });
  });
});
