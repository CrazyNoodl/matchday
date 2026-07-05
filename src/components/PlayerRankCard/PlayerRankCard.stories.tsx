import React, { useEffect } from 'react';
import type { Meta, StoryObj, Decorator } from '@storybook/react';
import { View } from 'react-native';
import { PlayerRankCard } from './PlayerRankCard';
import { useStore } from '../../store';
import { Colors } from '../../theme/colors';

const MOCK_TEAMS = [
  { code: 'MCI', name: 'Manchester City', short: 'MCI', color: Colors.team[0] },
  { code: 'BAR', name: 'FC Barcelona', short: 'BAR', color: Colors.team[1] },
  { code: 'RMA', name: 'Real Madrid', short: 'RMA', color: Colors.team[2] },
];

const MOCK_PLAYERS = [
  { id: 'p1', name: 'Artem Rudenko', color: Colors.player[0], teamCode: 'MCI' },
  { id: 'p2', name: 'Oleh Bondar', color: Colors.player[1], teamCode: 'BAR' },
  { id: 'p3', name: 'Vlad Petrenko', color: Colors.player[2], teamCode: 'RMA' },
];

const MEDALS = [
  { badgeColor: Colors.accent.gold, badgeBg: 'rgba(255,212,94,0.18)', cardBorder: Colors.accent.greenBorder },
  { badgeColor: Colors.text.secondary, badgeBg: 'rgba(200,205,210,0.16)', cardBorder: Colors.border.default },
  { badgeColor: '#d08a4a', badgeBg: 'rgba(205,127,50,0.16)', cardBorder: Colors.border.default },
];

const withMockData: Decorator = (Story) => {
  useEffect(() => {
    useStore.setState({ teams: MOCK_TEAMS, players: MOCK_PLAYERS });
  }, []);
  return <Story />;
};

const meta = {
  title: 'Cards/PlayerRankCard',
  component: PlayerRankCard,
  decorators: [withMockData],
  argTypes: {
    rank: { control: { type: 'number' } },
    points: { control: { type: 'number' } },
    pointsLabel: { control: { type: 'text' } },
    emphasized: { control: { type: 'boolean' } },
  },
  args: {
    rank: 1,
    medal: MEDALS[0],
    playerId: 'p1',
    name: 'Artem Rudenko',
    subText: '12P · 8W 2D 2L',
    points: 26,
    pointsLabel: 'PTS',
    pointsColor: Colors.accent.green,
  },
} satisfies Meta<typeof PlayerRankCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstPlace: Story = {
  name: '#1 with medal',
  args: { rank: 1, medal: MEDALS[0], emphasized: true, pointsColor: Colors.accent.green },
};

export const SecondPlace: Story = {
  name: '#2 with medal',
  args: { rank: 2, medal: MEDALS[1], playerId: 'p2', name: 'Oleh Bondar', points: 22, emphasized: false, pointsColor: undefined },
};

export const NoMedal: Story = {
  name: 'No medal (rank > 3)',
  args: { rank: 5, medal: null, playerId: 'p3', name: 'Vlad Petrenko', points: 9, pointsColor: undefined },
};

export const Showcase: Story = {
  name: 'Showcase – Top 3',
  render: () => (
    <View style={{ gap: 8 }}>
      <PlayerRankCard rank={1} medal={MEDALS[0]} playerId="p1" name="Artem Rudenko" subText="12P · 8W 2D 2L" points={26} pointsLabel="PTS" emphasized />
      <PlayerRankCard rank={2} medal={MEDALS[1]} playerId="p2" name="Oleh Bondar" subText="12P · 7W 1D 4L" points={22} pointsLabel="PTS" />
      <PlayerRankCard rank={3} medal={MEDALS[2]} playerId="p3" name="Vlad Petrenko" subText="12P · 5W 3D 4L" points={18} pointsLabel="PTS" />
    </View>
  ),
};
