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
    tourGroup: {
      marginBottom: Spacing.lg,
    },
    tourLabel: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      color: colors.text.muted,
      letterSpacing: 1,
      marginBottom: Spacing.sm,
    },

    // Match detail scoreline hero (mirrors app/match/[id].tsx's scoreHero
    // markup/styles, minus the swap-sides control — this view is read-only)
    scoreHero: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: colors.accent.greenBorder,
      padding: Spacing.xl,
      marginTop: Spacing.lg,
      gap: Spacing.sm,
    },
    heroSide: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    heroName: {
      fontFamily: FontFamily.display,
      fontSize: FontSize.base,
      color: colors.text.primary,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    heroNameLoser: {
      color: colors.text.muted,
    },
    heroCenter: {
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: Spacing.sm,
    },
    heroScoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    heroScoreNum: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize['5xl'],
      color: colors.text.secondary,
      lineHeight: FontSize['5xl'] + 8,
      minWidth: 36,
      textAlign: 'center',
    },
    heroColon: {
      fontFamily: FontFamily.displayBold,
      fontSize: 30,
      color: colors.text.placeholder,
      lineHeight: 40,
    },
    heroResult: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.accent.green,
      textAlign: 'center',
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
