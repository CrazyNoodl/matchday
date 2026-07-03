import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj, Decorator } from '@storybook/react';
import { TeamPickerRow } from './TeamPickerRow';
import { useStore } from '../../store';
import { Colors } from '../../theme/colors';
import type { Team } from '../../store/types';

const MOCK_TEAMS: Team[] = [
  { code: 'MCI', name: 'Manchester City', short: 'MCI', color: Colors.team[0] },
  { code: 'BAR', name: 'FC Barcelona', short: 'BAR', color: Colors.team[1] },
  { code: 'RMA', name: 'Real Madrid', short: 'RMA', color: Colors.team[2] },
  { code: 'LIV', name: 'Liverpool', short: 'LIV', color: Colors.team[3] },
  { code: 'PSG', name: 'PSG', short: 'PSG', color: Colors.team[4] },
];

const withMockTeams: Decorator = (Story) => {
  useEffect(() => {
    useStore.setState({ teams: MOCK_TEAMS });
  }, []);
  return <Story />;
};

function LiveTeamPickerRow() {
  const [selected, setSelected] = useState('MCI');
  return <TeamPickerRow teams={MOCK_TEAMS} selectedCode={selected} onSelect={setSelected} />;
}

const meta = {
  title: 'Cards/TeamPickerRow',
  component: TeamPickerRow,
  decorators: [withMockTeams],
  argTypes: {
    onSelect: { action: 'onSelect' },
  },
  args: { teams: MOCK_TEAMS, selectedCode: 'MCI', onSelect: () => {} },
} satisfies Meta<typeof TeamPickerRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { selectedCode: 'MCI' } };

export const NoneSelected: Story = {
  name: 'Nothing selected',
  args: { selectedCode: '' },
};

export const Live: Story = {
  name: 'Live – tap to select',
  render: () => <LiveTeamPickerRow />,
};
