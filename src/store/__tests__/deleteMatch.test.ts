import { useStore } from '../index';
import type { Match } from '../types';

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

const makeMatch = (id: string): Match => ({
  id,
  aId: 'p1',
  bId: 'p2',
  aScore: 2,
  bScore: 1,
  aTeam: 'JUV',
  bTeam: 'BAR',
});

beforeEach(() => {
  useStore.setState({
    matches: [makeMatch('m1'), makeMatch('m2'), makeMatch('m3')],
    archivedRounds: [
      {
        id: 'r1',
        n: 1,
        date: '',
        winner: '',
        games: 1,
        name: 'Round 1',
        ranked: true,
        matches: [makeMatch('archived-m1')],
      },
    ],
  });
});

describe('deleteMatch', () => {
  it('removes the target match from matches', () => {
    useStore.getState().deleteMatch('m2');
    const { matches } = useStore.getState();
    expect(matches).toHaveLength(2);
    expect(matches.find((m) => m.id === 'm2')).toBeUndefined();
  });

  it('keeps all other matches intact', () => {
    useStore.getState().deleteMatch('m1');
    const { matches } = useStore.getState();
    expect(matches.map((m) => m.id)).toEqual(['m2', 'm3']);
  });

  it('is a no-op for an unknown id', () => {
    useStore.getState().deleteMatch('does-not-exist');
    expect(useStore.getState().matches).toHaveLength(3);
  });

  it('does NOT touch archivedRounds', () => {
    useStore.getState().deleteMatch('m1');
    const { archivedRounds } = useStore.getState();
    expect(archivedRounds[0].matches).toHaveLength(1);
    expect(archivedRounds[0].matches[0].id).toBe('archived-m1');
  });

  it('does NOT delete a match that only exists in archivedRounds', () => {
    useStore.getState().deleteMatch('archived-m1');
    const { archivedRounds, matches } = useStore.getState();
    // matches unchanged
    expect(matches).toHaveLength(3);
    // archived match still there
    expect(archivedRounds[0].matches[0].id).toBe('archived-m1');
  });
});
