import { StyleSheet } from 'react-native';
import type { AppColors } from '../../theme';
import { FontFamily, FontSize } from '../../theme/typography';
import { Radius, Spacing } from '../../theme/spacing';

export const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  message: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  cta: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  ctaText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
  },
});
