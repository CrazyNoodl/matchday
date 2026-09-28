import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    cardTile: {
      flex: 1,
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: Spacing.lg,
      gap: Spacing.xs,
      alignItems: 'flex-start',
    },
    cardLabel: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      color: colors.text.placeholder,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    cardValue: {
      fontFamily: FontFamily.display,
      fontSize: FontSize['2xl'],
      color: colors.text.primary,
    },
    compactTile: {
      flex: 1,
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      alignItems: 'center',
      gap: 3,
    },
    compactValue: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.xl,
      color: colors.text.primary,
      lineHeight: 24,
    },
    compactLabel: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      color: colors.text.muted,
      letterSpacing: 0.8,
    },
    valueHighlight: {
      color: colors.accent.green,
    },
  });
