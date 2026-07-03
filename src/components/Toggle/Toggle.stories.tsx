import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { Toggle } from './Toggle';

const meta = {
  title: 'Elements/Toggle',
  component: Toggle,
  argTypes: {
    onValueChange: { action: 'onValueChange' },
  },
  args: {
    label: 'Ranked',
    value: true,
    onValueChange: () => {},
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = {};

export const Off: Story = {
  args: { value: false },
};

export const WithSubtitle: Story = {
  name: 'With subtitle',
  args: {
    label: 'Ranked',
    subtitle: 'Counts toward the tournament standings',
    value: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Ranked',
    subtitle: 'Limit reached — this round is friendly',
    value: false,
    disabled: true,
  },
};

function InteractiveDemo() {
  const [value, setValue] = useState(true);
  return <Toggle label="Include standings" value={value} onValueChange={setValue} />;
}

export const Interactive: Story = {
  render: () => (
    <View style={{ width: 320 }}>
      <InteractiveDemo />
    </View>
  ),
};
