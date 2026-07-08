import React, { useEffect } from 'react';
import type { Meta, StoryObj, Decorator } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { TeamBadge } from './TeamBadge';
import { useStore } from '../../store';
import { Colors } from '../../theme/colors';

// Seed the store with representative teams before each story renders.
// The store uses localStorage on web so this is safe in Storybook.
const MOCK_TEAMS = [
  { code: 'MCI', name: 'Manchester City', short: 'MCI', color: Colors.team[0] },
  { code: 'BAR', name: 'FC Barcelona',    short: 'BAR', color: Colors.team[1] },
  { code: 'RMA', name: 'Real Madrid',     short: 'RMA', color: Colors.team[2] },
  { code: 'LIV', name: 'Liverpool',       short: 'LIV', color: Colors.team[3] },
  { code: 'PSG', name: 'PSG',             short: 'PSG', color: Colors.team[4] },
  { code: 'JUV', name: 'Juventus',        short: 'JUV', color: Colors.team[5] },
  { code: 'ACM', name: 'AC Milan',        short: 'ACM', color: Colors.team[6] },
];

const withTeams: Decorator = (Story) => {
  useEffect(() => {
    useStore.setState({ teams: MOCK_TEAMS });
  }, []);
  return <Story />;
};

const meta = {
  title: 'Elements/TeamBadge',
  component: TeamBadge,
  decorators: [withTeams],
  argTypes: {
    teamCode: {
      control: { type: 'select' },
      options: ['MCI', 'BAR', 'RMA', 'LIV', 'PSG', 'JUV', 'ACM'],
      description: 'Team code — looked up in the store for color',
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'md', 'lg'],
      description: 'Badge size',
      table: { defaultValue: { summary: 'md' } },
    },
  },
  args: { teamCode: 'MCI', size: 'md' },
} satisfies Meta<typeof TeamBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Individual stories ───────────────────────────────────────────────────────

export const ManchesterCity: Story = { args: { teamCode: 'MCI', size: 'md' } };
export const Barcelona: Story = { args: { teamCode: 'BAR', size: 'md' } };
export const RealMadrid: Story = { args: { teamCode: 'RMA', size: 'md' } };

// ─── Size stories ─────────────────────────────────────────────────────────────

export const SizeXS: Story = { name: 'Size – xs', args: { teamCode: 'MCI', size: 'xs' } };
export const SizeMD: Story = { name: 'Size – md', args: { teamCode: 'MCI', size: 'md' } };
export const SizeLG: Story = { name: 'Size – lg', args: { teamCode: 'MCI', size: 'lg' } };

// ─── Showcase ─────────────────────────────────────────────────────────────────

export const AllSizes: Story = {
  name: 'Showcase – All sizes',
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <TeamBadge teamCode="MCI" size="xs" />
      <TeamBadge teamCode="MCI" size="md" />
      <TeamBadge teamCode="MCI" size="lg" />
    </View>
  ),
};

export const AllTeams: Story = {
  name: 'Showcase – All teams (md)',
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {MOCK_TEAMS.map((t) => (
        <TeamBadge key={t.code} teamCode={t.code} size="md" />
      ))}
    </View>
  ),
};

export const AllTeamsLarge: Story = {
  name: 'Showcase – All teams (lg)',
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {MOCK_TEAMS.map((t) => (
        <TeamBadge key={t.code} teamCode={t.code} size="lg" />
      ))}
    </View>
  ),
};

export const UnknownTeam: Story = {
  name: 'Fallback – unknown code',
  args: { teamCode: 'XYZ', size: 'md' },
};
