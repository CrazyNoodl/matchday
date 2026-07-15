import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';
import { ResetPasswordScreen } from './ResetPasswordScreen';

const meta = {
  title: 'Blocks/ResetPasswordScreen',
  component: ResetPasswordScreen,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    onDone: { action: 'onDone' },
  },
  args: { onDone: () => {} },
} satisfies Meta<typeof ResetPasswordScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

// `supabaseConfigured` is false in the Vite build (no EXPO_PUBLIC_SUPABASE_*
// env vars), so submitting here short-circuits with a "Supabase not
// configured" error instead of hitting the network.
export const Default: Story = {};

export const ValidationError: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('SET NEW PASSWORD'));
  },
};
