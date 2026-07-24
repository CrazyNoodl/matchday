import {
  collectRivalryMatches,
  computeRivalryRecords,
  computeRivalryTotals,
} from '../rivalryAggregation';
import { type ArchivedRound, type ClosedTournament, type Match } from '../../store/types';

const match = (
  id: string,
  aId: string,
  bId: string,
  aScore: number,
  bScore: number,
  statsOverride?: Match['statsOverride'],
): Match => ({
  id,
  aId,
  bId,
  aScore,
  bScore,
  aTeam: 'A',
  bTeam: 'B',
  ...(statsOverride ? { statsOverride } : {}),
});

const round = (id: string, date: string, matches: Match[]): ArchivedRound => ({
  id,
  n: 1,
  date,
  winner: '',
  games: matches.length,
  ranked: true,
  matches,
  name: 'Round',
});

const closedTournament = (id: string, rounds: ArchivedRound[]): ClosedTournament => ({
  id,
  name: 'Tournament',
  date: '2026-01-01',
  rounds,
  champId: '',
  champName: 'Champ',
  champColor: '#000',
  champInit: 'C',
  players: [],
});

// ---------------------------------------------------------------------------

describe('collectRivalryMatches', () => {
  it('returns an empty array when all three layers are empty', () => {
    expect(collectRivalryMatches('p1', 'p2', [], [], [])).toEqual([]);
  });

  it('collects across all three layers in chronological order, with each round date attached', () => {
    const mClosed = match('m-closed', 'p1', 'p2', 1, 0);
    const mArchived = match('m-archived', 'p1', 'p2', 2, 0);
    const mCurrent = match('m-current', 'p1', 'p2', 3, 0);

    const closed = [closedTournament('t1', [round('r1', '2026-01-01', [mClosed])])];
    const archived = [round('r2', '2026-02-01', [mArchived])];
    const current = [mCurrent];

    const entries = collectRivalryMatches('p1', 'p2', closed, archived, current);
    expect(entries.map((e) => e.match.id)).toEqual(['m-closed', 'm-archived', 'm-current']);
    expect(entries.map((e) => e.date)).toEqual(['2026-01-01', '2026-02-01', null]);
  });

  it('ignores matches that are not between the requested pair', () => {
    const entries = collectRivalryMatches(
      'p1',
      'p2',
      [],
      [round('r1', '2026-01-01', [match('m1', 'p1', 'p3', 1, 0)])],
      [match('m2', 'p2', 'p3', 1, 0)],
    );
    expect(entries).toEqual([]);
  });

  it('normalizes perspective so match.aId always equals playerIdA, flipping scores and stats', () => {
    const stored = match('m1', 'p2', 'p1', 3, 1, {
      possession: { a: 60, b: 40 },
    });
    const entries = collectRivalryMatches('p1', 'p2', [], [round('r1', '2026-01-01', [stored])], []);
    expect(entries).toHaveLength(1);
    const { match: normalized } = entries[0];
    expect(normalized.aId).toBe('p1');
    expect(normalized.bId).toBe('p2');
    expect(normalized.aScore).toBe(1);
    expect(normalized.bScore).toBe(3);
    expect(normalized.statsOverride?.possession).toEqual({ a: 40, b: 60 });
  });

  it('leaves a match already in A/B order untouched', () => {
    const stored = match('m1', 'p1', 'p2', 2, 0);
    const entries = collectRivalryMatches('p1', 'p2', [], [round('r1', '2026-01-01', [stored])], []);
    expect(entries[0].match).toMatchObject({ aId: 'p1', bId: 'p2', aScore: 2, bScore: 0 });
  });
});

describe('computeRivalryRecords', () => {
  const entry = (m: Match, date: string | null = '2026-01-01') => ({ match: m, date });

  it('returns null records and zero streaks for no matches', () => {
    const records = computeRivalryRecords([]);
    expect(records.biggestWinA).toBeNull();
    expect(records.biggestWinB).toBeNull();
    expect(records.highestScoring).toBeNull();
    expect(records.winStreakA).toBe(0);
    expect(records.winStreakB).toBe(0);
    expect(records.bestStatRecords).toEqual([]);
    expect(records.worstStatRecords).toEqual([]);
  });

  it('both biggestWinA and biggestWinB are null when every match was a draw', () => {
    const records = computeRivalryRecords([entry(match('m1', 'p1', 'p2', 1, 1))]);
    expect(records.biggestWinA).toBeNull();
    expect(records.biggestWinB).toBeNull();
  });

  it('computes each side’s own biggest win margin independently', () => {
    const entries = [
      entry(match('m1', 'p1', 'p2', 2, 1), '2026-01-01'), // a wins by 1
      entry(match('m2', 'p1', 'p2', 1, 5), '2026-01-02'), // b wins by 4
    ];
    const records = computeRivalryRecords(entries);
    expect(records.biggestWinA).toMatchObject({ margin: 1 });
    expect(records.biggestWinA?.entry.match.id).toBe('m1');
    expect(records.biggestWinB).toMatchObject({ margin: 4 });
    expect(records.biggestWinB?.entry.match.id).toBe('m2');
  });

  it('breaks a biggestWin tie (same side, same margin) by picking the most recent entry', () => {
    const entries = [
      entry(match('m1', 'p1', 'p2', 3, 0), '2026-01-01'), // a wins by 3
      entry(match('m2', 'p1', 'p2', 4, 1), '2026-01-05'), // a wins by 3, later
    ];
    const records = computeRivalryRecords(entries);
    expect(records.biggestWinA?.entry.match.id).toBe('m2');
  });

  it('picks the highest combined-goals match', () => {
    const entries = [
      entry(match('m1', 'p1', 'p2', 2, 1)), // 3
      entry(match('m2', 'p1', 'p2', 4, 3)), // 7
      entry(match('m3', 'p1', 'p2', 1, 1)), // 2
    ];
    const records = computeRivalryRecords(entries);
    expect(records.highestScoring).toMatchObject({ totalGoals: 7 });
    expect(records.highestScoring?.entry.match.id).toBe('m2');
  });

  it('counts the longest win streak per side, reset by a draw or a loss', () => {
    const entries = [
      entry(match('m1', 'p1', 'p2', 1, 0)), // a win
      entry(match('m2', 'p1', 'p2', 1, 0)), // a win (streak 2)
      entry(match('m3', 'p1', 'p2', 0, 0)), // draw — resets
      entry(match('m4', 'p1', 'p2', 1, 0)), // a win (streak 1 again)
      entry(match('m5', 'p1', 'p2', 0, 1)), // b win
      entry(match('m6', 'p1', 'p2', 0, 1)), // b win (streak 2)
      entry(match('m7', 'p1', 'p2', 0, 1)), // b win (streak 3)
    ];
    const records = computeRivalryRecords(entries);
    expect(records.winStreakA).toBe(2);
    expect(records.winStreakB).toBe(3);
  });

  it('omits a stat key entirely when no match in the pair recorded it', () => {
    const entries = [entry(match('m1', 'p1', 'p2', 1, 0, { possession: { a: 55, b: 45 } }))];
    const records = computeRivalryRecords(entries);
    const keys = records.bestStatRecords.map((r) => r.key);
    expect(keys).toEqual(['possession']);
  });

  it('computes each side’s own best value independently, even from different matches', () => {
    const entries = [
      entry(match('m1', 'p1', 'p2', 1, 0, { shots: { a: 5, b: 8 } })),
      entry(match('m2', 'p1', 'p2', 0, 1, { shots: { a: 9, b: 2 } })),
    ];
    const records = computeRivalryRecords(entries);
    const shotsRecord = records.bestStatRecords.find((r) => r.key === 'shots');
    // a's best (9) comes from m2, b's best (8) comes from m1 — independent matches.
    expect(shotsRecord?.a).toMatchObject({ value: 9 });
    expect(shotsRecord?.a.entry.match.id).toBe('m2');
    expect(shotsRecord?.b).toMatchObject({ value: 8 });
    expect(shotsRecord?.b.entry.match.id).toBe('m1');
  });

  it('gives both sides the same value (from the same match) when they tied on their best', () => {
    const entries = [entry(match('m1', 'p1', 'p2', 1, 1, { possession: { a: 50, b: 50 } }))];
    const records = computeRivalryRecords(entries);
    const possessionRecord = records.bestStatRecords.find((r) => r.key === 'possession');
    expect(possessionRecord?.a.value).toBe(50);
    expect(possessionRecord?.b.value).toBe(50);
  });

  it('picks the maximum even for a lower-is-better stat like yellowCards — a "record" is the most extreme single-match value, not the best performance', () => {
    const entries = [
      entry(match('m1', 'p1', 'p2', 1, 0, { yellowCards: { a: 1, b: 3 } })),
      entry(match('m2', 'p1', 'p2', 0, 1, { yellowCards: { a: 2, b: 0 } })),
    ];
    const records = computeRivalryRecords(entries);
    const record = records.bestStatRecords.find((r) => r.key === 'yellowCards');
    // a's record (most) is 2 from m2; b's record (most) is 3 from m1.
    expect(record?.a).toMatchObject({ value: 2 });
    expect(record?.a.entry.match.id).toBe('m2');
    expect(record?.b).toMatchObject({ value: 3 });
    expect(record?.b.entry.match.id).toBe('m1');
  });

  it('computes each side’s own worst value independently, even from different matches', () => {
    const entries = [
      entry(match('m1', 'p1', 'p2', 1, 0, { shots: { a: 5, b: 8 } })),
      entry(match('m2', 'p1', 'p2', 0, 1, { shots: { a: 9, b: 2 } })),
    ];
    const records = computeRivalryRecords(entries);
    const shotsRecord = records.worstStatRecords.find((r) => r.key === 'shots');
    // a's worst (5) comes from m1, b's worst (2) comes from m2 — independent matches.
    expect(shotsRecord?.a).toMatchObject({ value: 5 });
    expect(shotsRecord?.a.entry.match.id).toBe('m1');
    expect(shotsRecord?.b).toMatchObject({ value: 2 });
    expect(shotsRecord?.b.entry.match.id).toBe('m2');
  });

  it('picks the minimum even for a higher-is-better stat like shots — the worst-record mirrors the best-record\'s "most extreme value" rule', () => {
    const entries = [
      entry(match('m1', 'p1', 'p2', 1, 0, { yellowCards: { a: 1, b: 3 } })),
      entry(match('m2', 'p1', 'p2', 0, 1, { yellowCards: { a: 2, b: 0 } })),
    ];
    const records = computeRivalryRecords(entries);
    const record = records.worstStatRecords.find((r) => r.key === 'yellowCards');
    // a's worst-record (fewest) is 1 from m1; b's worst-record (fewest) is 0 from m2.
    expect(record?.a).toMatchObject({ value: 1 });
    expect(record?.a.entry.match.id).toBe('m1');
    expect(record?.b).toMatchObject({ value: 0 });
    expect(record?.b.entry.match.id).toBe('m2');
  });

  it('bestStatRecords and worstStatRecords always cover the same set of keys', () => {
    const entries = [
      entry(match('m1', 'p1', 'p2', 1, 0, { possession: { a: 55, b: 45 }, shots: { a: 5, b: 8 } })),
      entry(match('m2', 'p1', 'p2', 0, 1, { shots: { a: 9, b: 2 } })),
    ];
    const records = computeRivalryRecords(entries);
    const bestKeys = records.bestStatRecords.map((r) => r.key).sort();
    const worstKeys = records.worstStatRecords.map((r) => r.key).sort();
    expect(worstKeys).toEqual(bestKeys);
  });
});

describe('computeRivalryTotals', () => {
  const entry = (m: Match, date: string | null = '2026-01-01') => ({ match: m, date });

  it('returns an empty array for no matches', () => {
    expect(computeRivalryTotals([])).toEqual([]);
  });

  it('omits a stat key entirely when no match in the pair recorded it', () => {
    const entries = [entry(match('m1', 'p1', 'p2', 1, 0, { shots: { a: 5, b: 3 } }))];
    const totals = computeRivalryTotals(entries);
    expect(totals.map((r) => r.key)).toEqual(['shots']);
  });

  it('sums a non-percent stat across matches and averages per game', () => {
    const entries = [
      entry(match('m1', 'p1', 'p2', 1, 0, { yellowCards: { a: 2, b: 1 } })),
      entry(match('m2', 'p1', 'p2', 0, 1, { yellowCards: { a: 5, b: 0 } })),
    ];
    const [row] = computeRivalryTotals(entries);
    expect(row).toMatchObject({
      key: 'yellowCards',
      isPercent: false,
      games: 2,
      aSum: 7,
      bSum: 1,
      aAvg: 3.5,
      bAvg: 0.5,
    });
  });

  it('gives a percent stat only an average — no sum field', () => {
    const entries = [
      entry(match('m1', 'p1', 'p2', 1, 0, { possession: { a: 60, b: 40 } })),
      entry(match('m2', 'p1', 'p2', 0, 1, { possession: { a: 50, b: 50 } })),
    ];
    const [row] = computeRivalryTotals(entries);
    expect(row.isPercent).toBe(true);
    expect(row.aSum).toBeUndefined();
    expect(row.bSum).toBeUndefined();
    expect(row.aAvg).toBe(55);
    expect(row.bAvg).toBe(45);
  });

  it('only counts matches that actually recorded the key in the average denominator', () => {
    const entries = [
      entry(match('m1', 'p1', 'p2', 1, 0, { shots: { a: 10, b: 2 } })),
      entry(match('m2', 'p1', 'p2', 0, 1)), // no statsOverride at all — should not count toward games
    ];
    const [row] = computeRivalryTotals(entries);
    expect(row.games).toBe(1);
    expect(row.aAvg).toBe(10);
  });
});
