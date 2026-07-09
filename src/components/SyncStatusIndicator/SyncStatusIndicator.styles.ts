import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      gap: Spacing.md,
      minHeight: 56,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: Radius.sm,
      backgroundColor: colors.bg.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconText: {
      fontSize: 18,
    },
    info: {
      flex: 1,
      gap: 2,
    },
    label: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.base,
      color: colors.text.primary,
    },
    sub: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },
    subError: {
      color: colors.accent.red,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
  });
