import { ArchivedRound } from '../store/types';

// ---------------------------------------------------------------------------
// Season stats screen (app/season-stats.tsx) aggregation
//
// Operates on a single ClosedTournament's rounds — no cross-tournament merge
// is involved here, unlike statsAggregation.ts.
// ---------------------------------------------------------------------------

export type IncludeFilter = 'Rated' | 'Friendly' | 'Both';

/** Filters a tournament's rounds by the ranked/friendly INCLUDE toggle. */
export function filterRoundsByRanked(
  rounds: ArchivedRound[],
  filter: IncludeFilter,
): ArchivedRound[] {
  if (filter === 'Rated') return rounds.filter((r) => r.ranked);
  if (filter === 'Friendly') return rounds.filter((r) => !r.ranked);
  return rounds;
}

/**
 * Counts rounds (within the already-filtered set) won by the given champion.
 * Note: `winner` is set on every finished round regardless of `ranked`, so
 * when `filter` is 'Friendly' or 'Both' this can count friendly-round wins
 * by the champion even though the championship itself is decided from
 * ranked rounds only (see closeTournament() in tournamentSlice.ts).
 */
export function countChampDaysWon(rounds: ArchivedRound[], champId: string): number {
  return rounds.filter((r) => r.winner === champId).length;
}
