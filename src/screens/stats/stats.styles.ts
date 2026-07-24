import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },

    // Tab pills
    tabRow: {
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    },

    // Scroll
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: Spacing['3xl'],
    },

    // Tab content
    tabContent: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      gap: Spacing.md,
    },
    sectionLabel: {
      marginBottom: Spacing.xs,
    },

    // Ranking card
    // Stat tiles
    tilesRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.sm,
    },
    statTile: {
      flex: 1,
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: Spacing.lg,
      gap: Spacing.xs,
      alignItems: 'flex-start',
    },
    statTileLabel: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      color: colors.text.placeholder,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    statTileValue: {
      fontFamily: FontFamily.display,
      fontSize: FontSize['2xl'],
      color: colors.text.primary,
    },
    statTileValueGreen: {
      color: colors.accent.green,
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
