import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from 'storybook/test';
import { LoginScreen } from './LoginScreen';

const meta = {
  title: 'Blocks/LoginScreen',
  component: LoginScreen,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    onSuccess: { action: 'onSuccess' },
  },
  args: { onSuccess: () => {} },
} satisfies Meta<typeof LoginScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

// Submitting in Storybook is safe: `supabaseConfigured` is false here (no
// EXPO_PUBLIC_SUPABASE_* env vars in the Vite build), so signIn/signUp both
// short-circuit with a "Supabase not configured" error instead of hitting
// the network.
export const Default: Story = {};

// Submitting with both fields empty triggers the synchronous validation
// error (no Supabase call involved) — demonstrates the error banner state
// deterministically, without needing to mock the network.
export const ValidationError: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('SIGN IN'));
  },
};
