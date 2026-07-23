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
    statusBarFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.bg.surface,
    },
    // Header
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
      backgroundColor: colors.bg.surface,
    },
    backBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    chevron: {
      fontFamily: FontFamily.display,
      fontSize: FontSize['2xl'],
      color: colors.text.secondary,
      lineHeight: 28,
      marginTop: -2,
    },
    headerTitleWrap: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize['3xl'],
      color: colors.text.primary,
      letterSpacing: 0.5,
      lineHeight: 34,
      textAlign: 'center',
    },
    headerRight: {
      width: 36,
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
