import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  labelBlock: {
    flex: 1,
    gap: 3,
  },
  label: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },
  track: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.medium,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  trackOn: {
    backgroundColor: colors.accent.green,
    borderColor: colors.accent.green,
  },
  knob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.text.muted,
    alignSelf: 'flex-start',
  },
  knobOn: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-end',
  },
});
