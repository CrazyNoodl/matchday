import React, { useEffect } from 'react';
import type { Meta, StoryObj, Decorator } from '@storybook/react';
import { View } from 'react-native';
import { StandingCard } from './StandingCard';
import { useStore } from '../../store';
import { Colors } from '../../theme/colors';
import type { Standing } from '../../utils/standings';

const MOCK_TEAMS = [
  { code: 'MCI', name: 'Manchester City', short: 'MCI', color: Colors.team[0] },
  { code: 'BAR', name: 'FC Barcelona', short: 'BAR', color: Colors.team[1] },
];

const MOCK_PLAYERS = [
  { id: 'p1', name: 'Artem Rudenko', nick: 'Atom', color: Colors.player[0], teamCode: 'MCI' },
  { id: 'p2', name: 'Oleh Bondar', color: Colors.player[1], teamCode: 'BAR' },
];

const MOCK_MATCHES = [
  { id: 'm1', aId: 'p1', bId: 'p2', aTeam: 'MCI', bTeam: 'BAR', aScore: 3, bScore: 1 },
  { id: 'm2', aId: 'p1', bId: 'p2', aTeam: 'MCI', bTeam: 'BAR', aScore: 1, bScore: 1 },
  { id: 'm3', aId: 'p1', bId: 'p2', aTeam: 'MCI', bTeam: 'BAR', aScore: 0, bScore: 2 },
];

const withMockData: Decorator = (Story) => {
  useEffect(() => {
    useStore.setState({ teams: MOCK_TEAMS, players: MOCK_PLAYERS, matches: MOCK_MATCHES, showNick: true });
  }, []);
  return <Story />;
};

const baseStanding: Standing = {
  playerId: 'p1',
  played: 3,
  wins: 1,
  draws: 1,
  losses: 1,
  gf: 4,
  ga: 4,
  gd: 0,
  pts: 4,
};

const meta = {
  title: 'Cards/StandingCard',
  component: StandingCard,
  decorators: [withMockData],
  argTypes: {
    position: { control: { type: 'number' } },
    showFormChips: { control: { type: 'boolean' } },
  },
  args: { standing: baseStanding, position: 1, playerId: 'p1', showFormChips: true },
} satisfies Meta<typeof StandingCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Leader: Story = {
  args: { position: 1, standing: { ...baseStanding, pts: 7, gd: 3 } },
};

export const SecondPlace: Story = {
  args: {
    position: 2,
    playerId: 'p2',
    standing: { ...baseStanding, playerId: 'p2', pts: 4, gd: 0 },
  },
};

export const NegativeGD: Story = {
  name: 'Negative goal difference',
  args: { position: 3, standing: { ...baseStanding, gd: -3 } },
};

export const WithoutFormChips: Story = {
  args: { showFormChips: false },
};

export const Showcase: Story = {
  name: 'Showcase – Mini table',
  render: () => (
    <View style={{ gap: 4 }}>
      <StandingCard position={1} playerId="p1" standing={{ ...baseStanding, pts: 7, gd: 3 }} />
      <StandingCard position={2} playerId="p2" standing={{ ...baseStanding, playerId: 'p2', pts: 4, gd: 0 }} />
    </View>
  ),
};
