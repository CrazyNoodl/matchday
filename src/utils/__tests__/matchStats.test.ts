import { generateMatchStats } from '../matchStats';

describe('generateMatchStats — output shape', () => {
  it('returns 9 stat entries', () => {
    const stats = generateMatchStats('match-1', 2, 1);
    expect(stats).toHaveLength(9);
  });

  it('includes expected stat keys', () => {
    const stats = generateMatchStats('match-1', 2, 1);
    const keys = stats.map((s) => s.key);
    expect(keys).toContain('possession');
    expect(keys).toContain('shots');
    expect(keys).toContain('shotsOnTarget');
    expect(keys).toContain('passAccuracy');
    expect(keys).toContain('passes');
    expect(keys).toContain('tackles');
    expect(keys).toContain('fouls');
    expect(keys).toContain('corners');
    expect(keys).toContain('offsides');
  });
});

describe('generateMatchStats — possession', () => {
  it('possession values sum to 100', () => {
    const stats = generateMatchStats('match-1', 2, 1);
    const possession = stats.find((s) => s.key === 'possession')!;
    expect(possession.aVal + possession.bVal).toBe(100);
  });

  it('winner (a > b) has possession ≥ 50', () => {
    const stats = generateMatchStats('match-abc', 3, 0);
    const possession = stats.find((s) => s.key === 'possession')!;
    expect(possession.aVal).toBeGreaterThanOrEqual(50);
  });

  it('loser (a < b) has possession < 50', () => {
    const stats = generateMatchStats('match-abc', 0, 3);
    const possession = stats.find((s) => s.key === 'possession')!;
    expect(possession.aVal).toBeLessThan(50);
  });

  it('draw possession is between 48 and 52', () => {
    const stats = generateMatchStats('match-draw', 1, 1);
    const possession = stats.find((s) => s.key === 'possession')!;
    expect(possession.aVal).toBeGreaterThanOrEqual(48);
    expect(possession.aVal).toBeLessThanOrEqual(52);
  });
});

describe('generateMatchStats — shots on target ≤ total shots', () => {
  it('aShotsOnTarget is always ≤ aShots', () => {
    const stats = generateMatchStats('match-xyz', 2, 1);
    const shots = stats.find((s) => s.key === 'shots')!;
    const shotsOnTarget = stats.find((s) => s.key === 'shotsOnTarget')!;
    expect(shotsOnTarget.aVal).toBeLessThanOrEqual(shots.aVal);
  });

  it('bShotsOnTarget is always ≤ bShots', () => {
    const stats = generateMatchStats('match-xyz', 2, 1);
    const shots = stats.find((s) => s.key === 'shots')!;
    const shotsOnTarget = stats.find((s) => s.key === 'shotsOnTarget')!;
    expect(shotsOnTarget.bVal).toBeLessThanOrEqual(shots.bVal);
  });
});

describe('generateMatchStats — all values non-negative', () => {
  const cases: [string, number, number][] = [
    ['win', 3, 0],
    ['loss', 0, 3],
    ['draw', 1, 1],
    ['0-0', 0, 0],
  ];

  it.each(cases)('%s: all stat values are ≥ 0', (_, aScore, bScore) => {
    const stats = generateMatchStats(`match-${aScore}-${bScore}`, aScore, bScore);
    for (const stat of stats) {
      expect(stat.aVal).toBeGreaterThanOrEqual(0);
      expect(stat.bVal).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('generateMatchStats — determinism', () => {
  it('same matchId and score always produce the same result', () => {
    const first = generateMatchStats('stable-id', 2, 1);
    const second = generateMatchStats('stable-id', 2, 1);
    expect(first).toEqual(second);
  });

  it('different matchIds produce different results', () => {
    const a = generateMatchStats('id-aaa', 2, 1);
    const b = generateMatchStats('id-bbb', 2, 1);
    const possessionA = a.find((s) => s.key === 'possession')!.aVal;
    const possessionB = b.find((s) => s.key === 'possession')!.aVal;
    // Very unlikely to be identical for different IDs
    expect(possessionA).not.toBe(possessionB);
  });
});
