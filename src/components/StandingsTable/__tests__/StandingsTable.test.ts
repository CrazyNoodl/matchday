// expo-image needs expo-modules-core's native EventEmitter, which isn't set
// up under this project's @react-native/jest-preset — stand in with plain
// react-native Image, imported transitively via StandingsTable -> Avatar.
jest.mock('expo-image', () => ({
  Image: require('react-native').Image,
}));

import { getStandingsTableColumns } from '../StandingsTable';

const t = (key: string) => key;

describe('getStandingsTableColumns', () => {
  it('includes gfPerGame/gaPerGame as the last two columns by default', () => {
    const keys = getStandingsTableColumns(t).map((c) => c.key);
    expect(keys.slice(-2)).toEqual(['gfPerGame', 'gaPerGame']);
  });

  it('omits gfPerGame/gaPerGame when showAvgGoals is false', () => {
    const keys = getStandingsTableColumns(t, false).map((c) => c.key);
    expect(keys).not.toContain('gfPerGame');
    expect(keys).not.toContain('gaPerGame');
    expect(keys).toEqual(['played', 'wins', 'draws', 'losses', 'gf', 'ga', 'gd', 'pts']);
  });

  it('includes gfPerGame/gaPerGame when showAvgGoals is true', () => {
    const keys = getStandingsTableColumns(t, true).map((c) => c.key);
    expect(keys).toContain('gfPerGame');
    expect(keys).toContain('gaPerGame');
  });
});
