import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { MediaSlider, type MediaSliderItem } from './MediaSlider';

const PHOTOS: MediaSliderItem[] = [
  { uri: 'https://placehold.co/800x1200/3ddc84/0c0e10?text=Photo+1', type: 'image' },
  { uri: 'https://placehold.co/800x1200/6aa6ff/0c0e10?text=Photo+2', type: 'image' },
  { uri: 'https://placehold.co/800x1200/f6c350/0c0e10?text=Video', type: 'video' },
];

const meta = {
  title: 'Blocks/MediaSlider',
  component: MediaSlider,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    onClose: { action: 'onClose' },
  },
  args: { items: PHOTOS, initialIndex: 0, onClose: () => {} },
} satisfies Meta<typeof MediaSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SinglePhoto: Story = {
  name: 'Single photo (no dots)',
  args: { items: [PHOTOS[0]] },
};

export const StartOnVideo: Story = {
  name: 'Opened on a video slide',
  args: { initialIndex: 2 },
};
