// Long-press repeat step for stat +/- buttons in the edit-stats sheet: escalates
// 1 → 5 → 10 regardless of the stat's own tap step, so holding fixes a big OCR
// misread (e.g. 4 instead of 94) fast. A quick tap (no hold) still applies the
// stat's own step (e.g. 0.1 for xG) via the caller, so decimals stay reachable.
export function getHoldStep(tickCount: number): number {
  if (tickCount < 4) return 1;
  if (tickCount < 8) return 5;
  return 10;
}

export const HOLD_START_DELAY_MS = 350;
export const HOLD_REPEAT_INTERVAL_MS = 120;
