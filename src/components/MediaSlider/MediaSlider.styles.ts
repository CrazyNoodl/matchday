import { StyleSheet } from 'react-native';
import type { AppColors } from '../../theme';
import { Radius, Spacing } from '../../theme/spacing';

const SLIDE_HEIGHT = 240;

export const makeStyles = (colors: AppColors, slideWidth: number) => StyleSheet.create({
  slide: {
    width: slideWidth,
    height: SLIDE_HEIGHT,
  },
  slideImage: {
    width: slideWidth,
    height: SLIDE_HEIGHT,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: colors.border.medium,
  },
  dotActive: {
    backgroundColor: colors.accent.green,
    width: 16,
  },
});
