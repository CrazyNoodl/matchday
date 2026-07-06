import type { Meta, StoryObj } from '@storybook/react';
import { OfflineScreen } from './OfflineScreen';

const meta = {
  title: 'Blocks/OfflineScreen',
  component: OfflineScreen,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof OfflineScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
