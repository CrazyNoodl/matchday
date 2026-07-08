import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';

export const makeSheetHeaderStyles = (colors: AppColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing['2xl'],
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
    },
    rowTitle: {
      fontFamily: FontFamily.display,
      fontSize: FontSize.xl,
      color: colors.text.primary,
      letterSpacing: 0.5,
    },
    rowSubtitle: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.muted,
      textAlign: 'right',
    },
    plainTitle: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize['2xl'],
      color: colors.text.primary,
      letterSpacing: 0.5,
    },
  });
