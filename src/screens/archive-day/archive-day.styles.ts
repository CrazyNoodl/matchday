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
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xl,
      paddingBottom: 40,
    },

    // ---- Header ----
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backChevron: {
      fontFamily: FontFamily.display,
      fontSize: FontSize['2xl'],
      color: colors.text.secondary,
      lineHeight: 28,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
      gap: Spacing.xs,
    },
    headerTitle: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.xl,
      color: colors.text.primary,
      letterSpacing: 0.3,
    },

    // ---- Dots button ----
    dotsBtn: {
      width: 32,
      height: 32,
      borderRadius: Radius.sm,
      backgroundColor: colors.bg.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    dotsIcon: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.base,
      color: colors.text.secondary,
      letterSpacing: 2,
      lineHeight: 18,
    },

    // ---- Day Winner Banner ----
    winnerCard: {
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.medium,
      borderRadius: Radius.xl,
      paddingVertical: Spacing.xl,
      gap: Spacing.xs,
      marginBottom: Spacing.xl,
    },
    winnerLabel: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      color: colors.accent.gold,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    winnerMatchCount: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      color: colors.text.muted,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    winnerLogoWrap: {
      marginVertical: Spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    winnerCircle: {
      position: 'absolute',
      width: 104,
      height: 104,
      borderRadius: 52,
    },
    winnerName: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.lg,
      color: colors.text.primary,
      letterSpacing: 0.2,
    },

    // ---- Section label ----
    sectionLabelRow: {
      marginBottom: Spacing.md,
    },
    sectionLabelRowTop: {
      marginTop: Spacing.xl,
    },

    // ---- Match list ----
    matchList: {
      gap: 0,
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
    matchBlock: {
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: colors.border.default,
      overflow: 'hidden',
    },
    matchCardInBlock: {
      borderRadius: 0,
      borderWidth: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
      marginBottom: 0,
    },
    matchCardInBlockLast: {
      borderRadius: 0,
      borderWidth: 0,
      marginBottom: 0,
    },

    // ---- Empty matches ----
    emptyMatches: {
      paddingVertical: Spacing['3xl'],
      alignItems: 'center',
    },
    emptyMatchesText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.muted,
    },

    // ---- Error fallback ----
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.base,
      color: colors.text.muted,
    },

    // ---- Round date (second line of the header) ----
    datePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.md,
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    datePillText: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.sm,
      color: colors.text.secondary,
    },
    datePillIcon: {
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },
    dateStatic: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.muted,
    },

    // ---- Edit date sheet ----
    dateSheet: {
      backgroundColor: colors.bg.sheet,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing['2xl'],
    },
    dateInputError: {
      borderColor: colors.accent.red,
    },
    dateErrorText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.accent.red,
      marginTop: -Spacing.sm,
      marginBottom: Spacing.md,
    },
  });
