import React, { useEffect } from 'react';
import type { Meta, StoryObj, Decorator } from '@storybook/react-native-web-vite';
import { NewRoundModal } from './NewRoundModal';
import { useStore } from '@/store';
import { Colors } from '@/theme/colors';
import type { ArchivedRound } from '@/store/types';

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

const MOCK_ARCHIVED_ROUND: ArchivedRound = {
  id: 'r1',
  n: 1,
  date: '2026-06-20',
  winner: 'p1',
  games: 3,
  ranked: true,
  name: 'Round 1',
  players: ['p1', 'p2'],
  matches: [],
};

function withMockData(overrides: Partial<ReturnType<typeof useStore.getState>> = {}): Decorator {
  return function MockDataDecorator(Story) {
    useEffect(() => {
      useStore.setState({
        modal: 'newRound',
        tournamentName: 'Sunday League',
        players: MOCK_PLAYERS,
        teams: MOCK_TEAMS,
        tournamentPlayers: ['p1', 'p2'],
        tournamentRounds: 6,
        archivedRounds: [MOCK_ARCHIVED_ROUND],
        ...overrides,
      });
    }, []);
    return <Story />;
  };
}

const meta = {
  title: 'Blocks/NewRoundModal',
  component: NewRoundModal,
  decorators: [withMockData()],
} satisfies Meta<typeof NewRoundModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const RankedLimitReached: Story = {
  name: 'Ranked limit reached (defaults to friendly)',
  decorators: [withMockData({ tournamentRounds: 1, archivedRounds: [MOCK_ARCHIVED_ROUND] })],
};

export const ManyPlayers: Story = {
  decorators: [
    withMockData({
      players: [
        ...MOCK_PLAYERS,
        { id: 'p4', name: 'Denys Melnyk', color: Colors.player[3], teamCode: 'MCI' },
        { id: 'p5', name: 'Yuri Kovalenko', color: Colors.player[4], teamCode: 'BAR' },
        { id: 'p6', name: 'Serhii Tkachenko', color: Colors.player[5], teamCode: 'RMA' },
      ],
    }),
  ],
};
