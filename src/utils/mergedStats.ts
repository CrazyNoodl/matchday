import type { Match, StatConfidence } from '@/store/types';
import { generateMatchStats } from '@/utils/matchStats';
import { STAT_DEF_MAP, STAT_DEFINITIONS } from '@/utils/statDefinitions';

export type MergedStat = {
  key: string;
  labelKey: string;
  label: string;
  aVal: number;
  bVal: number;
  isPercent: boolean;
  /** Step increment for the edit-sheet +/- controls (0.1 for xG, 1 otherwise). */
  step: number;
  /** True when this param wasn't recognized/set — aVal/bVal are placeholders, render as N/A. */
  isNA: boolean;
  confidence?: StatConfidence;
};

/**
 * Builds the fixed, always-all-23-params list (STAT_DEFINITIONS order) used by
 * both the read-only match screen and the edit sheet — missing params show as
 * isNA rather than being hidden, so it's clear at a glance what still needs a
 * manual value. OCR-extracted keys outside the known 23 are appended at the end.
 */
export function buildMergedStats(match: Match, hasStatsOverride: boolean): MergedStat[] {
  if (hasStatsOverride && match.statsOverride) {
    const override = match.statsOverride;
    const ordered: MergedStat[] = [];

    for (const def of STAT_DEFINITIONS) {
      const entry = override[def.key];
      ordered.push({
        key: def.key,
        labelKey: def.labelKey,
        label: def.labelKey,
        aVal: entry?.a ?? 0,
        bVal: entry?.b ?? 0,
        isPercent: def.isPercent,
        step: def.step ?? 1,
        isNA: entry === undefined,
        confidence: entry?.confidence,
      });
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
          step: 1,
          isNA: false,
          confidence: override[key].confidence,
        });
      }
    }

    return ordered;
  }

  return generateMatchStats(match.id, match.aScore, match.bScore).map((s) => ({
    ...s,
    labelKey: STAT_DEF_MAP[s.key]?.labelKey ?? '',
    label: s.label,
    step: STAT_DEF_MAP[s.key]?.step ?? 1,
    isNA: false,
  }));
}
