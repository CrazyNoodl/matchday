import type { KnownStatKey, Match } from '../store/types';
import { STAT_DEFINITIONS } from './statDefinitions';

// ---------------------------------------------------------------------------
// Match-day stats screen (app/matchday-stats.tsx) aggregation
//
// Unlike rivalryAggregation.ts (exactly 2 players, all-time by default), this
// operates on a single round's own `matches` array and makes no assumption
// about how many players took part — a match day is a round-robin, so it can
// be 2, 3, or more.
// ---------------------------------------------------------------------------

export interface DayStatRecordEntry {
  value: number;
  playerId: string;
  matchId: string;
}

export interface DayStatRecord {
  key: KnownStatKey;
  first: DayStatRecordEntry;
  /** Runner-up, i.e. the next distinct player's own peak value that day — null only if a single player recorded this stat. */
  second: DayStatRecordEntry | null;
}

/**
 * Shared by best/worst: for each of the 23 stats, finds each distinct
 * player's own most extreme single-match value this match day —
 * `isMoreExtreme` decides the direction (`>` for best, `<` for worst),
 * regardless of whether higher is generally "better" for that stat (a record
 * is the most notable single-match occurrence, e.g. most cards in a game is
 * the best-record, fewest is the worst-record — same rule
 * rivalryAggregation.ts's computeExtremeStatRecords uses for the pair-scoped
 * version). Returns the top two distinct record holders, ranked by extremity.
 */
function computeExtremeDayStatRecords(
  matches: Match[],
  isMoreExtreme: (candidate: number, current: number) => boolean,
): DayStatRecord[] {
  const records: DayStatRecord[] = [];

  for (const def of STAT_DEFINITIONS) {
    const extremeByPlayer = new Map<string, DayStatRecordEntry>();

    for (const m of matches) {
      const stat = m.statsOverride?.[def.key];
      if (!stat) continue;

      const a = extremeByPlayer.get(m.aId);
      if (!a || isMoreExtreme(stat.a, a.value)) {
        extremeByPlayer.set(m.aId, { value: stat.a, playerId: m.aId, matchId: m.id });
      }
      const b = extremeByPlayer.get(m.bId);
      if (!b || isMoreExtreme(stat.b, b.value)) {
        extremeByPlayer.set(m.bId, { value: stat.b, playerId: m.bId, matchId: m.id });
      }
    }

    if (extremeByPlayer.size === 0) continue;

    const sorted = Array.from(extremeByPlayer.values()).sort((x, y) =>
      isMoreExtreme(y.value, x.value) ? 1 : isMoreExtreme(x.value, y.value) ? -1 : 0,
    );
    records.push({ key: def.key, first: sorted[0], second: sorted[1] ?? null });
  }

  return records;
}

export const computeDayStatBestRecords = (matches: Match[]): DayStatRecord[] =>
  computeExtremeDayStatRecords(matches, (candidate, current) => candidate > current);

export const computeDayStatWorstRecords = (matches: Match[]): DayStatRecord[] =>
  computeExtremeDayStatRecords(matches, (candidate, current) => candidate < current);

export interface DayPlayerStatValue {
  playerId: string;
  sum: number;
  avg: number;
  games: number;
}

export interface DayStatComparison {
  key: KnownStatKey;
  isPercent: boolean;
  /** Every player who recorded this stat at least once this match day, sorted best-first per the stat's `higherIsBetter` direction. */
  rows: DayPlayerStatValue[];
}

/**
 * Sum + average per player per stat, across every player who took part in
 * this match day — the N-player generalization of rivalryAggregation.ts's
 * pair-only computeRivalryTotals (which hardcodes exactly two sides, `a`/`b`).
 */
export function computeDayStatComparisons(matches: Match[]): DayStatComparison[] {
  const result: DayStatComparison[] = [];

  for (const def of STAT_DEFINITIONS) {
    const byPlayer = new Map<string, { sum: number; games: number }>();

    for (const m of matches) {
      const stat = m.statsOverride?.[def.key];
      if (!stat) continue;

      const a = byPlayer.get(m.aId) ?? { sum: 0, games: 0 };
      a.sum += stat.a;
      a.games += 1;
      byPlayer.set(m.aId, a);

      const b = byPlayer.get(m.bId) ?? { sum: 0, games: 0 };
      b.sum += stat.b;
      b.games += 1;
      byPlayer.set(m.bId, b);
    }

    if (byPlayer.size === 0) continue;

    const rows: DayPlayerStatValue[] = Array.from(byPlayer.entries()).map(
      ([playerId, { sum, games }]) => ({ playerId, sum, games, avg: sum / games }),
    );

    const sortValue = (r: DayPlayerStatValue) => (def.isPercent ? r.avg : r.sum);
    const higherIsBetter = def.higherIsBetter ?? true;
    rows.sort((x, y) =>
      higherIsBetter ? sortValue(y) - sortValue(x) : sortValue(x) - sortValue(y),
    );

    result.push({ key: def.key, isPercent: def.isPercent, rows });
  }

  return result;
}
