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

const makeMatch = (id: string, aId = 'p1', bId = 'p2', aScore = 2, bScore = 0): Match => ({
  id,
  aId,
  bId,
  aTeam: 'JUV',
  bTeam: 'BAR',
  aScore,
  bScore,
});

beforeEach(() => {
  useStore.getState().resetStore();
});

// ---------------------------------------------------------------------------

describe('startTournament', () => {
  it('sets hasTournament and tournament metadata', () => {
    useStore.getState().startTournament('Summer Cup', ['p1', 'p2'], true, 5);
    const s = useStore.getState();
    expect(s.hasTournament).toBe(true);
    expect(s.tournamentName).toBe('Summer Cup');
    expect(s.tournamentRanked).toBe(true);
    expect(s.tournamentRounds).toBe(5);
    expect(s.tournamentPlayers).toEqual(['p1', 'p2']);
  });

  it('sets round to 1 and roundOpen to false', () => {
    useStore.getState().startTournament('Cup', [], false);
    const s = useStore.getState();
    expect(s.round).toBe(1);
    expect(s.roundOpen).toBe(false);
  });

  it('clears existing matches and archived rounds', () => {
    useStore.setState({ matches: [makeMatch('m0')], archivedRounds: [{ id: 'r0', n: 1, date: '', winner: '', games: 1, ranked: true, matches: [], name: 'R1' }] });
    useStore.getState().startTournament('New Cup', [], true);
    const s = useStore.getState();
    expect(s.matches).toHaveLength(0);
    expect(s.archivedRounds).toHaveLength(0);
  });

  it('generates a non-empty tournamentId', () => {
    useStore.getState().startTournament('Cup', [], true);
    expect(useStore.getState().tournamentId).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------

describe('addMatch', () => {
  it('appends match to matches', () => {
    useStore.getState().addMatch(makeMatch('m1'));
    expect(useStore.getState().matches).toHaveLength(1);
    expect(useStore.getState().matches[0].id).toBe('m1');
  });

  it('appends multiple matches in order', () => {
    useStore.getState().addMatch(makeMatch('m1'));
    useStore.getState().addMatch(makeMatch('m2'));
    expect(useStore.getState().matches.map((m) => m.id)).toEqual(['m1', 'm2']);
  });
});

// ---------------------------------------------------------------------------

describe('finishRound', () => {
  beforeEach(() => {
    useStore.getState().addPlayer(P1);
    useStore.getState().addPlayer(P2);
    useStore.getState().startTournament('Cup', ['p1', 'p2'], true);
    useStore.getState().startRound(true, ['p1', 'p2']);
    useStore.getState().addMatch(makeMatch('m1'));
    useStore.getState().addMatch(makeMatch('m2'));
  });

  it('moves matches into archivedRounds', () => {
    useStore.getState().finishRound();
    const s = useStore.getState();
    expect(s.archivedRounds).toHaveLength(1);
    expect(s.archivedRounds[0].matches).toHaveLength(2);
  });

  it('clears matches and closes the round', () => {
    useStore.getState().finishRound();
    const s = useStore.getState();
    expect(s.matches).toHaveLength(0);
    expect(s.roundOpen).toBe(false);
  });

  it('sets correct games count on archived round', () => {
    useStore.getState().finishRound();
    expect(useStore.getState().archivedRounds[0].games).toBe(2);
  });

  it('sets winner to player with most points (p1 won both matches)', () => {
    useStore.getState().finishRound();
    expect(useStore.getState().archivedRounds[0].winner).toBe('p1');
  });

  it('sets winner to empty string when round is a draw', () => {
    useStore.getState().resetStore();
    useStore.getState().addPlayer(P1);
    useStore.getState().addPlayer(P2);
    useStore.getState().startTournament('Cup', ['p1', 'p2'], true);
    useStore.getState().startRound(true, ['p1', 'p2']);
    // p1 wins one, p2 wins one → draw
    useStore.getState().addMatch(makeMatch('m1', 'p1', 'p2', 2, 0));
    useStore.getState().addMatch(makeMatch('m2', 'p2', 'p1', 2, 0));
    useStore.getState().finishRound();
    expect(useStore.getState().archivedRounds[0].winner).toBe('');
  });
});

// ---------------------------------------------------------------------------

describe('closeTournament', () => {
  beforeEach(() => {
    useStore.getState().addPlayer(P1);
    useStore.getState().addPlayer(P2);
    useStore.getState().startTournament('World Cup', ['p1', 'p2'], true);
    useStore.getState().startRound(true, ['p1', 'p2']);
    // p1 wins the round
    useStore.getState().addMatch(makeMatch('m1', 'p1', 'p2', 3, 0));
    useStore.getState().finishRound();
  });

  it('moves tournament into closedTournaments', () => {
    useStore.getState().closeTournament();
    expect(useStore.getState().closedTournaments).toHaveLength(1);
  });

  it('clears active tournament state', () => {
    useStore.getState().closeTournament();
    const s = useStore.getState();
    expect(s.hasTournament).toBe(false);
    expect(s.tournamentName).toBe('');
    expect(s.matches).toHaveLength(0);
    expect(s.archivedRounds).toHaveLength(0);
  });

  it('records correct champion (p1 won all matches)', () => {
    useStore.getState().closeTournament();
    const closed = useStore.getState().closedTournaments[0];
    expect(closed.champId).toBe('p1');
    expect(closed.champName).toBe('Alice');
  });

  it('preserves all archived rounds in the closed tournament', () => {
    useStore.getState().closeTournament();
    const closed = useStore.getState().closedTournaments[0];
    expect(closed.rounds).toHaveLength(1);
    expect(closed.rounds[0].matches).toHaveLength(1);
  });

  it('preserves tournament player list', () => {
    useStore.getState().closeTournament();
    const closed = useStore.getState().closedTournaments[0];
    expect(closed.players).toContain('p1');
    expect(closed.players).toContain('p2');
  });
});

// ---------------------------------------------------------------------------

describe('renameTournament', () => {
  it('updates the tournament name', () => {
    useStore.getState().startTournament('Old Name', [], true);
    useStore.getState().renameTournament('New Name');
    expect(useStore.getState().tournamentName).toBe('New Name');
  });
});

// ---------------------------------------------------------------------------

describe('swapMatchSides', () => {
  it('swaps aId/bId, aTeam/bTeam and aScore/bScore', () => {
    const match = makeMatch('m1', 'p1', 'p2', 3, 1);
    useStore.setState({ matches: [match] });
    useStore.getState().swapMatchSides('m1');
    const swapped = useStore.getState().matches[0];
    expect(swapped.aId).toBe('p2');
    expect(swapped.bId).toBe('p1');
    expect(swapped.aScore).toBe(1);
    expect(swapped.bScore).toBe(3);
    expect(swapped.aTeam).toBe('BAR');
    expect(swapped.bTeam).toBe('JUV');
  });

  it('is a no-op for unknown match id', () => {
    const match = makeMatch('m1');
    useStore.setState({ matches: [match] });
    useStore.getState().swapMatchSides('unknown');
    expect(useStore.getState().matches[0]).toEqual(match);
  });
});
