import { useMemo } from 'react';
import { useStore } from '@/store';
import { computeDayStatRecords, computeDayStatComparisons } from '@/utils/matchdayStatsAggregation';

/**
 * Reads the same `viewingRound` UI-state field archive-day.tsx already relies
 * on for its own navigation into this screen — no roundId param needed, it's
 * guaranteed set by the only entry point (archive-day's "···" menu).
 */
export function useMatchdayStatsData() {
  const players = useStore((s) => s.players);
  const viewingRound = useStore((s) => s.viewingRound);
  // Mirrors archive-day.tsx's own `liveRound`: prefer the live archivedRounds
  // entry so in-place stat edits are reflected, falling back to the snapshot
  // for a round that belongs to a closed tournament.
  const round = useStore((s) =>
    viewingRound ? (s.archivedRounds.find((r) => r.id === viewingRound.id) ?? viewingRound) : null,
  );

  const matches = round?.matches ?? [];

  const records = useMemo(() => computeDayStatRecords(matches), [matches]);
  const comparisons = useMemo(() => computeDayStatComparisons(matches), [matches]);

  return { round, players, records, comparisons };
}
