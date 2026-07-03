import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
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
