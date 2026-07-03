export { Colors, DarkColors, LightColors, colorsByScheme } from './colors';
export type { ColorScheme, AppColors } from './colors';
export { FontFamily, FontSize } from './typography';
export { Radius, Spacing } from './spacing';
export { ThemeContext, ThemeProvider, useColors } from './ThemeContext';

import { AppColors } from './colors';

export const makeSectionLabel = (colors: AppColors) => ({
  fontSize: 11,
  fontWeight: '700' as const,
  letterSpacing: 1.2,
  color: colors.text.placeholder,
  textTransform: 'uppercase' as const,
});

// Legacy default (dark) — used where dynamic theming isn't needed
import { DarkColors } from './colors';
export const sectionLabel = makeSectionLabel(DarkColors);
