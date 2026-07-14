import { type ArchivedRound } from '@/store/types';

// Stable empty-array fallback for Zustand selectors: a fresh `[]` literal
// inside a selector gives useSyncExternalStore a new reference every read,
// which never satisfies its equality check and causes an infinite
// re-render loop ("Maximum update depth exceeded") — see #77.
export const EMPTY_ROUNDS: ArchivedRound[] = [];

/** Maps round id → its ordinal among ranked rounds only (chronological order). Friendly rounds are absent from the map. */
export function getRankedRoundOrdinals(archivedRounds: ArchivedRound[]): Record<string, number> {
  const ordinals: Record<string, number> = {};
  let count = 0;
  for (const round of archivedRounds) {
    if (round.ranked) {
      count += 1;
      ordinals[round.id] = count;
    }
  }
  return ordinals;
}
