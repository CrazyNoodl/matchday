import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { EmptyState } from './EmptyState';
import { Colors } from '../../theme/colors';

const meta = {
  title: 'Elements/EmptyState',
  component: EmptyState,
  argTypes: {
    message: {
      control: { type: 'text' },
      description: 'Main placeholder message',
    },
    ctaText: {
      control: { type: 'text' },
      description: 'Optional call-to-action button label',
    },
    ctaColor: {
      control: { type: 'color' },
      description: 'CTA text color (defaults to accent green)',
    },
  },
  args: {
    message: 'No matches yet',
    ctaText: undefined,
    ctaColor: undefined,
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithoutCTA: Story = {
  args: { message: 'No matches yet' },
};

export const WithCTA: Story = {
  args: {
    message: 'No matches yet',
    ctaText: 'Add first match',
  },
};

export const WithCTABlue: Story = {
  name: 'With CTA – blue',
  args: {
    message: 'No players added',
    ctaText: 'Add player',
    ctaColor: Colors.accent.blue,
  },
};

export const WithCTARed: Story = {
  name: 'With CTA – red',
  args: {
    message: 'Tournament is empty',
    ctaText: 'Delete tournament',
    ctaColor: Colors.accent.red,
  },
};

export const LongMessage: Story = {
  name: 'Long message',
  args: {
    message: "You haven't added any matches to this round yet. Tap below to record your first result.",
    ctaText: 'Add match',
  },
};

export const NoTournament: Story = {
  name: 'No tournament',
  args: {
    message: 'Start your first tournament to track matches and standings.',
    ctaText: 'Create tournament',
  },
};
