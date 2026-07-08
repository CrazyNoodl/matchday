import { useStore } from '../index';
import type { Match, Player } from '../types';
import { deleteStorageFolder } from '@/supabase/storage';

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

jest.mock('@/supabase/storage', () => {
  const actual = jest.requireActual('@/supabase/storage');
  return {
    ...actual,
    deleteStorageFolder: jest.fn().mockResolvedValue(undefined),
  };
});

const mockDeleteFolder = deleteStorageFolder as jest.Mock;

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
  mockDeleteFolder.mockClear();
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

describe('startRound — ranked-only ordinal numbering', () => {
  beforeEach(() => {
    useStore.getState().addPlayer(P1);
    useStore.getState().addPlayer(P2);
    useStore.getState().startTournament('Cup', ['p1', 'p2'], true);
  });

  it('numbers the first ranked round as 1', () => {
    useStore.getState().startRound(true, ['p1', 'p2']);
    expect(useStore.getState().round).toBe(1);
  });

  it('does not consume an ordinal for a friendly round', () => {
    useStore.getState().startRound(false, ['p1', 'p2']);
    useStore.getState().addMatch(makeMatch('m1'));
    useStore.getState().finishRound();

    useStore.getState().startRound(true, ['p1', 'p2']);
    expect(useStore.getState().round).toBe(1);
  });

  it('skips friendly rounds when numbering subsequent ranked rounds', () => {
    useStore.getState().startRound(true, ['p1', 'p2']);
    useStore.getState().addMatch(makeMatch('m1'));
    useStore.getState().finishRound();

    useStore.getState().startRound(false, ['p1', 'p2']);
    useStore.getState().addMatch(makeMatch('m2'));
    useStore.getState().finishRound();

    useStore.getState().startRound(true, ['p1', 'p2']);
    expect(useStore.getState().round).toBe(2);
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

// ---------------------------------------------------------------------------
// #67 — per-round/per-match storage folder lifecycle + prefix-based cleanup
// ---------------------------------------------------------------------------

describe('media storage folder lifecycle (#67)', () => {
  beforeEach(() => {
    useStore.getState().addPlayer(P1);
    useStore.getState().addPlayer(P2);
    useStore.getState().startTournament('Cup', ['p1', 'p2'], true);
  });

  it('startRound generates a human-readable roundFolder', () => {
    useStore.getState().startRound(true, ['p1', 'p2']);
    expect(useStore.getState().roundFolder).toMatch(/^matchday-\d{4}-\d{2}-\d{2}_\d{4}$/);
  });

  it('finishRound copies roundFolder onto the archived round and clears it', () => {
    useStore.getState().startRound(true, ['p1', 'p2']);
    const roundFolder = useStore.getState().roundFolder;
    useStore.getState().addMatch(makeMatch('m1'));
    useStore.getState().finishRound();

    expect(useStore.getState().archivedRounds[0].folder).toBe(roundFolder);
    expect(useStore.getState().roundFolder).toBe('');
  });

  it('deleteMatch removes only that match\'s folder', () => {
    useStore.getState().startRound(true, ['p1', 'p2']);
    const roundFolder = useStore.getState().roundFolder;
    const tournamentId = useStore.getState().tournamentId;
    useStore.getState().addMatch({ ...makeMatch('m1'), mediaFolder: 'match_2-0_stamp' });

    useStore.getState().deleteMatch('m1');

    expect(mockDeleteFolder).toHaveBeenCalledWith(`${tournamentId}/${roundFolder}/match_2-0_stamp`);
  });

  it('deleteMatch falls back to the matchId as the folder for matches predating the layout', () => {
    useStore.getState().startRound(true, ['p1', 'p2']);
    const tournamentId = useStore.getState().tournamentId;
    useStore.getState().addMatch(makeMatch('m1')); // no mediaFolder

    useStore.getState().deleteMatch('m1');

    expect(mockDeleteFolder).toHaveBeenCalledWith(`${tournamentId}/m1`);
  });

  it('deleteRound removes the whole round folder in a single sweep', () => {
    useStore.getState().startRound(true, ['p1', 'p2']);
    const roundFolder = useStore.getState().roundFolder;
    const tournamentId = useStore.getState().tournamentId;
    useStore.getState().addMatch({ ...makeMatch('m1'), mediaFolder: 'match_2-0_stamp' });
    useStore.getState().addMatch({ ...makeMatch('m2'), mediaFolder: 'match_1-1_stamp' });

    useStore.getState().deleteRound();

    expect(mockDeleteFolder).toHaveBeenCalledWith(`${tournamentId}/${roundFolder}`);
    expect(mockDeleteFolder).toHaveBeenCalledTimes(1);
    expect(useStore.getState().roundFolder).toBe('');
  });

  it('deleteRound also cleans up legacy matches without a mediaFolder individually', () => {
    useStore.getState().startRound(true, ['p1', 'p2']);
    const tournamentId = useStore.getState().tournamentId;
    useStore.getState().addMatch(makeMatch('m1')); // no mediaFolder

    useStore.getState().deleteRound();

    expect(mockDeleteFolder).toHaveBeenCalledWith(`${tournamentId}/m1`);
  });

  it('deleteArchivedRound removes the round folder using the round\'s stored folder', () => {
    useStore.getState().startRound(true, ['p1', 'p2']);
    useStore.getState().addMatch({ ...makeMatch('m1'), mediaFolder: 'match_2-0_stamp' });
    useStore.getState().finishRound();
    const roundId = useStore.getState().archivedRounds[0].id;
    const roundFolder = useStore.getState().archivedRounds[0].folder;
    const tournamentId = useStore.getState().tournamentId;
    mockDeleteFolder.mockClear();

    useStore.getState().deleteArchivedRound(roundId);

    expect(mockDeleteFolder).toHaveBeenCalledWith(`${tournamentId}/${roundFolder}`);
  });

  it('deleteClosedTournament removes the whole tournament folder in one sweep', () => {
    useStore.getState().startRound(true, ['p1', 'p2']);
    useStore.getState().addMatch({ ...makeMatch('m1', 'p1', 'p2', 3, 0), mediaFolder: 'match_3-0_stamp' });
    useStore.getState().finishRound();
    useStore.getState().closeTournament();
    const tourId = useStore.getState().closedTournaments[0].id;
    mockDeleteFolder.mockClear();

    useStore.getState().deleteClosedTournament(tourId);

    expect(mockDeleteFolder).toHaveBeenCalledWith(tourId);
    expect(mockDeleteFolder).toHaveBeenCalledTimes(1);
  });
});

describe('resetStore — device-level display preferences', () => {
  it('preserves colorScheme, language, showNick, showTeamLogo and groupByTours across a sign-out reset', async () => {
    useStore.setState({
      colorScheme: 'light',
      language: 'uk',
      showNick: false,
      showTeamLogo: false,
      groupByTours: false,
    });

    await useStore.getState().resetStore();

    expect(useStore.getState().colorScheme).toBe('light');
    expect(useStore.getState().language).toBe('uk');
    expect(useStore.getState().showNick).toBe(false);
    expect(useStore.getState().showTeamLogo).toBe(false);
    expect(useStore.getState().groupByTours).toBe(false);
  });

  it('still clears account-scoped data like players and tournaments', async () => {
    useStore.getState().addPlayer(P1);
    useStore.getState().addPlayer(P2);
    useStore.getState().startTournament('Test', ['p1', 'p2'], true);

    await useStore.getState().resetStore();

    expect(useStore.getState().players).toEqual([]);
    expect(useStore.getState().hasTournament).toBe(false);
  });
});
