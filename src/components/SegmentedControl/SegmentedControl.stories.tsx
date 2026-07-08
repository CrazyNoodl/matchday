import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { SegmentedControl } from './SegmentedControl';

const OPTIONS: { value: 'table' | 'cards'; label: string }[] = [
  { value: 'table', label: 'Table' },
  { value: 'cards', label: 'Cards' },
];

function LiveSegmentedControl({ variant }: { variant?: 'boxed' | 'pill' }) {
  const [value, setValue] = useState<'table' | 'cards'>('table');
  return (
    <SegmentedControl
      variant={variant}
      value={value}
      onChange={setValue}
      options={OPTIONS}
    />
  );
}

const meta = {
  title: 'Elements/SegmentedControl',
  component: SegmentedControl,
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['boxed', 'pill'],
      table: { defaultValue: { summary: 'boxed' } },
    },
  },
  args: { options: OPTIONS, value: 'table', onChange: () => {} },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Boxed: Story = {
  name: 'Boxed (round.tsx style)',
  render: () => <LiveSegmentedControl variant="boxed" />,
};

export const Pill: Story = {
  name: 'Pill (stats.tsx style)',
  render: () => <LiveSegmentedControl variant="pill" />,
};

export const Showcase: Story = {
  name: 'Showcase – Both variants',
  render: () => (
    <View style={{ gap: 16 }}>
      <LiveSegmentedControl variant="boxed" />
      <LiveSegmentedControl variant="pill" />
    </View>
  ),
};
