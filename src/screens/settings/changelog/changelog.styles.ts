import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    scrollContent: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing['3xl'],
      gap: Spacing.lg,
    },
    emptyText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.muted,
      textAlign: 'center',
      marginTop: Spacing['2xl'],
    },
    card: {
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    versionRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    versionText: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.xl,
      color: colors.text.primary,
      letterSpacing: 0.3,
    },
    dateText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },
    group: {
      gap: 4,
    },
    groupLabel: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      letterSpacing: 1,
    },
    itemRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    bullet: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.sm,
      lineHeight: 19,
    },
    itemText: {
      flex: 1,
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.secondary,
      lineHeight: 19,
    },
  });
