import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { ConfettiPiece } from './ConfettiPiece';

const meta = {
  title: 'Elements/ConfettiPiece',
  component: ConfettiPiece,
  args: { delay: 0 },
} satisfies Meta<typeof ConfettiPiece>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  render: (args) => (
    <View style={{ height: 200, overflow: 'hidden' }}>
      <ConfettiPiece {...args} />
    </View>
  ),
};

export const Burst: Story = {
  name: 'Showcase – Burst (as used in WinnerCelebrationModal)',
  render: () => (
    <View style={{ height: 300, overflow: 'hidden' }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <ConfettiPiece key={i} delay={i * 80} />
      ))}
    </View>
  ),
};
