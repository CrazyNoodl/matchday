jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: () => null,
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

import { useStore } from '../index';
import type { Match, Team } from '../types';

const T1: Team = { code: 'JUV', name: 'Juventus', short: 'JUV', color: '#000' };
const T2: Team = { code: 'BAR', name: 'Barcelona', short: 'BAR', color: '#00f' };

const matchWithT1: Match = {
  id: 'm1',
  aId: 'p1',
  bId: 'p2',
  aTeam: 'JUV',
  bTeam: 'BAR',
  aScore: 1,
  bScore: 0,
};

beforeEach(() => {
  useStore.getState().resetStore();
});

// ---------------------------------------------------------------------------

describe('addTeam', () => {
  it('appends team to the store', () => {
    useStore.getState().addTeam(T1);
    expect(useStore.getState().teams).toContainEqual(T1);
  });

  it('appends without replacing existing teams', () => {
    useStore.getState().addTeam(T1);
    useStore.getState().addTeam(T2);
    expect(useStore.getState().teams).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------

describe('updateTeam', () => {
  it('updates the matching team', () => {
    useStore.getState().addTeam(T1);
    useStore.getState().updateTeam({ ...T1, name: 'Juventus FC' });
    expect(useStore.getState().teams[0].name).toBe('Juventus FC');
  });

  it('does not affect other teams', () => {
    useStore.getState().addTeam(T1);
    useStore.getState().addTeam(T2);
    useStore.getState().updateTeam({ ...T1, name: 'Changed' });
    expect(useStore.getState().teams.find((t) => t.code === 'BAR')?.name).toBe('Barcelona');
  });

  it('preserves all other fields when updating one field', () => {
    useStore.getState().addTeam(T1);
    useStore.getState().updateTeam({ ...T1, color: '#fff' });
    const updated = useStore.getState().teams[0];
    expect(updated.code).toBe(T1.code);
    expect(updated.name).toBe(T1.name);
    expect(updated.color).toBe('#fff');
  });
});

// ---------------------------------------------------------------------------

describe('deleteTeam', () => {
  it('removes a team not referenced in any match', () => {
    useStore.getState().addTeam(T1);
    useStore.getState().deleteTeam('JUV');
    expect(useStore.getState().teams).toHaveLength(0);
  });

  it('is a no-op when team appears as side A in current matches', () => {
    useStore.getState().addTeam(T1);
    useStore.setState({ matches: [matchWithT1] });
    useStore.getState().deleteTeam('JUV');
    expect(useStore.getState().teams).toContainEqual(T1);
  });

  it('is a no-op when team appears as side B in current matches', () => {
    useStore.getState().addTeam(T2);
    useStore.setState({ matches: [matchWithT1] });
    useStore.getState().deleteTeam('BAR');
    expect(useStore.getState().teams).toContainEqual(T2);
  });

  it('is a no-op when team appears in archived rounds', () => {
    useStore.getState().addTeam(T1);
    useStore.setState({
      archivedRounds: [
        {
          id: 'r1',
          n: 1,
          date: '',
          winner: '',
          games: 1,
          ranked: true,
          matches: [matchWithT1],
          name: 'Round 1',
        },
      ],
    });
    useStore.getState().deleteTeam('JUV');
    expect(useStore.getState().teams).toContainEqual(T1);
  });

  it('is a no-op when team appears in closed tournaments', () => {
    useStore.getState().addTeam(T1);
    useStore.setState({
      closedTournaments: [
        {
          id: 't1',
          name: 'Tour',
          date: '',
          rounds: [
            {
              id: 'r1',
              n: 1,
              date: '',
              winner: '',
              games: 1,
              ranked: true,
              matches: [matchWithT1],
              name: 'Round 1',
            },
          ],
          champId: 'p1',
          champName: 'Alice',
          champColor: '#f00',
          champInit: 'AL',
          players: ['p1', 'p2'],
        },
      ],
    });
    useStore.getState().deleteTeam('JUV');
    expect(useStore.getState().teams).toContainEqual(T1);
  });

  it('is a no-op for an unknown code', () => {
    useStore.getState().addTeam(T1);
    useStore.getState().deleteTeam('UNKNOWN');
    expect(useStore.getState().teams).toHaveLength(1);
  });

  it('does not remove other teams when deleting one', () => {
    useStore.getState().addTeam(T1);
    useStore.getState().addTeam(T2);
    useStore.getState().deleteTeam('JUV');
    expect(useStore.getState().teams).toContainEqual(T2);
    expect(useStore.getState().teams).not.toContainEqual(T1);
  });
});
