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

const P1: Player = { id: 'p1', name: 'Alice', teamCode: 'JUV' };
const P2: Player = { id: 'p2', name: 'Bob', teamCode: 'BAR' };

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
    useStore.setState({
      matches: [makeMatch('m0')],
      archivedRounds: [
        { id: 'r0', n: 1, date: '', winner: '', games: 1, ranked: true, matches: [], name: 'R1' },
      ],
    });
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

describe('closeTournament — folds an in-progress round instead of discarding it (#88)', () => {
  beforeEach(() => {
    useStore.getState().addPlayer(P1);
    useStore.getState().addPlayer(P2);
    useStore.getState().startTournament('World Cup', ['p1', 'p2'], true);
    useStore.getState().startRound(true, ['p1', 'p2']);
    // Round is still open — matches recorded but finishRound() never called.
    useStore.getState().addMatch(makeMatch('m1', 'p1', 'p2', 3, 0));
  });

  it('archives the in-progress round instead of discarding its matches', () => {
    useStore.getState().closeTournament();
    const closed = useStore.getState().closedTournaments[0];
    expect(closed.rounds).toHaveLength(1);
    expect(closed.rounds[0].matches).toHaveLength(1);
    expect(closed.rounds[0].matches[0].id).toBe('m1');
  });

  it('factors the in-progress round into the champion calculation', () => {
    useStore.getState().closeTournament();
    const closed = useStore.getState().closedTournaments[0];
    expect(closed.champId).toBe('p1');
  });

  it('clears roundOpen and matches after closing', () => {
    useStore.getState().closeTournament();
    const s = useStore.getState();
    expect(s.roundOpen).toBe(false);
    expect(s.matches).toHaveLength(0);
  });

  it('keeps a previously finished round alongside the folded in-progress one', () => {
    useStore.getState().finishRound();
    useStore.getState().startRound(true, ['p1', 'p2']);
    useStore.getState().addMatch(makeMatch('m2', 'p2', 'p1', 1, 0));
    useStore.getState().closeTournament();
    const closed = useStore.getState().closedTournaments[0];
    expect(closed.rounds).toHaveLength(2);
  });

  it('does not create an empty round when roundOpen is true but no matches were recorded', () => {
    useStore.getState().resetStore();
    useStore.getState().addPlayer(P1);
    useStore.getState().addPlayer(P2);
    useStore.getState().startTournament('Empty Cup', ['p1', 'p2'], true);
    useStore.getState().startRound(true, ['p1', 'p2']);
    useStore.getState().closeTournament();
    const closed = useStore.getState().closedTournaments[0];
    expect(closed.rounds).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------

describe('deleteTournament — discard an open tournament with zero finished rounds (#86)', () => {
  beforeEach(() => {
    useStore.getState().addPlayer(P1);
    useStore.getState().addPlayer(P2);
    useStore.getState().startTournament('Empty Cup', ['p1', 'p2'], true);
  });

  it('clears active tournament state without creating a closed tournament entry', () => {
    useStore.getState().startRound(true, ['p1', 'p2']);
    useStore.getState().addMatch(makeMatch('m1'));

    useStore.getState().deleteTournament();

    const s = useStore.getState();
    expect(s.hasTournament).toBe(false);
    expect(s.tournamentName).toBe('');
    expect(s.tournamentId).toBe('');
    expect(s.matches).toHaveLength(0);
    expect(s.archivedRounds).toHaveLength(0);
    expect(s.closedTournaments).toHaveLength(0);
  });

  it('removes the whole tournament folder in one sweep', () => {
    const tournamentId = useStore.getState().tournamentId;
    mockDeleteFolder.mockClear();

    useStore.getState().deleteTournament();

    expect(mockDeleteFolder).toHaveBeenCalledWith(tournamentId);
    expect(mockDeleteFolder).toHaveBeenCalledTimes(1);
  });

  it('does not affect other closed tournaments already in the archive', () => {
    useStore.getState().startRound(true, ['p1', 'p2']);
    useStore.getState().addMatch(makeMatch('m1', 'p1', 'p2', 3, 0));
    useStore.getState().finishRound();
    useStore.getState().closeTournament();
    expect(useStore.getState().closedTournaments).toHaveLength(1);

    useStore.getState().startTournament('Second Empty Cup', ['p1', 'p2'], true);
    useStore.getState().deleteTournament();

    expect(useStore.getState().closedTournaments).toHaveLength(1);
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

describe('reorderMatches', () => {
  it('reorders the current round matches array to the given order', () => {
    useStore.setState({
      matches: [makeMatch('m1'), makeMatch('m2'), makeMatch('m3')],
    });
    useStore.getState().reorderMatches(['m3', 'm1', 'm2']);
    expect(useStore.getState().matches.map((m) => m.id)).toEqual(['m3', 'm1', 'm2']);
  });

  it('reorders a contiguous slice within a specific archived round without touching others', () => {
    useStore.setState({
      archivedRounds: [
        {
          id: 'r1',
          n: 1,
          date: '',
          winner: '',
          games: 3,
          ranked: true,
          matches: [makeMatch('m1'), makeMatch('m2'), makeMatch('m3')],
          name: 'R1',
        },
        {
          id: 'r2',
          n: 2,
          date: '',
          winner: '',
          games: 1,
          ranked: true,
          matches: [makeMatch('m4')],
          name: 'R2',
        },
      ],
    });
    useStore.getState().reorderMatches(['m2', 'm3', 'm1']);
    const s = useStore.getState();
    expect(s.archivedRounds[0].matches.map((m) => m.id)).toEqual(['m2', 'm3', 'm1']);
    expect(s.archivedRounds[1].matches.map((m) => m.id)).toEqual(['m4']);
  });

  it('reorders only the matching tour block, leaving other tours in the same array untouched', () => {
    useStore.setState({
      matches: [makeMatch('m1'), makeMatch('m2'), makeMatch('m3'), makeMatch('m4')],
    });
    useStore.getState().reorderMatches(['m4', 'm3']);
    expect(useStore.getState().matches.map((m) => m.id)).toEqual(['m1', 'm2', 'm4', 'm3']);
  });

  it('is a no-op when the ids do not form a contiguous slice anywhere', () => {
    const matches = [makeMatch('m1'), makeMatch('m2'), makeMatch('m3')];
    useStore.setState({ matches });
    useStore.getState().reorderMatches(['m1', 'm3']);
    expect(useStore.getState().matches).toEqual(matches);
  });

  it('is a no-op when an id is unknown', () => {
    const matches = [makeMatch('m1'), makeMatch('m2')];
    useStore.setState({ matches });
    useStore.getState().reorderMatches(['m1', 'unknown']);
    expect(useStore.getState().matches).toEqual(matches);
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

  it("deleteMatch removes only that match's folder", () => {
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

  it("deleteArchivedRound removes the round folder using the round's stored folder", () => {
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
    useStore
      .getState()
      .addMatch({ ...makeMatch('m1', 'p1', 'p2', 3, 0), mediaFolder: 'match_3-0_stamp' });
    useStore.getState().finishRound();
    useStore.getState().closeTournament();
    const tourId = useStore.getState().closedTournaments[0].id;
    mockDeleteFolder.mockClear();

    useStore.getState().deleteClosedTournament(tourId);

    expect(mockDeleteFolder).toHaveBeenCalledWith(tourId);
    expect(mockDeleteFolder).toHaveBeenCalledTimes(1);
  });
});

describe('resetStore — account-scoped display preferences (#81)', () => {
  it('resets colorScheme, language, showNick, showTeamLogo and groupByTours to defaults across a sign-out reset', async () => {
    // These are now account-scoped and synced (#81), not device-local — a
    // sign-out must reset them so the next account signed in on this device
    // doesn't briefly inherit account A's language/theme/etc. before the
    // next pull completes.
    useStore.setState({
      colorScheme: 'light',
      language: 'uk',
      showNick: false,
      showTeamLogo: false,
      groupByTours: false,
    });

    await useStore.getState().resetStore();

    expect(useStore.getState().colorScheme).toBe('dark');
    expect(useStore.getState().language).toBe('en');
    expect(useStore.getState().showNick).toBe(true);
    expect(useStore.getState().showTeamLogo).toBe(true);
    expect(useStore.getState().groupByTours).toBe(true);
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
