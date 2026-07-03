import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { SectionLabel } from './SectionLabel';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';

const meta = {
  title: 'Elements/SectionLabel',
  component: SectionLabel,
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Label text — automatically uppercased',
    },
  },
  args: { label: 'Section' },
} satisfies Meta<typeof SectionLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Standings' } };
export const Stats: Story = { args: { label: 'Statistics' } };
export const Players: Story = { args: { label: 'Players' } };
export const Matches: Story = { args: { label: 'Recent matches' } };

export const AutoUppercase: Story = {
  name: 'Showcase – Auto uppercase',
  render: () => (
    <View style={{ gap: Spacing.lg }}>
      <SectionLabel label="this gets uppercased automatically" />
      <SectionLabel label="standings" />
      <SectionLabel label="head to head" />
    </View>
  ),
};

export const InContext: Story = {
  name: 'Showcase – In context',
  render: () => (
    <View style={{ gap: Spacing.md }}>
      <SectionLabel label="Standings" />
      <View
        style={{
          height: 40,
          borderRadius: 8,
          backgroundColor: Colors.bg.elevated,
        }}
      />
      <View
        style={{
          height: 40,
          borderRadius: 8,
          backgroundColor: Colors.bg.elevated,
        }}
      />
      <SectionLabel label="Recent matches" style={{ marginTop: Spacing.sm }} />
      <View
        style={{
          height: 40,
          borderRadius: 8,
          backgroundColor: Colors.bg.elevated,
        }}
      />
    </View>
  ),
};
