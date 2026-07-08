import React, { useEffect } from 'react';
import type { Meta, StoryObj, Decorator } from '@storybook/react-native-web-vite';
import { ShareStandingsModal } from './ShareStandingsModal';
import { useStore } from '@/store';
import { Colors } from '@/theme/colors';
import type { Standing } from '@/utils/standings';

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

const MOCK_STANDINGS: Standing[] = [
  { playerId: 'p1', played: 8, wins: 6, draws: 1, losses: 1, gf: 20, ga: 8, gd: 12, pts: 19 },
  { playerId: 'p2', played: 8, wins: 4, draws: 2, losses: 2, gf: 15, ga: 12, gd: 3, pts: 14 },
  { playerId: 'p3', played: 8, wins: 1, draws: 1, losses: 6, gf: 7, ga: 22, gd: -15, pts: 4 },
];

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
    standings: MOCK_STANDINGS,
  },
} satisfies Meta<typeof ShareStandingsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
