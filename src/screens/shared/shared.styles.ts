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
    dotsBtn: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    dotsIcon: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xl,
      color: colors.text.primary,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing['3xl'],
      gap: Spacing.lg,
    },
    sectionLabelRow: {
      marginTop: Spacing.sm,
    },

    // Winner banner
    winnerCard: {
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingVertical: Spacing.lg,
      gap: Spacing.xs,
    },
    winnerLabel: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.xs,
      color: colors.text.muted,
      letterSpacing: 1,
    },
    winnerName: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.xl,
      color: colors.text.primary,
    },

    // Compact match row on the round overview (style override passed to the
    // real MatchCard component) — tap navigates to the match detail screen.
    matchRowCard: {
      marginBottom: Spacing.sm,
    },

    // Match detail scoreline hero
    matchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    matchSide: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    matchSideRight: {
      justifyContent: 'flex-end',
    },
    matchName: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.sm,
      color: colors.text.primary,
      flexShrink: 1,
    },
    matchScore: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.lg,
      color: colors.text.primary,
      paddingHorizontal: Spacing.md,
    },
    matchNote: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.secondary,
      fontStyle: 'italic',
    },
    mediaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    statsGroup: {
      gap: Spacing.xs,
    },
  });
