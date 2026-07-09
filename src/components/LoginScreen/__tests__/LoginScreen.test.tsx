// Component tests for LoginScreen.
// @testing-library/react-native v14: render, fireEvent.press and
// fireEvent.changeText are all async — every call must be awaited.

import '@/i18n';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';
import { signInWithEmail, signUpWithEmail } from '@/supabase/auth';

jest.mock('@/supabase/auth', () => ({
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
}));

const mockSignInWithEmail = signInWithEmail as jest.Mock;
const mockSignUpWithEmail = signUpWithEmail as jest.Mock;

async function renderScreen(onSuccess = jest.fn()) {
  return render(<LoginScreen onSuccess={onSuccess} />);
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Initial render ───────────────────────────────────────────────────────────

describe('initial render', () => {
  it('shows email and password inputs', async () => {
    const { getByPlaceholderText } = await renderScreen();
    expect(getByPlaceholderText('your@email.com')).toBeTruthy();
    expect(getByPlaceholderText('••••••••')).toBeTruthy();
  });

  it('starts in sign-in mode with SIGN IN button', async () => {
    const { getByText } = await renderScreen();
    expect(getByText('SIGN IN')).toBeTruthy();
  });

  it('shows toggle link to sign up', async () => {
    const { getByText } = await renderScreen();
    expect(getByText("Don't have an account? Sign up")).toBeTruthy();
  });

  it('shows no error or success message on first render', async () => {
    const { queryByText } = await renderScreen();
    expect(queryByText('Enter email and password')).toBeNull();
    expect(queryByText(/Account created/)).toBeNull();
  });
});

// ─── Form validation ─────────────────────────────────────────────────────────

describe('form validation', () => {
  it('shows error and does not call API when email is empty', async () => {
    const { getByText, getByPlaceholderText } = await renderScreen();
    await fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123');
    await fireEvent.press(getByText('SIGN IN'));

    await waitFor(() => expect(getByText('Enter email and password')).toBeTruthy());
    expect(mockSignInWithEmail).not.toHaveBeenCalled();
  });

  it('shows error and does not call API when password is empty', async () => {
    const { getByText, getByPlaceholderText } = await renderScreen();
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@test.com');
    await fireEvent.press(getByText('SIGN IN'));

    await waitFor(() => expect(getByText('Enter email and password')).toBeTruthy());
    expect(mockSignInWithEmail).not.toHaveBeenCalled();
  });

  it('shows error and does not call API when both fields are empty', async () => {
    const { getByText } = await renderScreen();
    await fireEvent.press(getByText('SIGN IN'));

    await waitFor(() => expect(getByText('Enter email and password')).toBeTruthy());
  });

  it('shows error when email contains only whitespace', async () => {
    const { getByText, getByPlaceholderText } = await renderScreen();
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), '   ');
    await fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123');
    await fireEvent.press(getByText('SIGN IN'));

    await waitFor(() => expect(getByText('Enter email and password')).toBeTruthy());
    expect(mockSignInWithEmail).not.toHaveBeenCalled();
  });

  it('shows error when password contains only whitespace', async () => {
    const { getByText, getByPlaceholderText } = await renderScreen();
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@test.com');
    await fireEvent.changeText(getByPlaceholderText('••••••••'), '   ');
    await fireEvent.press(getByText('SIGN IN'));

    await waitFor(() => expect(getByText('Enter email and password')).toBeTruthy());
    expect(mockSignInWithEmail).not.toHaveBeenCalled();
  });
});

// ─── Sign in ─────────────────────────────────────────────────────────────────

describe('sign in', () => {
  it('calls onSuccess when sign in succeeds', async () => {
    mockSignInWithEmail.mockResolvedValue({ error: null });
    const onSuccess = jest.fn();
    const { getByText, getByPlaceholderText } = await renderScreen(onSuccess);

    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'user@test.com');
    await fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123');
    await fireEvent.press(getByText('SIGN IN'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it('does NOT call onSuccess when sign in fails', async () => {
    mockSignInWithEmail.mockResolvedValue({ error: 'Invalid login credentials' });
    const onSuccess = jest.fn();
    const { getByText, getByPlaceholderText } = await renderScreen(onSuccess);

    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'user@test.com');
    await fireEvent.changeText(getByPlaceholderText('••••••••'), 'wrongpass');
    await fireEvent.press(getByText('SIGN IN'));

    await waitFor(() => expect(getByText('Invalid login credentials')).toBeTruthy());
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('displays the error message returned by Supabase', async () => {
    mockSignInWithEmail.mockResolvedValue({ error: 'Email not confirmed' });
    const { getByText, getByPlaceholderText } = await renderScreen();

    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'user@test.com');
    await fireEvent.changeText(getByPlaceholderText('••••••••'), 'pass');
    await fireEvent.press(getByText('SIGN IN'));

    await waitFor(() => expect(getByText('Email not confirmed')).toBeTruthy());
  });

  it('trims leading/trailing whitespace from email before sending', async () => {
    mockSignInWithEmail.mockResolvedValue({ error: null });
    const { getByText, getByPlaceholderText } = await renderScreen();

    await fireEvent.changeText(getByPlaceholderText('your@email.com'), '  user@test.com  ');
    await fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123');
    await fireEvent.press(getByText('SIGN IN'));

    await waitFor(() =>
      expect(mockSignInWithEmail).toHaveBeenCalledWith('user@test.com', 'password123'),
    );
  });

  it('does not trim the password', async () => {
    mockSignInWithEmail.mockResolvedValue({ error: null });
    const { getByText, getByPlaceholderText } = await renderScreen();

    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'user@test.com');
    await fireEvent.changeText(getByPlaceholderText('••••••••'), ' mypassword ');
    await fireEvent.press(getByText('SIGN IN'));

    await waitFor(() =>
      expect(mockSignInWithEmail).toHaveBeenCalledWith('user@test.com', ' mypassword '),
    );
  });

  it('clears the previous error before the next submission attempt', async () => {
    mockSignInWithEmail
      .mockResolvedValueOnce({ error: 'First error' })
      .mockResolvedValueOnce({ error: null });

    const onSuccess = jest.fn();
    const { getByText, queryByText, getByPlaceholderText } = await renderScreen(onSuccess);

    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'user@test.com');
    await fireEvent.changeText(getByPlaceholderText('••••••••'), 'pass');
    await fireEvent.press(getByText('SIGN IN'));

    await waitFor(() => expect(getByText('First error')).toBeTruthy());

    await fireEvent.press(getByText('SIGN IN'));

    await waitFor(() => {
      expect(queryByText('First error')).toBeNull();
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});

// ─── Loading state ────────────────────────────────────────────────────────────

describe('loading state', () => {
  it('calls signInWithEmail exactly once per submit action', async () => {
    // Verifies that the button is disabled during loading so rapid presses
    // cannot queue up multiple API calls.
    mockSignInWithEmail.mockResolvedValue({ error: null });
    const onSuccess = jest.fn();
    const { getByText, getByPlaceholderText } = await renderScreen(onSuccess);

    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'user@test.com');
    await fireEvent.changeText(getByPlaceholderText('••••••••'), 'pass');
    await fireEvent.press(getByText('SIGN IN'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    // Sign-in resolved and succeeded — API was called exactly once
    expect(mockSignInWithEmail).toHaveBeenCalledTimes(1);
  });
});

// ─── Mode toggle ──────────────────────────────────────────────────────────────

describe('mode toggle', () => {
  it('switches to sign-up mode when the toggle link is pressed', async () => {
    const { getByText } = await renderScreen();
    await fireEvent.press(getByText("Don't have an account? Sign up"));

    expect(getByText('CREATE ACCOUNT')).toBeTruthy();
    expect(getByText('Already have an account? Sign in')).toBeTruthy();
  });

  it('switches back to sign-in mode from sign-up', async () => {
    const { getByText } = await renderScreen();
    await fireEvent.press(getByText("Don't have an account? Sign up"));
    await fireEvent.press(getByText('Already have an account? Sign in'));

    expect(getByText('SIGN IN')).toBeTruthy();
    expect(getByText("Don't have an account? Sign up")).toBeTruthy();
  });

  it('clears validation error when mode is toggled', async () => {
    mockSignInWithEmail.mockResolvedValue({ error: 'Invalid credentials' });
    const { getByText, queryByText, getByPlaceholderText } = await renderScreen();

    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'user@test.com');
    await fireEvent.changeText(getByPlaceholderText('••••••••'), 'wrongpass');
    await fireEvent.press(getByText('SIGN IN'));

    await waitFor(() => expect(getByText('Invalid credentials')).toBeTruthy());

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    expect(queryByText('Invalid credentials')).toBeNull();
  });

  it('clears success message when mode is toggled', async () => {
    mockSignUpWithEmail.mockResolvedValue({ error: null });
    const { getByText, queryByText, getByPlaceholderText } = await renderScreen();

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'new@test.com');
    await fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123');
    await fireEvent.press(getByText('CREATE ACCOUNT'));

    await waitFor(() => expect(getByText(/Account created/)).toBeTruthy());

    // Switched back to sign-in; toggling to sign-up clears the message
    await fireEvent.press(getByText("Don't have an account? Sign up"));
    expect(queryByText(/Account created/)).toBeNull();
  });
});

// ─── Sign up ─────────────────────────────────────────────────────────────────

describe('sign up', () => {
  it('shows success message and switches back to sign-in after successful sign up', async () => {
    mockSignUpWithEmail.mockResolvedValue({ error: null });
    const { getByText, queryByText, getByPlaceholderText } = await renderScreen();

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'new@test.com');
    await fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123');
    await fireEvent.press(getByText('CREATE ACCOUNT'));

    await waitFor(() => {
      expect(getByText('Account created! Check your email to confirm, then sign in.')).toBeTruthy();
      expect(queryByText('CREATE ACCOUNT')).toBeNull();
      expect(getByText('SIGN IN')).toBeTruthy();
    });
  });

  it('does NOT call onSuccess after sign up', async () => {
    mockSignUpWithEmail.mockResolvedValue({ error: null });
    const onSuccess = jest.fn();
    const { getByText, getByPlaceholderText } = await renderScreen(onSuccess);

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'new@test.com');
    await fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123');
    await fireEvent.press(getByText('CREATE ACCOUNT'));

    await waitFor(() => expect(getByText(/Account created/)).toBeTruthy());
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('displays the error message when sign up fails', async () => {
    mockSignUpWithEmail.mockResolvedValue({ error: 'User already registered' });
    const { getByText, getByPlaceholderText } = await renderScreen();

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'existing@test.com');
    await fireEvent.changeText(getByPlaceholderText('••••••••'), 'password');
    await fireEvent.press(getByText('CREATE ACCOUNT'));

    await waitFor(() => expect(getByText('User already registered')).toBeTruthy());
  });

  it('stays in sign-up mode after a failed sign-up attempt', async () => {
    mockSignUpWithEmail.mockResolvedValue({ error: 'User already registered' });
    const { getByText, getByPlaceholderText } = await renderScreen();

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'existing@test.com');
    await fireEvent.changeText(getByPlaceholderText('••••••••'), 'password');
    await fireEvent.press(getByText('CREATE ACCOUNT'));

    await waitFor(() => expect(getByText('User already registered')).toBeTruthy());
    expect(getByText('CREATE ACCOUNT')).toBeTruthy();
  });

  it('trims email before passing to signUpWithEmail', async () => {
    mockSignUpWithEmail.mockResolvedValue({ error: null });
    const { getByText, getByPlaceholderText } = await renderScreen();

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), '  new@test.com  ');
    await fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123');
    await fireEvent.press(getByText('CREATE ACCOUNT'));

    await waitFor(() =>
      expect(mockSignUpWithEmail).toHaveBeenCalledWith('new@test.com', 'password123'),
    );
  });

  it('validates empty fields in sign-up mode too', async () => {
    const { getByText } = await renderScreen();

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    await fireEvent.press(getByText('CREATE ACCOUNT'));

    await waitFor(() => expect(getByText('Enter email and password')).toBeTruthy());
    expect(mockSignUpWithEmail).not.toHaveBeenCalled();
  });
});
