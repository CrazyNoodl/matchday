import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { FormChip } from './FormChip';

const meta = {
  title: 'Elements/FormChip',
  component: FormChip,
  argTypes: {
    result: {
      control: { type: 'select' },
      options: ['W', 'D', 'L'],
      description: 'Match result',
    },
  },
  args: { result: 'W' },
} satisfies Meta<typeof FormChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Win: Story = { args: { result: 'W' } };
export const Draw: Story = { args: { result: 'D' } };
export const Loss: Story = { args: { result: 'L' } };

export const AllResults: Story = {
  name: 'Showcase – All results',
  render: () => (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      <FormChip result="W" />
      <FormChip result="D" />
      <FormChip result="L" />
    </View>
  ),
};

export const FormSequence: Story = {
  name: 'Showcase – Form sequence',
  render: () => (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {(['W', 'W', 'D', 'L', 'W'] as const).map((r, i) => (
        <FormChip key={i} result={r} />
      ))}
    </View>
  ),
};
