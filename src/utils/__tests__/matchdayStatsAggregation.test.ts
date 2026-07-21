import { computeDayStatRecords, computeDayStatComparisons } from '../matchdayStatsAggregation';
import { type Match } from '../../store/types';

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

// ---------------------------------------------------------------------------

describe('computeDayStatRecords', () => {
  it('returns an empty array when no match has any stats', () => {
    expect(computeDayStatRecords([match('m1', 'p1', 'p2', 1, 0)])).toEqual([]);
  });

  it('picks the single most extreme value across every player in every match, not just two sides', () => {
    const matches: Match[] = [
      match('m1', 'p1', 'p2', 1, 0, { possession: { a: 55, b: 45 } }),
      match('m2', 'p3', 'p1', 2, 1, { possession: { a: 70, b: 30 } }),
      match('m3', 'p2', 'p3', 0, 0, { possession: { a: 40, b: 60 } }),
    ];

    const records = computeDayStatRecords(matches);
    const possession = records.find((r) => r.key === 'possession');
    expect(possession).toEqual({ key: 'possession', value: 70, playerId: 'p3', matchId: 'm2' });
  });

  it('always takes the maximum value regardless of higherIsBetter (e.g. most cards, not fewest)', () => {
    const matches: Match[] = [
      match('m1', 'p1', 'p2', 1, 0, { yellowCards: { a: 0, b: 1 } }),
      match('m2', 'p2', 'p3', 1, 1, { yellowCards: { a: 3, b: 0 } }),
    ];

    const records = computeDayStatRecords(matches);
    const cards = records.find((r) => r.key === 'yellowCards');
    expect(cards).toEqual({ key: 'yellowCards', value: 3, playerId: 'p2', matchId: 'm2' });
  });
});

describe('computeDayStatComparisons', () => {
  it('returns an empty array when no match has any stats', () => {
    expect(computeDayStatComparisons([match('m1', 'p1', 'p2', 1, 0)])).toEqual([]);
  });

  it('sums and averages per player across every match they appear in, for any number of players', () => {
    const matches: Match[] = [
      match('m1', 'p1', 'p2', 1, 0, { shots: { a: 10, b: 4 } }),
      match('m2', 'p1', 'p3', 2, 2, { shots: { a: 6, b: 8 } }),
      match('m3', 'p2', 'p3', 0, 1, { shots: { a: 3, b: 5 } }),
    ];

    const [shots] = computeDayStatComparisons(matches);
    expect(shots.key).toBe('shots');
    expect(shots.rows).toEqual([
      { playerId: 'p1', sum: 16, avg: 8, games: 2 },
      { playerId: 'p3', sum: 13, avg: 6.5, games: 2 },
      { playerId: 'p2', sum: 7, avg: 3.5, games: 2 },
    ]);
  });

  it('sorts ascending for stats where lower is better', () => {
    const matches: Match[] = [
      match('m1', 'p1', 'p2', 1, 0, { fouls: { a: 5, b: 2 } }),
      match('m2', 'p1', 'p2', 0, 1, { fouls: { a: 3, b: 4 } }),
    ];

    const [fouls] = computeDayStatComparisons(matches);
    expect(fouls.key).toBe('fouls');
    // p2 (6 total) has fewer fouls than p1 (8 total) — fewer is "better", so p2 sorts first.
    expect(fouls.rows.map((r) => r.playerId)).toEqual(['p2', 'p1']);
  });

  it('sorts percent stats by average, not sum', () => {
    // p1 plays one game at 50% (sum 50, avg 50). p2 plays two games averaging
    // 30% (20 + 40 = sum 60, avg 30). Sorting by sum would wrongly rank p2
    // first (60 > 50); sorting by average correctly ranks p1 first (50 > 30).
    const matches: Match[] = [
      match('m1', 'p1', 'p2', 1, 0, { possession: { a: 50, b: 20 } }),
      match('m2', 'p3', 'p2', 1, 0, { possession: { a: 0, b: 40 } }),
    ];

    const [possession] = computeDayStatComparisons(matches);
    expect(possession.isPercent).toBe(true);
    expect(possession.rows[0]).toEqual({ playerId: 'p1', sum: 50, avg: 50, games: 1 });
    expect(possession.rows.map((r) => r.playerId)).toEqual(['p1', 'p2', 'p3']);
  });
});
