import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { StatsRow } from './StatsRow';

const meta = {
  title: 'Elements/StatsRow',
  component: StatsRow,
  argTypes: {
    label: { control: { type: 'text' } },
    aValue: { control: { type: 'number' } },
    bValue: { control: { type: 'number' } },
    aWins: { control: { type: 'boolean' } },
  },
  args: { label: 'Possession', aValue: 58, bValue: 42, aWins: true },
} satisfies Meta<typeof StatsRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ASideWinning: Story = {
  name: 'A side winning',
  args: { label: 'Shots on target', aValue: 7, bValue: 3, aWins: true },
};

export const BSideWinning: Story = {
  name: 'B side winning',
  args: { label: 'Shots on target', aValue: 3, bValue: 7, aWins: false },
};

export const EvenSplit: Story = {
  name: 'Tie',
  args: { label: 'Fouls', aValue: 5, bValue: 5, aWins: null },
};

export const ZeroValues: Story = {
  args: { label: 'Red cards', aValue: 0, bValue: 0, aWins: null },
};

export const Showcase: Story = {
  name: 'Showcase – Full match stats',
  render: () => (
    <View style={{ width: 320 }}>
      <StatsRow label="Possession" aValue={58} bValue={42} aWins />
      <StatsRow label="Shots on target" aValue={7} bValue={3} aWins />
      <StatsRow label="Fouls" aValue={4} bValue={9} aWins={false} />
      <StatsRow label="Corners" aValue={5} bValue={5} aWins={null} />
    </View>
  ),
};
