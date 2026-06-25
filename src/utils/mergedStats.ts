import type { Match } from '@/store/types';
import { generateMatchStats } from '@/utils/matchStats';
import { STAT_DEF_MAP, STAT_DEFINITIONS } from '@/utils/statDefinitions';

export type MergedStat = {
  key: string;
  labelKey: string;
  label: string;
  aVal: number;
  bVal: number;
  isPercent: boolean;
};

export function buildMergedStats(match: Match, hasStatsOverride: boolean): MergedStat[] {
  if (hasStatsOverride && match.statsOverride) {
    const override = match.statsOverride;
    const ordered: MergedStat[] = [];

    for (const def of STAT_DEFINITIONS) {
      if (override[def.key] !== undefined) {
        ordered.push({
          key: def.key,
          labelKey: def.labelKey,
          label: def.labelKey,
          aVal: override[def.key].a,
          bVal: override[def.key].b,
          isPercent: def.isPercent,
        });
      }
    }

    for (const key of Object.keys(override)) {
      if (!STAT_DEF_MAP[key]) {
        ordered.push({
          key,
          labelKey: '',
          label: key,
          aVal: override[key].a,
          bVal: override[key].b,
          isPercent: false,
        });
      }
    }

    return ordered;
  }

  return generateMatchStats(match.id, match.aScore, match.bScore).map((s) => ({
    ...s,
    labelKey: STAT_DEF_MAP[s.key]?.labelKey ?? '',
    label: s.label,
  }));
}
