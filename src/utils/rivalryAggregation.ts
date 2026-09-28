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

export interface RivalryMatchFilterOptions {
  /** When true, only matches from ranked rounds are included — friendly rounds are dropped. */
  rankedOnly?: boolean;
  /** Whether the in-progress round (currentMatches) is ranked — only consulted when rankedOnly is set. */
  currentRoundRanked?: boolean;
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
  options: RivalryMatchFilterOptions = {},
): RivalryMatchEntry[] {
  const { rankedOnly = false, currentRoundRanked = false } = options;
  const isPair = (m: Match) =>
    (m.aId === playerIdA && m.bId === playerIdB) || (m.aId === playerIdB && m.bId === playerIdA);
  const keepRound = (r: ArchivedRound) => !rankedOnly || r.ranked;

  const entries: RivalryMatchEntry[] = [];

  for (const t of closedTournaments) {
    for (const r of t.rounds.filter(keepRound)) {
      for (const m of r.matches) {
        if (isPair(m)) entries.push({ match: normalizeMatch(m, playerIdA), date: r.date });
      }
    }
  }

  for (const r of archivedRounds.filter(keepRound)) {
    for (const m of r.matches) {
      if (isPair(m)) entries.push({ match: normalizeMatch(m, playerIdA), date: r.date });
    }
  }

  if (!rankedOnly || currentRoundRanked) {
    for (const m of currentMatches) {
      if (isPair(m)) entries.push({ match: normalizeMatch(m, playerIdA), date: null });
    }
  }

  return entries;
}

/**
 * The most recent date this specific pair actually played each other —
 * `null` if every entry is still in the current open round (no archived
 * meeting yet). Used to flag which stat records were set in that matchday.
 */
export function getLastMatchdayDate(entries: RivalryMatchEntry[]): string | null {
  let latest: string | null = null;
  for (const entry of entries) {
    if (entry.date && (!latest || entry.date > latest)) latest = entry.date;
  }
  return latest;
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
  bestStatRecords: StatRecord[];
  worstStatRecords: StatRecord[];
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

/**
 * Shared by best/worst: for each stat key, finds each side's own most extreme
 * single-match value in the given direction (`wantHighest`). A "record" is
 * normally the most extreme raw value in that direction, regardless of
 * whether higher is generally the "better" outcome for this stat (that flag
 * only drives which side is highlighted in the Comparison tab) — e.g. "most
 * yellow cards in a match" is the best-record, "fewest" is the worst-record,
 * neither is about "good discipline".
 *
 * `timeToRegain` is the one exception: unlike the other lower-is-better
 * stats, a slow (high) recovery time reading as the "Best" record is
 * actively confusing (a high number can't be anyone's best game), so its
 * best/worst buckets are flipped to pick the opposite raw extreme.
 */
function computeExtremeStatRecords(entries: RivalryMatchEntry[], wantHighest: boolean): StatRecord[] {
  const records: StatRecord[] = [];

  for (const def of STAT_DEFINITIONS) {
    const pickHighest = def.key === 'timeToRegain' ? !wantHighest : wantHighest;
    const isMoreExtreme = pickHighest
      ? (candidate: number, current: number) => candidate > current
      : (candidate: number, current: number) => candidate < current;

    let extremeA: StatSide | null = null;
    let extremeB: StatSide | null = null;

    for (const entry of entries) {
      const stat = entry.match.statsOverride?.[def.key];
      if (!stat) continue;
      if (extremeA === null || isMoreExtreme(stat.a, extremeA.value)) extremeA = { value: stat.a, entry };
      if (extremeB === null || isMoreExtreme(stat.b, extremeB.value)) extremeB = { value: stat.b, entry };
    }

    // Both sides always end up set together: whenever any entry has this key,
    // it carries both a and b values (they're recorded as a pair per match).
    if (extremeA && extremeB) records.push({ key: def.key, a: extremeA, b: extremeB });
  }

  return records;
}

const computeBestStatRecords = (entries: RivalryMatchEntry[]) => computeExtremeStatRecords(entries, true);

const computeWorstStatRecords = (entries: RivalryMatchEntry[]) => computeExtremeStatRecords(entries, false);

export interface RivalryTotalRow {
  key: KnownStatKey;
  isPercent: boolean;
  /** Number of matches (in this pair, real stats only) that recorded this key. */
  games: number;
  /** Sum across all recorded matches — omitted when `sumMeaningful` is false for this stat def (percent stats, or rate-like stats such as time to regain). */
  aSum?: number;
  bSum?: number;
  /** Average per match — always present, this is the only figure shown when the sum is omitted. */
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

    const noSum = def.isPercent || def.sumMeaningful === false;

    rows.push({
      key: def.key,
      isPercent: def.isPercent,
      games,
      aSum: noSum ? undefined : aSum,
      bSum: noSum ? undefined : bSum,
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
    bestStatRecords: computeBestStatRecords(entries),
    worstStatRecords: computeWorstStatRecords(entries),
  };
}
