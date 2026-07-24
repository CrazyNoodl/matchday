import { useMemo } from 'react';
import { useStore } from '@/store';
import type { Match } from '@/store/types';
import {
  computeDayStatBestRecords,
  computeDayStatWorstRecords,
  computeDayStatComparisons,
} from '@/utils/matchdayStatsAggregation';

const EMPTY_MATCHES: Match[] = [];

/**
 * Two entry points: archive-day.tsx sets the `viewingRound` UI-state field
 * before navigating here for a closed round. round.tsx's own "···" menu
 * navigates here with no `viewingRound` set at all, to show stats for the
 * matchday that's still open (`roundOpen`) — its matches live in the store's
 * top-level `matches`, not `archivedRounds`, since it hasn't been archived yet.
 */
export function useMatchdayStatsData() {
  const players = useStore((s) => s.players);
  const viewingRound = useStore((s) => s.viewingRound);
  const roundOpen = useStore((s) => s.roundOpen);
  const liveMatches = useStore((s) => s.matches);
  // Mirrors archive-day.tsx's own `liveRound`: prefer the live archivedRounds
  // entry so in-place stat edits are reflected, falling back to the snapshot
  // for a round that belongs to a closed tournament.
  const archivedRound = useStore((s) =>
    viewingRound ? (s.archivedRounds.find((r) => r.id === viewingRound.id) ?? viewingRound) : null,
  );

  const isLiveRound = !viewingRound && roundOpen;
  const hasRound = archivedRound !== null || isLiveRound;
  const matches = archivedRound?.matches ?? (isLiveRound ? liveMatches : EMPTY_MATCHES);
  const date = archivedRound?.date ?? null;

  const bestRecords = useMemo(() => computeDayStatBestRecords(matches), [matches]);
  const worstRecords = useMemo(() => computeDayStatWorstRecords(matches), [matches]);
  const comparisons = useMemo(() => computeDayStatComparisons(matches), [matches]);

  return { hasRound, date, players, bestRecords, worstRecords, comparisons };
}
