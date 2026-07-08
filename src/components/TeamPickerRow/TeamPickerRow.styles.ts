import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    picker: {
      flexGrow: 0,
    },
    item: {
      alignItems: 'center',
      backgroundColor: colors.bg.elevated,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: Spacing.md,
      marginRight: Spacing.sm,
      gap: Spacing.xs,
      width: 72,
    },
    name: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      color: colors.text.secondary,
      textAlign: 'center',
    },
  });
