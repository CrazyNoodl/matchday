import type { Meta, StoryObj } from '@storybook/react';
import { ErrorFallback } from './ErrorFallback';

const meta = {
  title: 'Blocks/ErrorFallback',
  component: ErrorFallback,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    onRetry: { action: 'onRetry' },
  },
  args: { onRetry: () => {} },
} satisfies Meta<typeof ErrorFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
