export { Colors } from './colors';
export { FontFamily, FontSize } from './typography';
export { Radius, Spacing } from './spacing';

import { Colors } from './colors';

export const sectionLabel = {
  fontSize: 11,
  fontWeight: '700' as const,
  letterSpacing: 1.2,
  color: Colors.text.placeholder,
  textTransform: 'uppercase' as const,
};
