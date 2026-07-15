// Component tests for LoginScreen.
// @testing-library/react-native v14: render, fireEvent.press and
// fireEvent.changeText are all async — every call must be awaited.

import '@/i18n';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';
import { signInWithEmail, signUpWithEmail, resetPasswordForEmail } from '@/supabase/auth';

jest.mock('@/supabase/auth', () => ({
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
  resetPasswordForEmail: jest.fn(),
}));

const mockSignInWithEmail = signInWithEmail as jest.Mock;
const mockSignUpWithEmail = signUpWithEmail as jest.Mock;
const mockResetPasswordForEmail = resetPasswordForEmail as jest.Mock;

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
    const { getByText, queryByText, getByPlaceholderText, getByTestId } = await renderScreen();

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'new@test.com');
    await fireEvent.changeText(getByTestId('password-input'), 'password123');
    await fireEvent.changeText(getByTestId('confirm-password-input'), 'password123');
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
    const { getByText, queryByText, getByPlaceholderText, getByTestId } = await renderScreen();

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'new@test.com');
    await fireEvent.changeText(getByTestId('password-input'), 'password123');
    await fireEvent.changeText(getByTestId('confirm-password-input'), 'password123');
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
    const { getByText, getByPlaceholderText, getByTestId } = await renderScreen(onSuccess);

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'new@test.com');
    await fireEvent.changeText(getByTestId('password-input'), 'password123');
    await fireEvent.changeText(getByTestId('confirm-password-input'), 'password123');
    await fireEvent.press(getByText('CREATE ACCOUNT'));

    await waitFor(() => expect(getByText(/Account created/)).toBeTruthy());
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('displays the error message when sign up fails', async () => {
    mockSignUpWithEmail.mockResolvedValue({ error: 'User already registered' });
    const { getByText, getByPlaceholderText, getByTestId } = await renderScreen();

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'existing@test.com');
    await fireEvent.changeText(getByTestId('password-input'), 'password');
    await fireEvent.changeText(getByTestId('confirm-password-input'), 'password');
    await fireEvent.press(getByText('CREATE ACCOUNT'));

    await waitFor(() => expect(getByText('User already registered')).toBeTruthy());
  });

  it('stays in sign-up mode after a failed sign-up attempt', async () => {
    mockSignUpWithEmail.mockResolvedValue({ error: 'User already registered' });
    const { getByText, getByPlaceholderText, getByTestId } = await renderScreen();

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'existing@test.com');
    await fireEvent.changeText(getByTestId('password-input'), 'password');
    await fireEvent.changeText(getByTestId('confirm-password-input'), 'password');
    await fireEvent.press(getByText('CREATE ACCOUNT'));

    await waitFor(() => expect(getByText('User already registered')).toBeTruthy());
    expect(getByText('CREATE ACCOUNT')).toBeTruthy();
  });

  it('trims email before passing to signUpWithEmail', async () => {
    mockSignUpWithEmail.mockResolvedValue({ error: null });
    const { getByText, getByPlaceholderText, getByTestId } = await renderScreen();

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), '  new@test.com  ');
    await fireEvent.changeText(getByTestId('password-input'), 'password123');
    await fireEvent.changeText(getByTestId('confirm-password-input'), 'password123');
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

  it('requires confirm password to be filled', async () => {
    const { getByText, getByPlaceholderText, getByTestId } = await renderScreen();

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'new@test.com');
    await fireEvent.changeText(getByTestId('password-input'), 'password123');
    await fireEvent.press(getByText('CREATE ACCOUNT'));

    await waitFor(() => expect(getByText('Enter email and password')).toBeTruthy());
    expect(mockSignUpWithEmail).not.toHaveBeenCalled();
  });

  it('rejects an invalid email format', async () => {
    const { getByText, getByPlaceholderText, getByTestId } = await renderScreen();

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'not-an-email');
    await fireEvent.changeText(getByTestId('password-input'), 'password123');
    await fireEvent.changeText(getByTestId('confirm-password-input'), 'password123');
    await fireEvent.press(getByText('CREATE ACCOUNT'));

    await waitFor(() => expect(getByText('Enter a valid email')).toBeTruthy());
    expect(mockSignUpWithEmail).not.toHaveBeenCalled();
  });

  it('rejects a password shorter than 6 characters', async () => {
    const { getByText, getByPlaceholderText, getByTestId } = await renderScreen();

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'new@test.com');
    await fireEvent.changeText(getByTestId('password-input'), '123');
    await fireEvent.changeText(getByTestId('confirm-password-input'), '123');
    await fireEvent.press(getByText('CREATE ACCOUNT'));

    await waitFor(() =>
      expect(getByText('Password must be at least 6 characters')).toBeTruthy(),
    );
    expect(mockSignUpWithEmail).not.toHaveBeenCalled();
  });

  it('blocks submit when password and confirm password do not match', async () => {
    const { getByText, getByPlaceholderText, getByTestId } = await renderScreen();

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'new@test.com');
    await fireEvent.changeText(getByTestId('password-input'), 'password123');
    await fireEvent.changeText(getByTestId('confirm-password-input'), 'password124');
    await fireEvent.press(getByText('CREATE ACCOUNT'));

    // The live hint (already visible) is the only mismatch message — no duplicate error box.
    expect(mockSignUpWithEmail).not.toHaveBeenCalled();
  });

  it('shows a live hint while confirm password does not match yet', async () => {
    const { queryByText, getByText, getByTestId } = await renderScreen();

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    await fireEvent.changeText(getByTestId('password-input'), 'password123');
    expect(queryByText('Passwords do not match')).toBeNull();

    await fireEvent.changeText(getByTestId('confirm-password-input'), 'password1');
    expect(getByText('Passwords do not match')).toBeTruthy();

    await fireEvent.changeText(getByTestId('confirm-password-input'), 'password123');
    expect(queryByText('Passwords do not match')).toBeNull();
  });

  it('does not apply the sign-up min-length rule to sign-in passwords', async () => {
    mockSignInWithEmail.mockResolvedValue({ error: null });
    const onSuccess = jest.fn();
    const { getByText, getByPlaceholderText, getByTestId } = await renderScreen(onSuccess);

    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'user@test.com');
    await fireEvent.changeText(getByTestId('password-input'), 'pass');
    await fireEvent.press(getByText('SIGN IN'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(mockSignInWithEmail).toHaveBeenCalledWith('user@test.com', 'pass');
  });
});

// ─── Password visibility toggle ────────────────────────────────────────────────

describe('password visibility toggle', () => {
  it('starts with password hidden and reveals it on toggle press', async () => {
    const { getByTestId, getByText } = await renderScreen();

    expect(getByTestId('password-input').props.secureTextEntry).toBe(true);

    await fireEvent.press(getByText('Show'));
    expect(getByTestId('password-input').props.secureTextEntry).toBe(false);

    await fireEvent.press(getByText('Hide'));
    expect(getByTestId('password-input').props.secureTextEntry).toBe(true);
  });

  it('resets visibility toggles when switching modes', async () => {
    const { getByText, getByTestId, queryByTestId } = await renderScreen();

    await fireEvent.press(getByText('Show'));
    expect(getByTestId('password-input').props.secureTextEntry).toBe(false);

    await fireEvent.press(getByText("Don't have an account? Sign up"));
    expect(getByTestId('password-input').props.secureTextEntry).toBe(true);
    expect(queryByTestId('confirm-password-input')).toBeTruthy();

    await fireEvent.press(getByText('Already have an account? Sign in'));
    expect(queryByTestId('confirm-password-input')).toBeNull();
  });
});

// ─── Forgot password ──────────────────────────────────────────────────────────

describe('forgot password', () => {
  it('switches to forgot-password mode and hides the password field', async () => {
    const { getByText, queryByPlaceholderText } = await renderScreen();
    await fireEvent.press(getByText('Forgot password?'));

    expect(getByText('SEND RESET LINK')).toBeTruthy();
    expect(queryByPlaceholderText('••••••••')).toBeNull();
  });

  it('does not show the forgot-password link in sign-up mode', async () => {
    const { getByText, queryByText } = await renderScreen();
    await fireEvent.press(getByText("Don't have an account? Sign up"));

    expect(queryByText('Forgot password?')).toBeNull();
  });

  it('validates empty email before calling the API', async () => {
    const { getByText } = await renderScreen();
    await fireEvent.press(getByText('Forgot password?'));
    await fireEvent.press(getByText('SEND RESET LINK'));

    await waitFor(() => expect(getByText('Enter your email')).toBeTruthy());
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('sends the trimmed email and switches back to sign-in with a success message', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    const { getByText, getByPlaceholderText } = await renderScreen();

    await fireEvent.press(getByText('Forgot password?'));
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), '  user@test.com  ');
    await fireEvent.press(getByText('SEND RESET LINK'));

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('user@test.com');
      expect(getByText('Check your email for a password reset link.')).toBeTruthy();
      expect(getByText('SIGN IN')).toBeTruthy();
    });
  });

  it('displays the error message when the reset request fails', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: 'Rate limit exceeded' });
    const { getByText, getByPlaceholderText } = await renderScreen();

    await fireEvent.press(getByText('Forgot password?'));
    await fireEvent.changeText(getByPlaceholderText('your@email.com'), 'user@test.com');
    await fireEvent.press(getByText('SEND RESET LINK'));

    await waitFor(() => expect(getByText('Rate limit exceeded')).toBeTruthy());
  });

  it('returns to sign-in mode via "Back to sign in" without calling the API', async () => {
    const { getByText } = await renderScreen();
    await fireEvent.press(getByText('Forgot password?'));
    await fireEvent.press(getByText('Back to sign in'));

    expect(getByText('SIGN IN')).toBeTruthy();
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });
});
