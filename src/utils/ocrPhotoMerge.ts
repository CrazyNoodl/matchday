import type { ExtractedStat } from './extractStats';

export function confidenceRank(c: ExtractedStat['confidence']): number {
  return c === 'high' ? 3 : c === 'medium' ? 2 : 1;
}

// Picks the highest-confidence value per stat key across every photo's results.
export function mergeStatArrays(all: ExtractedStat[][]): ExtractedStat[] {
  const map = new Map<string, ExtractedStat>();
  for (const stats of all) {
    for (const stat of stats) {
      const existing = map.get(stat.key);
      if (!existing || confidenceRank(stat.confidence) > confidenceRank(existing.confidence)) {
        map.set(stat.key, stat);
      }
    }
  }
  return Array.from(map.values());
}

export function toPendingStatsRecord(stats: ExtractedStat[]): Record<string, { a: number; b: number }> | null {
  if (stats.length === 0) return null;
  const record: Record<string, { a: number; b: number }> = {};
  for (const s of stats) record[s.key] = { a: s.home, b: s.away };
  return record;
}
