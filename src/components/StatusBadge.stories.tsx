import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { StatusBadge } from './StatusBadge';

const meta = {
  title: 'Components/StatusBadge',
  component: StatusBadge,
  parameters: { backgrounds: { default: 'app-dark' } },
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['live', 'soon', 'leader', 'editing', 'archived', 'friendly', 'auto', 'ranked'],
      description: 'Badge type determines color and label',
    },
  },
  args: { type: 'live' },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Individual stories ───────────────────────────────────────────────────────

export const Live: Story = { args: { type: 'live' } };
export const Soon: Story = { args: { type: 'soon' } };
export const Leader: Story = { args: { type: 'leader' } };
export const Editing: Story = { args: { type: 'editing' } };
export const Archived: Story = { args: { type: 'archived' } };
export const Friendly: Story = { args: { type: 'friendly' } };
export const Auto: Story = { args: { type: 'auto' } };
export const Ranked: Story = { args: { type: 'ranked' } };

// ─── Showcase ─────────────────────────────────────────────────────────────────

export const AllBadges: Story = {
  name: 'Showcase – All badges',
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {(['live', 'soon', 'leader', 'editing', 'archived', 'friendly', 'auto', 'ranked'] as const).map(
        (type) => <StatusBadge key={type} type={type} />,
      )}
    </View>
  ),
};

export const GreenGroup: Story = {
  name: 'Showcase – Green (active)',
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <StatusBadge type="live" />
      <StatusBadge type="leader" />
      <StatusBadge type="ranked" />
    </View>
  ),
};

export const BlueGroup: Story = {
  name: 'Showcase – Blue (pending)',
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <StatusBadge type="soon" />
      <StatusBadge type="editing" />
      <StatusBadge type="friendly" />
    </View>
  ),
};

export const MutedGroup: Story = {
  name: 'Showcase – Muted (inactive)',
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <StatusBadge type="archived" />
      <StatusBadge type="auto" />
    </View>
  ),
};
