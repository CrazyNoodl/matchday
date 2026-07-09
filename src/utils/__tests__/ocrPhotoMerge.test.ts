import { confidenceRank, mergeStatArrays, toPendingStatsRecord } from '../ocrPhotoMerge';
import type { ExtractedStat } from '../extractStats';

const stat = (
  key: string,
  home: number,
  away: number,
  confidence: ExtractedStat['confidence'],
): ExtractedStat => ({
  key,
  label: key,
  home,
  away,
  confidence,
});

describe('confidenceRank', () => {
  it('orders high > medium > low', () => {
    expect(confidenceRank('high')).toBeGreaterThan(confidenceRank('medium'));
    expect(confidenceRank('medium')).toBeGreaterThan(confidenceRank('low'));
  });
});

describe('mergeStatArrays', () => {
  it('picks the highest-confidence value per key across groups', () => {
    const merged = mergeStatArrays([[stat('shots', 5, 3, 'low')], [stat('shots', 6, 2, 'high')]]);
    expect(merged).toEqual([stat('shots', 6, 2, 'high')]);
  });

  it('keeps the first value seen when a later group has equal confidence', () => {
    const merged = mergeStatArrays([
      [stat('shots', 5, 3, 'medium')],
      [stat('shots', 9, 9, 'medium')],
    ]);
    expect(merged).toEqual([stat('shots', 5, 3, 'medium')]);
  });

  it('merges distinct keys from independent groups', () => {
    const merged = mergeStatArrays([
      [stat('shots', 5, 3, 'high')],
      [stat('possession', 60, 40, 'medium')],
    ]);
    expect(merged).toHaveLength(2);
    expect(merged).toEqual(
      expect.arrayContaining([stat('shots', 5, 3, 'high'), stat('possession', 60, 40, 'medium')]),
    );
  });

  it('returns an empty array for no groups or all-empty groups', () => {
    expect(mergeStatArrays([])).toEqual([]);
    expect(mergeStatArrays([[], []])).toEqual([]);
  });
});

describe('toPendingStatsRecord', () => {
  it('returns null for an empty array', () => {
    expect(toPendingStatsRecord([])).toBeNull();
  });

  it('converts stats to the {a,b} record shape, dropping label/confidence', () => {
    const record = toPendingStatsRecord([stat('shots', 5, 3, 'high')]);
    expect(record).toEqual({ shots: { a: 5, b: 3 } });
  });

  it('includes every key for a multi-stat array', () => {
    const record = toPendingStatsRecord([
      stat('shots', 5, 3, 'high'),
      stat('possession', 60, 40, 'medium'),
    ]);
    expect(record).toEqual({
      shots: { a: 5, b: 3 },
      possession: { a: 60, b: 40 },
    });
  });
});
