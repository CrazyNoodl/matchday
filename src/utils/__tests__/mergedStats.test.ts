import { buildMergedStats } from '../mergedStats';
import { STAT_DEFINITIONS } from '../statDefinitions';
import type { Match } from '@/store/types';

const MATCH: Match = {
  id: 'match-1',
  aId: 'player-a',
  bId: 'player-b',
  aTeam: 'JUV',
  bTeam: 'TOT',
  aScore: 3,
  bScore: 1,
};

describe('buildMergedStats — fixed order, all 23 params always present (#63)', () => {
  it('returns exactly STAT_DEFINITIONS.length entries in canonical order when statsOverride has only a few keys', () => {
    const match: Match = {
      ...MATCH,
      statsOverride: {
        shots: { a: 7, b: 3 },
        possession: { a: 60, b: 40 },
      },
    };
    const merged = buildMergedStats(match, true);
    expect(merged).toHaveLength(STAT_DEFINITIONS.length);
    expect(merged.map((s) => s.key)).toEqual(STAT_DEFINITIONS.map((d) => d.key));
  });

  it('marks a key missing from statsOverride as isNA with 0/0 placeholder values', () => {
    const match: Match = { ...MATCH, statsOverride: { shots: { a: 7, b: 3 } } };
    const merged = buildMergedStats(match, true);
    const fouls = merged.find((s) => s.key === 'fouls')!;
    expect(fouls.isNA).toBe(true);
    expect(fouls.aVal).toBe(0);
    expect(fouls.bVal).toBe(0);
  });

  it('marks a key present in statsOverride as isNA:false with its real values', () => {
    const match: Match = { ...MATCH, statsOverride: { shots: { a: 7, b: 3 } } };
    const merged = buildMergedStats(match, true);
    const shots = merged.find((s) => s.key === 'shots')!;
    expect(shots.isNA).toBe(false);
    expect(shots.aVal).toBe(7);
    expect(shots.bVal).toBe(3);
  });

  it('carries confidence through for a recognized key, leaves it undefined for isNA rows', () => {
    const match: Match = {
      ...MATCH,
      statsOverride: { shots: { a: 7, b: 3, confidence: 'low' } },
    };
    const merged = buildMergedStats(match, true);
    expect(merged.find((s) => s.key === 'shots')!.confidence).toBe('low');
    expect(merged.find((s) => s.key === 'fouls')!.confidence).toBeUndefined();
  });

  it('appends OCR keys outside the 23 canonical params at the end, marked isNA:false', () => {
    const match: Match = {
      ...MATCH,
      statsOverride: {
        shots: { a: 7, b: 3 },
        weirdCustomStat: { a: 1, b: 2 },
      },
    };
    const merged = buildMergedStats(match, true);
    expect(merged).toHaveLength(STAT_DEFINITIONS.length + 1);
    const extra = merged[merged.length - 1];
    expect(extra.key).toBe('weirdCustomStat');
    expect(extra.isNA).toBe(false);
    expect(extra.aVal).toBe(1);
    expect(extra.bVal).toBe(2);
  });

  it('gives expectedGoals a 0.1 step and every other canonical param a step of 1', () => {
    const match: Match = { ...MATCH, statsOverride: { shots: { a: 7, b: 3 } } };
    const merged = buildMergedStats(match, true);
    expect(merged.find((s) => s.key === 'expectedGoals')!.step).toBe(0.1);
    expect(merged.find((s) => s.key === 'shots')!.step).toBe(1);
    expect(merged.find((s) => s.key === 'fouls')!.step).toBe(1);
  });
});

describe('buildMergedStats — no override falls back to simulated stats, unaffected by #63', () => {
  it('returns generateMatchStats output with isNA:false and no confidence', () => {
    const merged = buildMergedStats(MATCH, false);
    expect(merged.length).toBeGreaterThan(0);
    expect(merged.every((s) => s.isNA === false)).toBe(true);
    expect(merged.every((s) => s.confidence === undefined)).toBe(true);
  });
});
