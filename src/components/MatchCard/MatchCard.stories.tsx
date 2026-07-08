import React, { useEffect } from 'react';
import type { Meta, StoryObj, Decorator } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { MatchCard } from './MatchCard';
import { useStore } from '../../store';
import { Colors } from '../../theme/colors';
import type { Match } from '../../store/types';

const MOCK_TEAMS = [
  { code: 'MCI', name: 'Manchester City', short: 'MCI', color: Colors.team[0] },
  { code: 'BAR', name: 'FC Barcelona', short: 'BAR', color: Colors.team[1] },
];

const MOCK_PLAYERS = [
  { id: 'p1', name: 'Artem Rudenko', color: Colors.player[0], teamCode: 'MCI' },
  { id: 'p2', name: 'Oleh Bondar', color: Colors.player[1], teamCode: 'BAR' },
];

const withMockData: Decorator = (Story) => {
  useEffect(() => {
    useStore.setState({ teams: MOCK_TEAMS, players: MOCK_PLAYERS });
  }, []);
  return <Story />;
};

const baseMatch: Match = {
  id: 'm1',
  aId: 'p1',
  bId: 'p2',
  aTeam: 'MCI',
  bTeam: 'BAR',
  aScore: 3,
  bScore: 1,
};

const meta = {
  title: 'Cards/MatchCard',
  component: MatchCard,
  decorators: [withMockData],
  argTypes: {
    readonly: { control: { type: 'boolean' } },
    onPress: { action: 'onPress' },
  },
  args: { match: baseMatch },
} satisfies Meta<typeof MatchCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AWins: Story = {
  name: 'A wins',
  args: { match: { ...baseMatch, aScore: 3, bScore: 1 } },
};

export const BWins: Story = {
  name: 'B wins',
  args: { match: { ...baseMatch, aScore: 1, bScore: 3 } },
};

export const Draw: Story = {
  args: { match: { ...baseMatch, aScore: 2, bScore: 2 } },
};

export const WithMediaAndNote: Story = {
  name: 'With media + comment',
  args: {
    match: {
      ...baseMatch,
      media: [{ uri: 'https://placehold.co/200x200', type: 'image' }],
      note: 'Great comeback in the second half!',
    },
  },
};

export const ReadonlyTappable: Story = {
  name: 'Tappable (not readonly)',
  args: { onPress: () => {} },
};

export const Showcase: Story = {
  name: 'Showcase – Results',
  render: () => (
    <View style={{ gap: 4 }}>
      <MatchCard match={{ ...baseMatch, aScore: 3, bScore: 1 }} />
      <MatchCard match={{ ...baseMatch, aScore: 1, bScore: 3 }} />
      <MatchCard match={{ ...baseMatch, aScore: 2, bScore: 2 }} />
    </View>
  ),
};
