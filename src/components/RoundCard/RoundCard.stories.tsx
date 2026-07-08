import React, { useEffect } from 'react';
import type { Meta, StoryObj, Decorator } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { RoundCard } from './RoundCard';
import { useStore } from '../../store';
import { Colors } from '../../theme/colors';

const MOCK_TEAMS = [{ code: 'MCI', name: 'Manchester City', short: 'MCI', color: Colors.team[0] }];

const MOCK_PLAYERS = [
  { id: 'p1', name: 'Artem Rudenko', nick: 'Atom', teamCode: 'MCI' },
];

const withMockData: Decorator = (Story) => {
  useEffect(() => {
    useStore.setState({ teams: MOCK_TEAMS, players: MOCK_PLAYERS });
  }, []);
  return <Story />;
};

const meta = {
  title: 'Cards/RoundCard',
  component: RoundCard,
  decorators: [withMockData],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['card', 'row'],
      table: { defaultValue: { summary: 'card' } },
    },
    n: { control: { type: 'number' } },
    ranked: { control: { type: 'boolean' } },
    dateText: { control: { type: 'text' } },
    matchCountText: { control: { type: 'text' } },
    onPress: { action: 'onPress' },
  },
  args: {
    n: 4,
    ranked: true,
    dateText: '23/06/26',
    matchCountText: '8 matches',
    winnerId: 'p1',
    winnerName: 'Atom',
    onPress: () => {},
  },
} satisfies Meta<typeof RoundCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CardVariant: Story = {
  name: 'Card variant (tournament.tsx)',
  args: { variant: 'card' },
};

export const RowVariant: Story = {
  name: 'Row variant (archive.tsx)',
  args: { variant: 'row' },
};

export const Friendly: Story = {
  name: 'Friendly round',
  args: { variant: 'card', ranked: false },
};

export const FriendlyRow: Story = {
  name: 'Friendly round (row variant)',
  args: { variant: 'row', ranked: false },
};

export const NoWinnerDraw: Story = {
  name: 'No winner (draw)',
  args: { winnerId: undefined, winnerName: '—' },
};

export const Showcase: Story = {
  name: 'Showcase – Card vs Row',
  render: () => (
    <View style={{ gap: 12 }}>
      <RoundCard
        variant="card"
        n={4}
        ranked
        dateText="23/06/26"
        matchCountText="8 matches"
        winnerId="p1"
        winnerName="Atom"
        onPress={() => {}}
      />
      <RoundCard
        variant="row"
        n={3}
        ranked
        dateText="16/06/26"
        matchCountText="6 matches"
        winnerId="p1"
        winnerName="Atom"
        onPress={() => {}}
      />
    </View>
  ),
};
