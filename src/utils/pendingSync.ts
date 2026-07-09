import type { ArchivedRound, Match } from '@/store/types';

// pendingSyncTables (src/store/index.ts) is table-level, not per-edit — it
// can only say "matches are dirty", not "3 matches are dirty". Media upload
// failures are tracked per-item, so counting those separately gives the
// indicator at least one precise number instead of none.
export function countPendingMedia(matches: Match[], archivedRounds: ArchivedRound[]): number {
  const countIn = (list: Match[]) =>
    list.reduce((sum, m) => sum + (m.media?.filter((item) => item.pendingUpload).length ?? 0), 0);
  return countIn(matches) + archivedRounds.reduce((sum, r) => sum + countIn(r.matches), 0);
}
