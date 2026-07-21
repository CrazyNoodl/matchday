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
      paddingTop: Spacing.md,
      paddingBottom: Spacing['3xl'],
      gap: Spacing.lg,
    },

    // Hero: two avatars + "vs"
    hero: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.lg,
    },
    heroSide: {
      flex: 1,
      alignItems: 'center',
      gap: Spacing.xs,
    },
    heroName: {
      fontFamily: FontFamily.display,
      fontSize: FontSize.base,
      color: colors.text.primary,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    heroVs: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.xl,
      color: colors.text.placeholder,
      paddingHorizontal: Spacing.sm,
    },

    // Sections
    sectionLabel: {
      marginBottom: Spacing.xs,
    },
    section: {
      gap: Spacing.sm,
    },

    // Tiles
    tilesRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    tile: {
      flex: 1,
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: Spacing.lg,
      gap: Spacing.xs,
    },
    tileTouchable: {
      flex: 1,
    },
    tileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    tileLabel: {
      fontFamily: FontFamily.bodyMedium,
      fontSize: FontSize.sm,
      color: colors.text.secondary,
    },
    tileValue: {
      fontFamily: FontFamily.display,
      fontSize: FontSize['2xl'],
      color: colors.text.primary,
    },
    tileSub: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.muted,
    },
    groupLabel: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      color: colors.text.placeholder,
      letterSpacing: 0.8,
    },

    // Match stats — one row: badge · logo · name/date (left) · stat label · mirrored (right)
    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
    },
    statSide: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    statSideRight: {
      flexDirection: 'row-reverse',
    },
    statBadge: {
      width: 28,
      height: 28,
      borderRadius: Radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bg.elevated,
      flexShrink: 0,
    },
    statBadgeHighlight: {
      backgroundColor: colors.accent.greenSubtle,
    },
    statBadgeText: {
      fontFamily: FontFamily.display,
      fontSize: FontSize.sm,
      color: colors.text.muted,
    },
    statBadgeTextHighlight: {
      color: colors.accent.green,
    },
    statInfo: {
      gap: 2,
      flexShrink: 1,
    },
    statInfoRight: {
      gap: 2,
      flexShrink: 1,
      alignItems: 'flex-end',
    },
    statName: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.sm,
      color: colors.text.primary,
    },
    statDate: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },
    statCenter: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xs,
      maxWidth: 90,
    },
    statLabel: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      lineHeight: 12,
      color: colors.text.placeholder,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      textAlign: 'center',
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
    },
  });
