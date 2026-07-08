import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text, TouchableOpacity } from 'react-native';
import { NavHeader } from './NavHeader';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';

const meta = {
  title: 'Elements/NavHeader',
  component: NavHeader,
  argTypes: {
    title: { control: { type: 'text' } },
    subtitle: { control: { type: 'text' } },
    onBack: { action: 'onBack' },
  },
  args: { title: 'Round 4' },
} satisfies Meta<typeof NavHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = { args: { title: 'Round 4' } };

export const WithBack: Story = {
  name: 'With back button',
  args: { title: 'Round 4', onBack: () => {} },
};

export const WithSubtitle: Story = {
  args: { title: 'Round 4', subtitle: 'Summer League · 8 matches', onBack: () => {} },
};

export const WithRightElement: Story = {
  name: 'With right action',
  args: {
    title: 'Match detail',
    onBack: () => {},
    rightElement: (
      <TouchableOpacity>
        <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.accent.green }}>
          Edit
        </Text>
      </TouchableOpacity>
    ),
  },
};
