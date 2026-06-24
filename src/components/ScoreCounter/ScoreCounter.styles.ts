import { StyleSheet } from 'react-native';
import type { AppColors } from '../../theme';
import { FontFamily, FontSize } from '../../theme/typography';
import { Radius, Spacing } from '../../theme/spacing';

export const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  name: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: colors.text.primary,
    textAlign: 'center',
  },
  score: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.score,
    color: colors.accent.green,
    lineHeight: FontSize.score + 8,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xl,
    color: colors.text.primary,
    lineHeight: 28,
    textAlign: 'center',
  },
  btnTextDisabled: {
    color: colors.text.muted,
  },
});
