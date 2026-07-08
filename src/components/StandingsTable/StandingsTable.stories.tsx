import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StandingsTable, type StandingsColumn } from './StandingsTable';
import type { Standing } from '@/utils/standings';
import type { Player } from '@/store/types';

const COLUMNS: StandingsColumn[] = [
  { key: 'played', label: 'P' },
  { key: 'wins', label: 'W' },
  { key: 'draws', label: 'D' },
  { key: 'losses', label: 'L' },
  { key: 'gf', label: 'GF' },
  { key: 'ga', label: 'GA' },
  { key: 'gd', label: 'GD' },
  { key: 'pts', label: 'PTS' },
];

const PLAYERS: Player[] = [
  { id: 'p1', name: 'Artem Rudenko', nick: 'Atom', teamCode: 'MCI' },
  { id: 'p2', name: 'Oleh Bondar', teamCode: 'BAR' },
  {
    id: 'p3',
    name: 'A Player With A Really Long Name',
    nick: 'Longname',
    teamCode: 'RMA',
  },
];

const STANDINGS: Standing[] = [
  { playerId: 'p1', played: 8, wins: 6, draws: 1, losses: 1, gf: 20, ga: 8, gd: 12, pts: 19 },
  { playerId: 'p2', played: 8, wins: 4, draws: 2, losses: 2, gf: 15, ga: 12, gd: 3, pts: 14 },
  { playerId: 'p3', played: 8, wins: 1, draws: 1, losses: 6, gf: 7, ga: 22, gd: -15, pts: 4 },
];

const meta = {
  title: 'Cards/StandingsTable',
  component: StandingsTable,
  argTypes: {
    compact: { control: { type: 'boolean' } },
  },
  args: {
    standings: STANDINGS,
    players: PLAYERS,
    columns: COLUMNS,
    playerLabel: 'PLAYER',
  },
} satisfies Meta<typeof StandingsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Compact: Story = {
  name: 'Compact (nick or name, single line)',
  args: { compact: true },
};

export const PerGameColumns: Story = {
  name: 'Per-game columns (stats screen)',
  args: {
    columns: [
      { key: 'played', label: 'P' },
      { key: 'gfPerGame', label: 'GF/G' },
      { key: 'gaPerGame', label: 'GA/G' },
      { key: 'pts', label: 'PTS' },
    ],
  },
};

export const Empty: Story = {
  args: { standings: [], emptyLabel: 'No matches played yet' },
};
