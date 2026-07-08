import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { DropdownMenu, type DropdownMenuItem } from './DropdownMenu';

const BASE_ITEMS: DropdownMenuItem[] = [
  { key: 'edit', label: 'Edit', onPress: () => {} },
  { key: 'share', label: 'Share', onPress: () => {} },
  { key: 'delete', label: 'Delete', onPress: () => {}, destructive: true },
];

const meta = {
  title: 'Elements/DropdownMenu',
  component: DropdownMenu,
  argTypes: {
    onClose: { action: 'onClose' },
  },
  args: {
    visible: true,
    onClose: () => {},
    position: { top: 60, left: 24 },
    items: BASE_ITEMS,
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <View style={{ height: 220 }}>
      <DropdownMenu {...args} />
    </View>
  ),
};

export const WithDisabledAndLoading: Story = {
  name: 'With disabled + loading items',
  args: {
    items: [
      { key: 'edit', label: 'Edit', onPress: () => {} },
      { key: 'sync', label: 'Syncing…', onPress: () => {}, loading: true },
      { key: 'archive', label: 'Archive', onPress: () => {}, disabled: true },
      { key: 'delete', label: 'Delete', onPress: () => {}, destructive: true },
    ],
  },
  render: (args) => (
    <View style={{ height: 260 }}>
      <DropdownMenu {...args} />
    </View>
  ),
};

export const SingleItem: Story = {
  args: { items: [{ key: 'only', label: 'Only action', onPress: () => {} }] },
  render: (args) => (
    <View style={{ height: 140 }}>
      <DropdownMenu {...args} />
    </View>
  ),
};

function InteractiveDemo() {
  const [visible, setVisible] = useState(true);
  return (
    <View style={{ height: 220 }}>
      <DropdownMenu
        visible={visible}
        onClose={() => setVisible(false)}
        position={{ top: 60, left: 24 }}
        items={BASE_ITEMS.map((item) => ({ ...item, onPress: () => setVisible(false) }))}
      />
    </View>
  );
}

export const Interactive: Story = {
  name: 'Interactive – tap backdrop or item to close',
  render: () => <InteractiveDemo />,
};
