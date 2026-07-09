import React, { useEffect } from 'react';
import type { Meta, StoryObj, Decorator } from '@storybook/react-native-web-vite';
import { ShareStandingsModal } from './ShareStandingsModal';
import { useStore } from '@/store';
import { Colors } from '@/theme/colors';
import type { ArchivedRound, Match } from '@/store/types';

const MOCK_TEAMS = [
  { code: 'MCI', name: 'Manchester City', short: 'MCI', color: Colors.team[0] },
  { code: 'BAR', name: 'FC Barcelona', short: 'BAR', color: Colors.team[1] },
  { code: 'RMA', name: 'Real Madrid', short: 'RMA', color: Colors.team[2] },
];

const MOCK_PLAYERS = [
  { id: 'p1', name: 'Artem Rudenko', nick: 'Atom', teamCode: 'MCI' },
  { id: 'p2', name: 'Oleh Bondar', teamCode: 'BAR' },
  { id: 'p3', name: 'Ivan Petrenko', teamCode: 'RMA' },
];

const ROUND_1_MATCHES: Match[] = [
  { id: 'm1', aId: 'p1', bId: 'p2', aTeam: 'MCI', bTeam: 'BAR', aScore: 3, bScore: 1 },
  { id: 'm2', aId: 'p1', bId: 'p3', aTeam: 'MCI', bTeam: 'RMA', aScore: 2, bScore: 2 },
  { id: 'm3', aId: 'p2', bId: 'p3', aTeam: 'BAR', bTeam: 'RMA', aScore: 1, bScore: 0 },
];

const ROUND_2_MATCHES: Match[] = [
  { id: 'm4', aId: 'p1', bId: 'p2', aTeam: 'MCI', bTeam: 'BAR', aScore: 2, bScore: 0 },
  { id: 'm5', aId: 'p1', bId: 'p3', aTeam: 'MCI', bTeam: 'RMA', aScore: 1, bScore: 1 },
];

const FRIENDLY_ROUND_MATCHES: Match[] = [
  { id: 'm6', aId: 'p1', bId: 'p2', aTeam: 'MCI', bTeam: 'BAR', aScore: 1, bScore: 1 },
];

const MOCK_ARCHIVED_ROUNDS: ArchivedRound[] = [
  {
    id: 'r1',
    n: 1,
    date: '2026-05-04',
    winner: 'p1',
    games: ROUND_1_MATCHES.length,
    ranked: true,
    name: 'Round 1',
    players: ['p1', 'p2', 'p3'],
    matches: ROUND_1_MATCHES,
  },
  {
    id: 'r2',
    n: 2,
    date: '2026-06-01',
    winner: '',
    games: FRIENDLY_ROUND_MATCHES.length,
    ranked: false,
    name: 'Friendly',
    players: ['p1', 'p2'],
    matches: FRIENDLY_ROUND_MATCHES,
  },
  {
    id: 'r3',
    n: 3,
    date: '2026-06-23',
    winner: 'p1',
    games: ROUND_2_MATCHES.length,
    ranked: true,
    name: 'Round 3',
    players: ['p1', 'p2', 'p3'],
    matches: ROUND_2_MATCHES,
  },
];

const MOCK_RANKED_MATCHES: Match[] = [...ROUND_1_MATCHES, ...ROUND_2_MATCHES];
const MOCK_FRIENDLY_MATCHES: Match[] = FRIENDLY_ROUND_MATCHES;

const withMockData: Decorator = (Story) => {
  useEffect(() => {
    useStore.setState({ players: MOCK_PLAYERS, teams: MOCK_TEAMS });
  }, []);
  return <Story />;
};

const meta = {
  title: 'Blocks/ShareStandingsModal',
  component: ShareStandingsModal,
  decorators: [withMockData],
  argTypes: {
    onClose: { action: 'onClose' },
  },
  args: {
    visible: true,
    onClose: () => {},
    tournamentName: 'Sunday League',
    subtitle: 'Season 2026 · 8 rounds played',
    rankedMatches: MOCK_RANKED_MATCHES,
    friendlyMatches: MOCK_FRIENDLY_MATCHES,
    tournamentPlayers: ['p1', 'p2', 'p3'],
    archivedRounds: MOCK_ARCHIVED_ROUNDS,
  },
} satisfies Meta<typeof ShareStandingsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
