// Component tests for ResetPasswordScreen.
// @testing-library/react-native v14: render, fireEvent.press and
// fireEvent.changeText are all async — every call must be awaited.

import '@/i18n';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ResetPasswordScreen } from '../ResetPasswordScreen';
import { updatePassword } from '@/supabase/auth';

jest.mock('@/supabase/auth', () => ({
  updatePassword: jest.fn(),
}));

const mockUpdatePassword = updatePassword as jest.Mock;

async function renderScreen(onDone = jest.fn()) {
  return render(<ResetPasswordScreen onDone={onDone} />);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('initial render', () => {
  it('shows two password inputs and the submit button', async () => {
    const { getAllByPlaceholderText, getByText } = await renderScreen();
    expect(getAllByPlaceholderText('••••••••')).toHaveLength(2);
    expect(getByText('SET NEW PASSWORD')).toBeTruthy();
  });
});

describe('validation', () => {
  it('shows an error and does not call the API when both fields are empty', async () => {
    const { getByText } = await renderScreen();
    await fireEvent.press(getByText('SET NEW PASSWORD'));

    await waitFor(() => expect(getByText('Enter and confirm your new password')).toBeTruthy());
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it('shows an error and does not call the API when passwords do not match', async () => {
    const { getByText, getAllByPlaceholderText } = await renderScreen();
    const [passwordInput, confirmInput] = getAllByPlaceholderText('••••••••');

    await fireEvent.changeText(passwordInput, 'newpass123');
    await fireEvent.changeText(confirmInput, 'different123');
    await fireEvent.press(getByText('SET NEW PASSWORD'));

    await waitFor(() => expect(getByText('Passwords do not match')).toBeTruthy());
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });
});

describe('submit', () => {
  it('calls updatePassword and onDone when passwords match', async () => {
    mockUpdatePassword.mockResolvedValue({ error: null });
    const onDone = jest.fn();
    const { getByText, getAllByPlaceholderText } = await renderScreen(onDone);
    const [passwordInput, confirmInput] = getAllByPlaceholderText('••••••••');

    await fireEvent.changeText(passwordInput, 'newpass123');
    await fireEvent.changeText(confirmInput, 'newpass123');
    await fireEvent.press(getByText('SET NEW PASSWORD'));

    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledWith('newpass123');
      expect(onDone).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the API error and does not call onDone on failure', async () => {
    mockUpdatePassword.mockResolvedValue({ error: 'Password should be at least 6 characters' });
    const onDone = jest.fn();
    const { getByText, getAllByPlaceholderText } = await renderScreen(onDone);
    const [passwordInput, confirmInput] = getAllByPlaceholderText('••••••••');

    await fireEvent.changeText(passwordInput, '123');
    await fireEvent.changeText(confirmInput, '123');
    await fireEvent.press(getByText('SET NEW PASSWORD'));

    await waitFor(() => expect(getByText('Password should be at least 6 characters')).toBeTruthy());
    expect(onDone).not.toHaveBeenCalled();
  });
});
