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
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing['3xl'],
      gap: Spacing.md,
    },

    // Empty
    emptyWrap: {
      paddingVertical: Spacing['2xl'],
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.base,
      color: colors.text.placeholder,
      textAlign: 'center',
    },

    // Records tab — one row per stat: label on the left, record holder on the right
    recordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      gap: Spacing.sm,
    },
    recordLabel: {
      flex: 1,
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      color: colors.text.placeholder,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    recordHolder: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flexShrink: 0,
    },
    recordBadge: {
      minWidth: 28,
      height: 28,
      paddingHorizontal: Spacing.xs,
      borderRadius: Radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent.greenSubtle,
    },
    recordBadgeText: {
      fontFamily: FontFamily.display,
      fontSize: FontSize.sm,
      color: colors.accent.green,
    },
    recordName: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.sm,
      color: colors.text.primary,
      maxWidth: 90,
    },

    // Comparison tab — one card per stat, one bar row per player
    compareGroup: {
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    compareGroupHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    compareGroupLabel: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      color: colors.text.placeholder,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    compareGroupGames: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },
    compareRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    compareName: {
      width: 64,
      fontFamily: FontFamily.bodyMedium,
      fontSize: FontSize.xs,
      color: colors.text.secondary,
    },
    compareBarTrack: {
      flex: 1,
      height: 10,
      borderRadius: Radius.full,
      backgroundColor: colors.bg.elevated,
      overflow: 'hidden',
    },
    compareBarFill: {
      height: '100%',
      borderRadius: Radius.full,
      backgroundColor: colors.border.strong,
    },
    compareBarFillTop: {
      backgroundColor: colors.accent.green,
    },
    compareValueWrap: {
      width: 48,
      alignItems: 'flex-end',
    },
    compareValue: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.sm,
      color: colors.text.primary,
    },
    compareValueTop: {
      color: colors.accent.green,
    },
    compareValueSub: {
      fontFamily: FontFamily.body,
      fontSize: 10,
      color: colors.text.muted,
    },
  });
