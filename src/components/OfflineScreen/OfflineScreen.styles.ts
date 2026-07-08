import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg.base,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 12,
    },
    emoji: {
      fontSize: 48,
      marginBottom: 8,
    },
    title: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.lg,
      color: colors.text.primary,
      textAlign: 'center',
    },
    sub: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.muted,
      textAlign: 'center',
    },
  });
