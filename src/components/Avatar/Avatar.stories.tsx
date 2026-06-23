import React, { useEffect } from 'react';
import type { Meta, StoryObj, Decorator } from '@storybook/react';
import { View } from 'react-native';
import { Avatar } from './Avatar';
import { useStore } from '../../store';
import { Colors } from '../../theme/colors';

const MOCK_TEAMS = [
  { code: 'MCI', name: 'Manchester City', short: 'MCI', color: Colors.team[0] },
  { code: 'BAR', name: 'FC Barcelona', short: 'BAR', color: Colors.team[1] },
  { code: 'LOGO', name: 'Logo Team', short: 'LGO', color: Colors.team[2], logo: 'https://placehold.co/64x64' },
];

const MOCK_PLAYERS = [
  { id: 'p1', name: 'Artem Rudenko', nick: 'Atom', color: Colors.player[0], teamCode: 'MCI' },
  { id: 'p2', name: 'Oleh Bondar', color: Colors.player[1], teamCode: 'BAR' },
  { id: 'p3', name: 'Logo Player', color: Colors.player[2], teamCode: 'LOGO' },
];

const withMockData: Decorator = (Story) => {
  useEffect(() => {
    useStore.setState({ teams: MOCK_TEAMS, players: MOCK_PLAYERS });
  }, []);
  return <Story />;
};

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: { backgrounds: { default: 'app-dark' } },
  decorators: [withMockData],
  argTypes: {
    playerId: {
      control: { type: 'select' },
      options: ['p1', 'p2', 'p3', 'unknown'],
      description: 'Player id — looked up in the store for team/color',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl'],
      table: { defaultValue: { summary: 'md' } },
    },
  },
  args: { playerId: 'p1', size: 'md' },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { playerId: 'p1' } };

export const WithLogo: Story = {
  name: 'Team with logo',
  args: { playerId: 'p3' },
};

export const UnknownPlayer: Story = {
  name: 'Fallback – unknown player',
  args: { playerId: 'unknown' },
};

export const AllSizes: Story = {
  name: 'Showcase – All sizes',
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Avatar playerId="p1" size="sm" />
      <Avatar playerId="p1" size="md" />
      <Avatar playerId="p1" size="lg" />
      <Avatar playerId="p1" size="xl" />
    </View>
  ),
};

export const AllPlayers: Story = {
  name: 'Showcase – All players',
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {MOCK_PLAYERS.map((p) => (
        <Avatar key={p.id} playerId={p.id} size="lg" />
      ))}
    </View>
  ),
};
