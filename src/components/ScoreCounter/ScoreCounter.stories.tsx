import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj, Decorator } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { ScoreCounter } from './ScoreCounter';
import { useStore } from '../../store';
import { Colors } from '../../theme/colors';

const MOCK_TEAMS = [{ code: 'MCI', name: 'Manchester City', short: 'MCI', color: Colors.team[0] }];

const MOCK_PLAYERS = [
  { id: 'p1', name: 'Artem Rudenko', nick: 'Atom', teamCode: 'MCI' },
];

const withMockData: Decorator = (Story) => {
  useEffect(() => {
    useStore.setState({ teams: MOCK_TEAMS, players: MOCK_PLAYERS, showNick: true });
  }, []);
  return <Story />;
};

function LiveScoreCounter({ initial = 0 }: { initial?: number }) {
  const [score, setScore] = useState(initial);
  return (
    <ScoreCounter
      playerId="p1"
      teamCode="MCI"
      score={score}
      onIncrement={() => setScore((s) => s + 1)}
      onDecrement={() => setScore((s) => Math.max(0, s - 1))}
    />
  );
}

const meta = {
  title: 'Elements/ScoreCounter',
  component: ScoreCounter,
  decorators: [withMockData],
  argTypes: {
    score: { control: { type: 'number' } },
    onIncrement: { action: 'onIncrement' },
    onDecrement: { action: 'onDecrement' },
  },
  args: { playerId: 'p1', teamCode: 'MCI', score: 0, onIncrement: () => {}, onDecrement: () => {} },
} satisfies Meta<typeof ScoreCounter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ZeroScore: Story = { args: { score: 0 } };
export const WithScore: Story = { args: { score: 3 } };

export const Live: Story = {
  name: 'Live – tap +/- to update',
  render: () => <LiveScoreCounter initial={0} />,
};

export const SideBySide: Story = {
  name: 'Showcase – Side by side',
  render: () => (
    <View style={{ flexDirection: 'row' }}>
      <LiveScoreCounter initial={2} />
      <LiveScoreCounter initial={1} />
    </View>
  ),
};
