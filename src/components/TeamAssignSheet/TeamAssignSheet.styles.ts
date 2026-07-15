import { Platform, StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    sheet: {
      backgroundColor: colors.bg.sheet,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      paddingBottom: Platform.OS === 'ios' ? 32 : Spacing['2xl'],
    },
    sheetTitle: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.lg,
      color: colors.text.primary,
      letterSpacing: 0.5,
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
  });
