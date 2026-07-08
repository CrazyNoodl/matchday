import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { ConfirmDialog } from './ConfirmDialog';

const meta = {
  title: 'Blocks/ConfirmDialog',
  component: ConfirmDialog,
  argTypes: {
    onRequestClose: { action: 'onRequestClose' },
  },
  args: {
    visible: true,
    onRequestClose: () => {},
    title: 'DELETE MATCH?',
    description: 'This will remove the match and its stats. This cannot be undone.',
    cancel: { label: 'Cancel', onPress: () => {} },
    confirm: { label: 'Delete', onPress: () => {} },
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoButton: Story = {
  name: 'Cancel + confirm (default variant)',
};

export const Destructive: Story = {
  name: 'Cancel + destructive confirm',
  args: { icon: '🗑', variant: 'destructive', confirm: { label: 'Delete', onPress: () => {} } },
};

export const SingleButton: Story = {
  name: 'Single button (alert / OK-only)',
  args: {
    cancel: undefined,
    title: 'SOMETHING WENT WRONG',
    description: 'Could not save the match. Please try again.',
    confirm: { label: 'OK', onPress: () => {} },
  },
};

export const Gold: Story = {
  name: 'Cancel + gold confirm (high-emphasis positive action)',
  args: {
    icon: '🏁',
    variant: 'gold',
    title: 'CLOSE TOURNAMENT?',
    description: 'This archives the tournament and crowns a champion.',
    confirm: { label: 'Archive', onPress: () => {} },
  },
};

export const Neutral: Story = {
  name: 'Single neutral OK (info acknowledgment)',
  args: {
    cancel: undefined,
    variant: 'neutral',
    title: 'COULD NOT READ PHOTO',
    description: "We couldn't recognize stats in this photo.",
    confirm: { label: 'OK', onPress: () => {} },
  },
};

export const Loading: Story = {
  name: 'Confirm loading',
  args: { confirm: { label: 'Delete', onPress: () => {}, loading: true } },
};

export const Hidden: Story = {
  name: 'Closed (visible=false)',
  args: { visible: false },
};
