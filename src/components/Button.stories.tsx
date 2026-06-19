import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    backgrounds: { default: 'app-dark' },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outlined', 'ghost', 'destructive'],
      description: 'Visual style of the button',
      table: {
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Padding and font-size preset',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    label: {
      control: { type: 'text' },
      description: 'Button label text',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Prevents interaction and dims the button',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Replaces the label with an ActivityIndicator',
    },
    fullWidth: {
      control: { type: 'boolean' },
      description: 'Stretches button to fill its parent container',
    },
    onPress: { action: 'onPress' },
  },
  args: {
    label: 'Button',
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
    fullWidth: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Individual variant stories ──────────────────────────────────────────────

export const Primary: Story = {
  args: { variant: 'primary', label: 'Save match' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', label: 'Cancel' },
};

export const Outlined: Story = {
  args: { variant: 'outlined', label: 'View details' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', label: 'Dismiss' },
};

export const Destructive: Story = {
  args: { variant: 'destructive', label: 'Delete match' },
};

// ─── State stories ────────────────────────────────────────────────────────────

export const Loading: Story = {
  args: { loading: true, label: 'Saving…' },
};

export const Disabled: Story = {
  args: { disabled: true, label: 'Not available' },
};

export const FullWidth: Story = {
  args: { fullWidth: true, label: 'Start round' },
  decorators: [
    (Story) => (
      <View style={{ width: 320 }}>
        <Story />
      </View>
    ),
  ],
};

// ─── Size stories ─────────────────────────────────────────────────────────────

export const SizeSmall: Story = {
  name: 'Size – Small',
  args: { size: 'sm', label: 'Small' },
};

export const SizeMedium: Story = {
  name: 'Size – Medium',
  args: { size: 'md', label: 'Medium' },
};

export const SizeLarge: Story = {
  name: 'Size – Large',
  args: { size: 'lg', label: 'Large' },
};

// ─── Showcase stories (no controls) ──────────────────────────────────────────

export const AllVariants: Story = {
  name: 'Showcase – All variants',
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <Button label="Primary" variant="primary" />
      <Button label="Secondary" variant="secondary" />
      <Button label="Outlined" variant="outlined" />
      <Button label="Ghost" variant="ghost" />
      <Button label="Destructive" variant="destructive" />
    </View>
  ),
};

export const AllSizes: Story = {
  name: 'Showcase – All sizes',
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <Button label="Small button" size="sm" />
      <Button label="Medium button" size="md" />
      <Button label="Large button" size="lg" />
    </View>
  ),
};

export const AllStates: Story = {
  name: 'Showcase – Default / Loading / Disabled',
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <Button label="Default" variant="primary" />
      <Button label="Loading" variant="primary" loading />
      <Button label="Disabled" variant="primary" disabled />
    </View>
  ),
};

export const AllVariantsLoading: Story = {
  name: 'Showcase – All variants loading',
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <Button label="Primary" variant="primary" loading />
      <Button label="Secondary" variant="secondary" loading />
      <Button label="Outlined" variant="outlined" loading />
      <Button label="Ghost" variant="ghost" loading />
      <Button label="Destructive" variant="destructive" loading />
    </View>
  ),
};

export const AllVariantsDisabled: Story = {
  name: 'Showcase – All variants disabled',
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <Button label="Primary" variant="primary" disabled />
      <Button label="Secondary" variant="secondary" disabled />
      <Button label="Outlined" variant="outlined" disabled />
      <Button label="Ghost" variant="ghost" disabled />
      <Button label="Destructive" variant="destructive" disabled />
    </View>
  ),
};

export const FullGrid: Story = {
  name: 'Showcase – Full grid',
  render: () => (
    <View style={{ gap: 20 }}>
      {(['primary', 'secondary', 'outlined', 'ghost', 'destructive'] as const).map(
        (variant) => (
          <View key={variant} style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Button label={variant} variant={variant} size="sm" />
              <Button label={variant} variant={variant} size="md" />
              <Button label={variant} variant={variant} size="lg" />
              <Button label={variant} variant={variant} loading />
              <Button label={variant} variant={variant} disabled />
            </View>
          </View>
        ),
      )}
    </View>
  ),
};
