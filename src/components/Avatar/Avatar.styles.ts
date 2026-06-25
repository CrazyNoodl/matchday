import { StyleSheet } from 'react-native';
import { FontFamily, FontSize } from '../../theme/typography';
import type { AvatarSize } from './Avatar';

export const SIZES: Record<AvatarSize, number> = {
  sm: 30,
  md: 40,
  lg: 44,
  xl: 50,
};

export const RADII: Record<AvatarSize, number> = {
  sm: 9,
  md: 12,
  lg: 13,
  xl: 15,
};

export const FONT_SIZES: Record<AvatarSize, number> = {
  sm: FontSize.xs,
  md: FontSize.base,
  lg: FontSize.md,
  xl: FontSize.lg,
};

export const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  text: {
    fontFamily: FontFamily.bodySemiBold,
    textAlign: 'center',
  },
});
