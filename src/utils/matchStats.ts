import type { StatKey } from '@/store/types';

export interface MatchStat {
  key: StatKey;
  label: string;
  aVal: number;
  bVal: number;
  isPercent: boolean;
}

function hashMatchId(matchId: string): number {
  let hash = 0;
  for (let i = 0; i < matchId.length; i++) {
    hash += matchId.charCodeAt(i);
  }
  return hash;
}

function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed + index) * 10000;
  return x - Math.floor(x);
}

function randInRange(seed: number, index: number, min: number, max: number): number {
  return Math.floor(seededRandom(seed, index) * (max - min + 1)) + min;
}

export function generateMatchStats(
  matchId: string,
  aScore: number,
  bScore: number,
): MatchStat[] {
  const seed = hashMatchId(matchId);

  const isDraw = aScore === bScore;
  const aWins = aScore > bScore;

  // 1. Possession
  let aPossession: number;
  if (isDraw) {
    const base = randInRange(seed, 0, 48, 52);
    aPossession = base;
  } else {
    const winnerPoss = randInRange(seed, 0, 50, 65);
    aPossession = aWins ? winnerPoss : 100 - winnerPoss;
  }
  const bPossession = 100 - aPossession;

  // 2. Shots
  let aShots: number;
  let bShots: number;
  if (isDraw) {
    aShots = randInRange(seed, 1, 6, 14);
    bShots = randInRange(seed, 2, 6, 14);
  } else if (aWins) {
    aShots = randInRange(seed, 1, 8, 15);
    bShots = randInRange(seed, 2, 4, 12);
  } else {
    aShots = randInRange(seed, 1, 4, 12);
    bShots = randInRange(seed, 2, 8, 15);
  }

  // 3. Shots on target
  const aShotPct = randInRange(seed, 3, 30, 70) / 100;
  const bShotPct = randInRange(seed, 4, 30, 70) / 100;
  let aShotsOnTarget = Math.max(aScore, Math.round(aShots * aShotPct));
  let bShotsOnTarget = Math.max(bScore, Math.round(bShots * bShotPct));
  // Winner should have more shots on target when not a draw
  if (!isDraw) {
    if (aWins && aShotsOnTarget <= bShotsOnTarget) {
      aShotsOnTarget = bShotsOnTarget + randInRange(seed, 5, 1, 3);
    } else if (!aWins && bShotsOnTarget <= aShotsOnTarget) {
      bShotsOnTarget = aShotsOnTarget + randInRange(seed, 5, 1, 3);
    }
  }
  aShotsOnTarget = Math.min(aShotsOnTarget, aShots);
  bShotsOnTarget = Math.min(bShotsOnTarget, bShots);

  // 4. Pass accuracy (%)
  let aPassAccuracy: number;
  let bPassAccuracy: number;
  if (isDraw) {
    aPassAccuracy = randInRange(seed, 6, 70, 85);
    bPassAccuracy = randInRange(seed, 7, 70, 85);
  } else if (aWins) {
    aPassAccuracy = randInRange(seed, 6, 75, 88);
    bPassAccuracy = randInRange(seed, 7, 68, 82);
  } else {
    aPassAccuracy = randInRange(seed, 6, 68, 82);
    bPassAccuracy = randInRange(seed, 7, 75, 88);
  }

  // 5. Passes
  let aPasses: number;
  let bPasses: number;
  if (isDraw) {
    aPasses = randInRange(seed, 8, 240, 360);
    bPasses = randInRange(seed, 9, 240, 360);
  } else if (aWins) {
    aPasses = randInRange(seed, 8, 280, 380);
    bPasses = randInRange(seed, 9, 230, 320);
  } else {
    aPasses = randInRange(seed, 8, 230, 320);
    bPasses = randInRange(seed, 9, 280, 380);
  }

  // 6. Tackles
  const aTackles = randInRange(seed, 10, 15, 30);
  const bTackles = randInRange(seed, 11, 15, 30);

  // 7. Fouls
  const aFouls = randInRange(seed, 12, 8, 18);
  const bFouls = randInRange(seed, 13, 8, 18);

  // 8. Corners
  let aCorners: number;
  let bCorners: number;
  if (isDraw) {
    aCorners = randInRange(seed, 14, 3, 9);
    bCorners = randInRange(seed, 15, 3, 9);
  } else if (aWins) {
    aCorners = randInRange(seed, 14, 5, 10);
    bCorners = randInRange(seed, 15, 3, 8);
  } else {
    aCorners = randInRange(seed, 14, 3, 8);
    bCorners = randInRange(seed, 15, 5, 10);
  }

  // 9. Offsides
  const aOffsides = randInRange(seed, 16, 0, 4);
  const bOffsides = randInRange(seed, 17, 0, 4);

  return [
    {
      key: 'possession',
      label: 'Possession',
      aVal: aPossession,
      bVal: bPossession,
      isPercent: true,
    },
    {
      key: 'shots',
      label: 'Shots',
      aVal: aShots,
      bVal: bShots,
      isPercent: false,
    },
    {
      key: 'shotsOnTarget',
      label: 'Shots on Target',
      aVal: aShotsOnTarget,
      bVal: bShotsOnTarget,
      isPercent: false,
    },
    {
      key: 'passAccuracy',
      label: 'Pass Accuracy',
      aVal: aPassAccuracy,
      bVal: bPassAccuracy,
      isPercent: true,
    },
    {
      key: 'passes',
      label: 'Passes',
      aVal: aPasses,
      bVal: bPasses,
      isPercent: false,
    },
    {
      key: 'tackles',
      label: 'Tackles',
      aVal: aTackles,
      bVal: bTackles,
      isPercent: false,
    },
    {
      key: 'fouls',
      label: 'Fouls',
      aVal: aFouls,
      bVal: bFouls,
      isPercent: false,
    },
    {
      key: 'corners',
      label: 'Corners',
      aVal: aCorners,
      bVal: bCorners,
      isPercent: false,
    },
    {
      key: 'offsides',
      label: 'Offsides',
      aVal: aOffsides,
      bVal: bOffsides,
      isPercent: false,
    },
  ];
}
