import type { ArchivedRound, ClosedTournament, KnownStatKey, Match } from '../store/types';
import { STAT_DEFINITIONS } from './statDefinitions';

// ---------------------------------------------------------------------------
// Rivalry detail screen (app/rivalry/[a]/[b].tsx) aggregation
//
// Unlike statsAggregation.ts's collectAllMatches (which flattens the three
// store layers and deliberately drops round context), this keeps each match's
// round date alongside it so per-record dates can be shown and tapped through
// to match/[id]. Perspective is normalized so `match.aId` always equals
// playerIdA in every returned entry, mirroring buildH2HPairs' flip logic.
// ---------------------------------------------------------------------------

export interface RivalryMatchEntry {
  match: Match;
  /** Null when the match is still in the current open round (no round date yet). */
  date: string | null;
}

function normalizeMatch(match: Match, playerIdA: string): Match {
  if (match.aId === playerIdA) return match;

  // Flip perspective so aId/aScore/statsOverride.a always refer to playerIdA.
  const flippedStatsOverride = match.statsOverride
    ? Object.fromEntries(
        Object.entries(match.statsOverride).map(([key, v]) => [
          key,
          { ...v, a: v.b, b: v.a },
        ]),
      )
    : undefined;

  return {
    ...match,
    aId: match.bId,
    bId: match.aId,
    aTeam: match.bTeam,
    bTeam: match.aTeam,
    aScore: match.bScore,
    bScore: match.aScore,
    statsOverride: flippedStatsOverride,
  };
}

/**
 * Collects every match between playerIdA and playerIdB across all three store
 * layers, in chronological order, each paired with the date it was played
 * (from its round) — `null` for a match still in the current open round.
 */
export function collectRivalryMatches(
  playerIdA: string,
  playerIdB: string,
  closedTournaments: ClosedTournament[],
  archivedRounds: ArchivedRound[],
  currentMatches: Match[],
): RivalryMatchEntry[] {
  const isPair = (m: Match) =>
    (m.aId === playerIdA && m.bId === playerIdB) || (m.aId === playerIdB && m.bId === playerIdA);

  const entries: RivalryMatchEntry[] = [];

  for (const t of closedTournaments) {
    for (const r of t.rounds) {
      for (const m of r.matches) {
        if (isPair(m)) entries.push({ match: normalizeMatch(m, playerIdA), date: r.date });
      }
    }
  }

  for (const r of archivedRounds) {
    for (const m of r.matches) {
      if (isPair(m)) entries.push({ match: normalizeMatch(m, playerIdA), date: r.date });
    }
  }

  for (const m of currentMatches) {
    if (isPair(m)) entries.push({ match: normalizeMatch(m, playerIdA), date: null });
  }

  return entries;
}

export interface RivalryRecordMatch {
  entry: RivalryMatchEntry;
}

export interface BiggestWinRecord extends RivalryRecordMatch {
  margin: number;
}

export interface HighestScoringRecord extends RivalryRecordMatch {
  totalGoals: number;
}

export interface StatSide {
  value: number;
  entry: RivalryMatchEntry;
}

/**
 * A player's own best single-match value for a stat against this opponent —
 * `a` and `b` are computed independently, so they can come from two different
 * matches (e.g. A's best possession game vs B's best possession game).
 */
export interface StatRecord {
  key: KnownStatKey;
  a: StatSide;
  b: StatSide;
}

export interface RivalryRecords {
  /** Each player's own biggest win margin over the other — independent, may come from different matches. */
  biggestWinA: BiggestWinRecord | null;
  biggestWinB: BiggestWinRecord | null;
  /** Pair-level (not attributable to one side) — the single highest-combined-goals match. */
  highestScoring: HighestScoringRecord | null;
  winStreakA: number;
  winStreakB: number;
  statRecords: StatRecord[];
}

/** Longest run of consecutive entries decided in the given side's favor; a draw or a loss resets it. */
function longestWinStreak(entries: RivalryMatchEntry[], side: 'a' | 'b'): number {
  let longest = 0;
  let current = 0;
  for (const { match } of entries) {
    const won = side === 'a' ? match.aScore > match.bScore : match.bScore > match.aScore;
    current = won ? current + 1 : 0;
    if (current > longest) longest = current;
  }
  return longest;
}

function computeStatRecords(entries: RivalryMatchEntry[]): StatRecord[] {
  const records: StatRecord[] = [];

  for (const def of STAT_DEFINITIONS) {
    // A "record" is always the most extreme single-match value, regardless of
    // whether higher is generally the "better" outcome for this stat (that
    // flag only drives which side is highlighted in the Comparison tab) —
    // e.g. "most yellow cards in a match" is the notable record, not "fewest".
    let bestA: StatSide | null = null;
    let bestB: StatSide | null = null;

    for (const entry of entries) {
      const stat = entry.match.statsOverride?.[def.key];
      if (!stat) continue;
      if (bestA === null || stat.a > bestA.value) bestA = { value: stat.a, entry };
      if (bestB === null || stat.b > bestB.value) bestB = { value: stat.b, entry };
    }

    // Both sides always end up set together: whenever any entry has this key,
    // it carries both a and b values (they're recorded as a pair per match).
    if (bestA && bestB) records.push({ key: def.key, a: bestA, b: bestB });
  }

  return records;
}

export interface RivalryTotalRow {
  key: KnownStatKey;
  isPercent: boolean;
  /** Number of matches (in this pair, real stats only) that recorded this key. */
  games: number;
  /** Sum across all recorded matches — omitted for percent stats, where a sum is meaningless. */
  aSum?: number;
  bSum?: number;
  /** Average per match — always present, this is the only figure shown for percent stats. */
  aAvg: number;
  bAvg: number;
}

/**
 * Sum + average per stat across every match in the pair that recorded it — the
 * "Totals" and "Comparison" tabs share this same data, just rendered differently
 * (a text list vs. bars). Percent stats (possession, accuracy, etc.) only get an
 * average: summing a percentage across matches isn't meaningful.
 */
export function computeRivalryTotals(entries: RivalryMatchEntry[]): RivalryTotalRow[] {
  const rows: RivalryTotalRow[] = [];

  for (const def of STAT_DEFINITIONS) {
    let aSum = 0;
    let bSum = 0;
    let games = 0;

    for (const entry of entries) {
      const stat = entry.match.statsOverride?.[def.key];
      if (!stat) continue;
      aSum += stat.a;
      bSum += stat.b;
      games++;
    }

    if (games === 0) continue;

    rows.push({
      key: def.key,
      isPercent: def.isPercent,
      games,
      aSum: def.isPercent ? undefined : aSum,
      bSum: def.isPercent ? undefined : bSum,
      aAvg: aSum / games,
      bAvg: bSum / games,
    });
  }

  return rows;
}

export function computeRivalryRecords(entries: RivalryMatchEntry[]): RivalryRecords {
  let biggestWinA: BiggestWinRecord | null = null;
  let biggestWinB: BiggestWinRecord | null = null;
  let highestScoring: HighestScoringRecord | null = null;

  for (const entry of entries) {
    const { aScore, bScore } = entry.match;
    const margin = Math.abs(aScore - bScore);
    if (aScore > bScore && (!biggestWinA || margin >= biggestWinA.margin)) {
      biggestWinA = { entry, margin };
    } else if (bScore > aScore && (!biggestWinB || margin >= biggestWinB.margin)) {
      biggestWinB = { entry, margin };
    }

    const totalGoals = aScore + bScore;
    if (!highestScoring || totalGoals >= highestScoring.totalGoals) {
      highestScoring = { entry, totalGoals };
    }
  }

  return {
    biggestWinA,
    biggestWinB,
    highestScoring,
    winStreakA: longestWinStreak(entries, 'a'),
    winStreakB: longestWinStreak(entries, 'b'),
    statRecords: computeStatRecords(entries),
  };
}
