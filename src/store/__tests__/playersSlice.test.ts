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
import type { Match, Player } from '../types';

const P1: Player = { id: 'p1', name: 'Alice', color: '#f00', teamCode: 'JUV' };
const P2: Player = { id: 'p2', name: 'Bob', color: '#00f', teamCode: 'BAR' };

const matchWithP1: Match = {
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

describe('addPlayer', () => {
  it('appends player to the store', () => {
    useStore.getState().addPlayer(P1);
    expect(useStore.getState().players).toContainEqual(P1);
  });

  it('appends without replacing existing players', () => {
    useStore.getState().addPlayer(P1);
    useStore.getState().addPlayer(P2);
    expect(useStore.getState().players).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------

describe('updatePlayer', () => {
  it('updates the matching player', () => {
    useStore.getState().addPlayer(P1);
    useStore.getState().updatePlayer({ ...P1, name: 'Alice Updated' });
    expect(useStore.getState().players[0].name).toBe('Alice Updated');
  });

  it('does not affect other players', () => {
    useStore.getState().addPlayer(P1);
    useStore.getState().addPlayer(P2);
    useStore.getState().updatePlayer({ ...P1, name: 'Changed' });
    expect(useStore.getState().players.find((p) => p.id === 'p2')?.name).toBe('Bob');
  });

  it('preserves all other fields when updating one field', () => {
    useStore.getState().addPlayer(P1);
    useStore.getState().updatePlayer({ ...P1, nick: 'ali' });
    const updated = useStore.getState().players[0];
    expect(updated.id).toBe(P1.id);
    expect(updated.color).toBe(P1.color);
    expect(updated.teamCode).toBe(P1.teamCode);
    expect(updated.nick).toBe('ali');
  });
});

// ---------------------------------------------------------------------------

describe('deletePlayer', () => {
  it('removes a player not referenced in any match', () => {
    useStore.getState().addPlayer(P1);
    useStore.getState().deletePlayer('p1');
    expect(useStore.getState().players).toHaveLength(0);
  });

  it('is a no-op when player appears as side A in current matches', () => {
    useStore.getState().addPlayer(P1);
    useStore.setState({ matches: [matchWithP1] });
    useStore.getState().deletePlayer('p1');
    expect(useStore.getState().players).toContainEqual(P1);
  });

  it('is a no-op when player appears as side B in current matches', () => {
    useStore.getState().addPlayer(P2);
    useStore.setState({ matches: [matchWithP1] });
    useStore.getState().deletePlayer('p2');
    expect(useStore.getState().players).toContainEqual(P2);
  });

  it('is a no-op when player appears in archived rounds', () => {
    useStore.getState().addPlayer(P1);
    useStore.setState({
      archivedRounds: [
        {
          id: 'r1',
          n: 1,
          date: '',
          winner: '',
          games: 1,
          ranked: true,
          matches: [matchWithP1],
          name: 'Round 1',
        },
      ],
    });
    useStore.getState().deletePlayer('p1');
    expect(useStore.getState().players).toContainEqual(P1);
  });

  it('is a no-op when player appears in closed tournaments', () => {
    useStore.getState().addPlayer(P1);
    useStore.setState({
      closedTournaments: [
        {
          id: 't1',
          name: 'Tour',
          date: '',
          rounds: [],
          champId: 'p1',
          champName: 'Alice',
          champColor: '#f00',
          champInit: 'AL',
          players: ['p1'],
        },
      ],
    });
    useStore.getState().deletePlayer('p1');
    expect(useStore.getState().players).toContainEqual(P1);
  });

  it('is a no-op for an unknown id', () => {
    useStore.getState().addPlayer(P1);
    useStore.getState().deletePlayer('does-not-exist');
    expect(useStore.getState().players).toHaveLength(1);
  });

  it('does not remove other players when deleting one', () => {
    useStore.getState().addPlayer(P1);
    useStore.getState().addPlayer(P2);
    useStore.getState().deletePlayer('p1');
    expect(useStore.getState().players).toContainEqual(P2);
    expect(useStore.getState().players).not.toContainEqual(P1);
  });
});
