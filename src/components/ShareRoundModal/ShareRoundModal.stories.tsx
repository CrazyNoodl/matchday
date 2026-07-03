import React, { useEffect } from 'react';
import type { Meta, StoryObj, Decorator } from '@storybook/react';
import { ShareRoundModal } from './ShareRoundModal';
import { useStore } from '@/store';
import { Colors } from '@/theme/colors';
import type { ArchivedRound, Match } from '@/store/types';

const MOCK_TEAMS = [
  { code: 'MCI', name: 'Manchester City', short: 'MCI', color: Colors.team[0] },
  { code: 'BAR', name: 'FC Barcelona', short: 'BAR', color: Colors.team[1] },
  { code: 'RMA', name: 'Real Madrid', short: 'RMA', color: Colors.team[2] },
];

const MOCK_PLAYERS = [
  { id: 'p1', name: 'Artem Rudenko', nick: 'Atom', color: Colors.player[0], teamCode: 'MCI' },
  { id: 'p2', name: 'Oleh Bondar', color: Colors.player[1], teamCode: 'BAR' },
  { id: 'p3', name: 'Ivan Petrenko', color: Colors.player[2], teamCode: 'RMA' },
];

const MOCK_MATCHES: Match[] = [
  { id: 'm1', aId: 'p1', bId: 'p2', aTeam: 'MCI', bTeam: 'BAR', aScore: 3, bScore: 1 },
  { id: 'm2', aId: 'p1', bId: 'p3', aTeam: 'MCI', bTeam: 'RMA', aScore: 2, bScore: 2 },
  { id: 'm3', aId: 'p2', bId: 'p3', aTeam: 'BAR', bTeam: 'RMA', aScore: 1, bScore: 0 },
];

const MOCK_ROUND: ArchivedRound = {
  id: 'r1',
  n: 4,
  date: '2026-06-23',
  winner: 'p1',
  games: 3,
  ranked: true,
  name: 'Round 4',
  players: ['p1', 'p2', 'p3'],
  matches: MOCK_MATCHES,
};

const withMockData: Decorator = (Story) => {
  useEffect(() => {
    useStore.setState({ players: MOCK_PLAYERS, teams: MOCK_TEAMS });
  }, []);
  return <Story />;
};

const meta = {
  title: 'Blocks/ShareRoundModal',
  component: ShareRoundModal,
  decorators: [withMockData],
  argTypes: {
    onClose: { action: 'onClose' },
  },
  args: {
    visible: true,
    onClose: () => {},
    round: MOCK_ROUND,
    roundNumber: 4,
    tournamentName: 'Sunday League',
  },
} satisfies Meta<typeof ShareRoundModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Draw: Story = {
  args: { round: { ...MOCK_ROUND, winner: '' } },
};
