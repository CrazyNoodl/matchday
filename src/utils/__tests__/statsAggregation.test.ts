import {
  collectAllMatches,
  collectPlayerIds,
  sumGoals,
  countMatchDaysPlayed,
  buildH2HPairs,
} from '../statsAggregation';
import { type ArchivedRound, type ClosedTournament, type Match, type Player } from '../../store/types';

const match = (id: string, aId: string, bId: string, aScore: number, bScore: number): Match => ({
  id,
  aId,
  bId,
  aScore,
  bScore,
  aTeam: 'A',
  bTeam: 'B',
});

const round = (id: string, matches: Match[], ranked = true): ArchivedRound => ({
  id,
  n: 1,
  date: '2026-01-01',
  winner: '',
  games: matches.length,
  ranked,
  matches,
  name: 'Round',
});

const closedTournament = (
  id: string,
  players: string[],
  rounds: ArchivedRound[],
  champId = players[0] ?? '',
): ClosedTournament => ({
  id,
  name: 'Tournament',
  date: '2026-01-01',
  rounds,
  champId,
  champName: 'Champ',
  champColor: '#000',
  champInit: 'C',
  players,
});

const player = (id: string, name = id): Player => ({
  id,
  name,
  color: '#f00',
  teamCode: 'JUV',
});

// ---------------------------------------------------------------------------

describe('collectAllMatches', () => {
  it('returns an empty array when all three layers are empty', () => {
    expect(collectAllMatches([], [], [])).toEqual([]);
  });

  it('merges closed tournaments, archived rounds, and current matches in that order', () => {
    const mClosed = match('m-closed', 'p1', 'p2', 1, 0);
    const mArchived = match('m-archived', 'p1', 'p2', 2, 0);
    const mCurrent = match('m-current', 'p1', 'p2', 3, 0);

    const closed = [closedTournament('t1', ['p1', 'p2'], [round('r1', [mClosed])])];
    const archived = [round('r2', [mArchived])];
    const current = [mCurrent];

    const result = collectAllMatches(closed, archived, current);
    expect(result.map((m) => m.id)).toEqual(['m-closed', 'm-archived', 'm-current']);
  });

  it('flattens multiple rounds per closed tournament and multiple closed tournaments', () => {
    const t1 = closedTournament(
      't1',
      ['p1', 'p2'],
      [round('r1', [match('m1', 'p1', 'p2', 1, 0)]), round('r2', [match('m2', 'p1', 'p2', 2, 0)])],
    );
    const t2 = closedTournament('t2', ['p1', 'p2'], [round('r3', [match('m3', 'p1', 'p2', 0, 1)])]);

    const result = collectAllMatches([t1, t2], [], []);
    expect(result.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
  });
});

describe('collectPlayerIds', () => {
  it('returns an empty array when there is no data at all', () => {
    expect(collectPlayerIds([], [], [])).toEqual([]);
  });

  it('unions the active tournament roster with closed-tournament rosters', () => {
    const closed = [closedTournament('t1', ['p2', 'p3'], [])];
    const ids = collectPlayerIds(['p1', 'p2'], closed, []);
    expect(new Set(ids)).toEqual(new Set(['p1', 'p2', 'p3']));
  });

  it('dedups a player who appears in both the active roster and a closed tournament', () => {
    const closed = [closedTournament('t1', ['p1'], [])];
    const ids = collectPlayerIds(['p1'], closed, []);
    expect(ids).toEqual(['p1']);
  });

  it('picks up a player who only appears in match data, missing from every roster array', () => {
    const allMatches = [match('m1', 'p1', 'ghost', 2, 1)];
    const ids = collectPlayerIds(['p1'], [], allMatches);
    expect(new Set(ids)).toEqual(new Set(['p1', 'ghost']));
  });

  it('combines roster ids, closed-tournament ids, and match-only ids with no duplicates', () => {
    const closed = [closedTournament('t1', ['p2'], [])];
    const allMatches = [match('m1', 'p2', 'p3', 1, 1), match('m2', 'p1', 'p3', 0, 0)];
    const ids = collectPlayerIds(['p1'], closed, allMatches);
    expect(new Set(ids)).toEqual(new Set(['p1', 'p2', 'p3']));
  });
});

describe('sumGoals', () => {
  it('returns 0 for no matches', () => {
    expect(sumGoals([])).toBe(0);
  });

  it('sums both sides across all matches', () => {
    const matches = [match('m1', 'p1', 'p2', 3, 1), match('m2', 'p1', 'p2', 0, 2)];
    expect(sumGoals(matches)).toBe(6);
  });
});

describe('countMatchDaysPlayed', () => {
  it('returns 0 when there are no archived rounds or closed tournaments', () => {
    expect(countMatchDaysPlayed([], [])).toBe(0);
  });

  it('counts archived rounds plus every round across all closed tournaments', () => {
    const archived = [round('r1', []), round('r2', [])];
    const closed = [
      closedTournament('t1', [], [round('r3', []), round('r4', [])]),
      closedTournament('t2', [], [round('r5', [])]),
    ];
    expect(countMatchDaysPlayed(archived, closed)).toBe(5);
  });

  it('does not count the in-progress round (current matches carry no round of their own)', () => {
    // countMatchDaysPlayed only takes archivedRounds/closedTournaments — the
    // current open round is represented purely by `matches` and has no round
    // object, so it can never be included here regardless of match count.
    expect(countMatchDaysPlayed([], [])).toBe(0);
  });
});

describe('buildH2HPairs', () => {
  const p1 = player('p1', 'Alice');
  const p2 = player('p2', 'Bob');
  const p3 = player('p3', 'Cara');

  it('returns an empty array when there are no matches between any pair', () => {
    expect(buildH2HPairs(['p1', 'p2'], [p1, p2], [])).toEqual([]);
  });

  it('aggregates wins/draws/goals for a direct A-vs-B pairing', () => {
    const matches = [
      match('m1', 'p1', 'p2', 2, 1), // p1 wins
      match('m2', 'p1', 'p2', 0, 0), // draw
    ];
    const pairs = buildH2HPairs(['p1', 'p2'], [p1, p2], matches);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({
      aWins: 1,
      bWins: 0,
      draws: 1,
      aGoals: 2,
      bGoals: 1,
      games: 2,
    });
    expect(pairs[0].playerA.id).toBe('p1');
    expect(pairs[0].playerB.id).toBe('p2');
  });

  it('flips perspective so stats always attribute to playerA/playerB regardless of match aId/bId order', () => {
    // playerIds order is p1 before p2, so playerA=p1, playerB=p2 in the pair —
    // but the match itself has p2 as aId (BA order relative to the pair).
    const matches = [match('m1', 'p2', 'p1', 3, 1)]; // p2 (match "a") beats p1 (match "b")
    const pairs = buildH2HPairs(['p1', 'p2'], [p1, p2], matches);
    expect(pairs).toHaveLength(1);
    // From playerA=p1's perspective: p1 lost 1-3, so bWins (p2) should be credited, not aWins.
    expect(pairs[0]).toMatchObject({ aWins: 0, bWins: 1, draws: 0, aGoals: 1, bGoals: 3 });
  });

  it('excludes a pair that never played each other, even if both played others', () => {
    const matches = [match('m1', 'p1', 'p3', 1, 0), match('m2', 'p2', 'p3', 1, 0)];
    const pairs = buildH2HPairs(['p1', 'p2'], [p1, p2], matches);
    expect(pairs).toEqual([]);
  });

  it('skips a candidate pair when either player is missing from the players list', () => {
    const matches = [match('m1', 'p1', 'ghost', 1, 0)];
    const pairs = buildH2HPairs(['p1', 'ghost'], [p1], matches);
    expect(pairs).toEqual([]);
  });

  it('sorts pairs by games played, descending', () => {
    const matches = [
      match('m1', 'p1', 'p2', 1, 0),
      match('m2', 'p1', 'p3', 1, 0),
      match('m3', 'p1', 'p3', 0, 1),
      match('m4', 'p1', 'p3', 2, 2),
    ];
    const pairs = buildH2HPairs(['p1', 'p2', 'p3'], [p1, p2, p3], matches);
    expect(pairs.map((p) => p.games)).toEqual([3, 1]);
    expect(pairs[0].playerB.id).toBe('p3');
  });
});
