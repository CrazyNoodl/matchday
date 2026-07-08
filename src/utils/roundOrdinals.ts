import { type ArchivedRound } from '@/store/types';

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
