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

    // H2H card
    h2hCard: {
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    h2hTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    h2hPlayerLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    h2hPlayerRight: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: Spacing.sm,
    },
    h2hPlayerName: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.base,
      color: colors.text.primary,
      flexShrink: 1,
    },
    h2hGamesWrap: {
      paddingHorizontal: Spacing.sm,
    },
    h2hGamesText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
      textAlign: 'center',
    },
    h2hScoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    h2hWinsCount: {
      fontFamily: FontFamily.display,
      fontSize: FontSize['2xl'],
      lineHeight: 28,
    },
    h2hDrawsLabel: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.muted,
      flex: 1,
      textAlign: 'center',
    },
    h2hBarContainer: {
      flexDirection: 'row',
      height: 6,
      borderRadius: Radius.full,
      overflow: 'hidden',
      alignItems: 'center',
    },
    h2hBarSegment: {
      height: 6,
    },
    h2hBarGap: {
      width: 3,
      height: 6,
      backgroundColor: colors.bg.base,
    },
    h2hGoals: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.muted,
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
