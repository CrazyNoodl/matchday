import type { KnownStatKey } from '@/store/types';

export interface StatDef {
  key: KnownStatKey;
  labelKey: string;
  isPercent: boolean;
  /** Edit-sheet stepper increment. Defaults to 1 when omitted. */
  step?: number;
}

export const STAT_DEFINITIONS: StatDef[] = [
  { key: 'possession',           labelKey: 'stats.possession',           isPercent: true  },
  { key: 'timeToRegain',         labelKey: 'stats.timeToRegain',         isPercent: false },
  { key: 'shots',                labelKey: 'stats.shots',                isPercent: false },
  { key: 'expectedGoals',        labelKey: 'stats.expectedGoals',        isPercent: false, step: 0.1 },
  { key: 'passes',               labelKey: 'stats.passes',               isPercent: false },
  { key: 'tackles',              labelKey: 'stats.tackles',              isPercent: false },
  { key: 'successfulTackles',    labelKey: 'stats.successfulTackles',    isPercent: false },
  { key: 'interceptions',        labelKey: 'stats.interceptions',        isPercent: false },
  { key: 'saves',                labelKey: 'stats.saves',                isPercent: false },
  { key: 'fouls',                labelKey: 'stats.fouls',                isPercent: false },
  { key: 'offsides',             labelKey: 'stats.offsides',             isPercent: false },
  { key: 'corners',              labelKey: 'stats.corners',              isPercent: false },
  { key: 'freekicks',            labelKey: 'stats.freekicks',            isPercent: false },
  { key: 'penaltyShots',         labelKey: 'stats.penaltyShots',         isPercent: false },
  { key: 'yellowCards',          labelKey: 'stats.yellowCards',          isPercent: false },
  { key: 'redCards',             labelKey: 'stats.redCards',             isPercent: false },
  { key: 'breaksThroughCenter',  labelKey: 'stats.breaksThroughCenter',  isPercent: false },
  { key: 'breaksThroughWing',    labelKey: 'stats.breaksThroughWing',    isPercent: false },
  { key: 'breaksThroughHigh',    labelKey: 'stats.breaksThroughHigh',    isPercent: false },
  { key: 'defBreakAttempts',     labelKey: 'stats.defBreakAttempts',     isPercent: false },
  { key: 'successfulDribbles',   labelKey: 'stats.successfulDribbles',   isPercent: true  },
  { key: 'shotAccuracy',         labelKey: 'stats.shotAccuracy',         isPercent: true  },
  { key: 'passAccuracy',         labelKey: 'stats.passAccuracy',         isPercent: true  },
];

export const STAT_DEF_MAP: Record<string, StatDef> = Object.fromEntries(
  STAT_DEFINITIONS.map((d) => [d.key, d]),
);
