import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View, Text, ScrollView } from 'react-native';
import { Sheet } from './Sheet';
import { useColors } from '@/theme';

function ShortContent() {
  const colors = useColors();
  return (
    <View style={{ padding: 24, gap: 8 }}>
      <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '700' }}>
        Confirm action
      </Text>
      <Text style={{ color: colors.text.secondary }}>
        Dynamic-height sheet — sizes itself to this content via onLayout.
      </Text>
    </View>
  );
}

function LongContent() {
  const colors = useColors();
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text
        style={{ color: colors.text.primary, fontSize: 18, fontWeight: '700', marginBottom: 8 }}
      >
        Full-height sheet (snapToMax)
      </Text>
      {Array.from({ length: 20 }).map((_, i) => (
        <Text key={i} style={{ color: colors.text.secondary }}>
          Row {i + 1} — used for long scrollable lists (stats editor, player pickers).
        </Text>
      ))}
    </ScrollView>
  );
}

// Known gap: the open/close slide animation (driven by react-native-reanimated
// via @gorhom/bottom-sheet's imperative snapToIndex) doesn't play in this
// Storybook preview — Vite's dependency pre-bundler resolves Reanimated's
// precompiled `lib/module` build instead of the raw `src` entry Metro uses
// with the reanimated babel plugin, so the underlying shared value never
// updates. Content, layout and theming below are still fully correct and
// inspectable; only the slide-in motion is missing here.
const meta = {
  title: 'Blocks/Sheet',
  component: Sheet,
  argTypes: {
    onClose: { action: 'onClose' },
  },
  args: {
    visible: true,
    onClose: () => {},
    disableClose: false,
  },
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DynamicHeight: Story = {
  name: 'Dynamic height (default)',
  args: { children: <ShortContent /> },
};

export const FullHeightScrollable: Story = {
  name: 'Full height, scrollable (snapToMax)',
  args: { snapToMax: true, children: <LongContent /> },
};

export const DisableClose: Story = {
  name: 'Pan-down-to-close disabled',
  args: { disableClose: true, children: <ShortContent /> },
};

export const Hidden: Story = {
  name: 'Closed (visible=false)',
  args: { visible: false, children: <ShortContent /> },
};
