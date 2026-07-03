import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { MediaThumbnail } from './MediaThumbnail';

const meta = {
  title: 'Elements/MediaThumbnail',
  component: MediaThumbnail,
  argTypes: {
    uri: { control: { type: 'text' }, description: 'Image URI — omitted shows a hatched placeholder' },
    onRemove: { action: 'onRemove' },
  },
  args: { uri: 'https://placehold.co/180x236' },
} satisfies Meta<typeof MediaThumbnail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  args: { uri: 'https://placehold.co/180x236' },
};

export const EmptyPlaceholder: Story = {
  name: 'Empty placeholder',
  args: { uri: undefined },
};

export const Removable: Story = {
  args: { uri: 'https://placehold.co/180x236', onRemove: () => {} },
};

export const Showcase: Story = {
  name: 'Showcase – Row of thumbnails',
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <MediaThumbnail uri="https://placehold.co/180x236" onRemove={() => {}} />
      <MediaThumbnail uri="https://placehold.co/180x236" onRemove={() => {}} />
      <MediaThumbnail />
    </View>
  ),
};
