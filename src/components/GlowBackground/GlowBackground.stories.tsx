import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { GlowBackground } from './GlowBackground';
import { Colors } from '../../theme/colors';

const Frame = ({ children }: { children: React.ReactNode }) => (
  <View
    style={{
      width: 320,
      height: 220,
      backgroundColor: Colors.bg.base,
      overflow: 'hidden',
    }}
  >
    {children}
  </View>
);

const meta = {
  title: 'Elements/GlowBackground',
  component: GlowBackground,
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['green', 'blue'],
      description: 'Glow color/size preset',
      table: { defaultValue: { summary: 'green' } },
    },
  },
  args: { variant: 'green' },
  decorators: [(Story) => <Frame><Story /></Frame>],
} satisfies Meta<typeof GlowBackground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Green: Story = { args: { variant: 'green' } };
export const Blue: Story = { args: { variant: 'blue' } };
