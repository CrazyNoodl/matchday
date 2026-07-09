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

    tourCard: {
      backgroundColor: colors.bg.archive,
      borderRadius: Radius['3xl'],
      borderWidth: 1,
      borderColor: colors.border.medium,
      marginBottom: Spacing.md,
      overflow: 'hidden',
    },
    tourCardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 18,
      gap: Spacing.md,
    },

    fcIcon: {
      width: 52,
      height: 52,
      borderRadius: Radius.md,
      backgroundColor: colors.bg.surface,
      borderWidth: 1,
      borderColor: colors.border.strong,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    fcIconText: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.sm,
      color: colors.text.muted,
      letterSpacing: 0.5,
      lineHeight: 14,
    },
    fcIconYear: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.xl,
      color: colors.text.primary,
      lineHeight: 22,
    },

    tourTitleArea: {
      flex: 1,
      gap: 3,
      paddingTop: 2,
    },
    tourNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flexWrap: 'wrap',
    },
    tourName: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.lg,
      color: colors.text.primary,
      letterSpacing: 0.2,
      flexShrink: 1,
    },
    tourSubtitle: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },

    champRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 4,
      flexWrap: 'wrap',
    },
    champDiamond: {
      fontSize: 11,
      color: colors.accent.gold,
    },
    champAvatarSmall: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    champInitSmall: {
      fontFamily: FontFamily.bodyBold,
      fontSize: 8,
      color: colors.bg.base,
    },
    champNameText: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.xs,
      color: colors.text.secondary,
      flexShrink: 1,
    },
    champMeta: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },

    tourCardRight: {
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: Spacing.sm,
      paddingTop: 2,
      flexShrink: 0,
    },
    statsBtn: {
      borderWidth: 1,
      borderColor: colors.border.strong,
      borderRadius: Radius.sm,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statsBtnText: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.sm,
      color: colors.text.secondary,
    },
    chevron: {
      fontFamily: FontFamily.display,
      fontSize: FontSize.xl,
      color: colors.text.muted,
      transform: [{ rotate: '0deg' }],
      lineHeight: 22,
    },
    chevronExpanded: {
      transform: [{ rotate: '90deg' }],
    },

    roundsDivider: {
      height: 1,
      backgroundColor: colors.border.default,
      marginHorizontal: 18,
    },
    roundsList: {
      paddingBottom: Spacing.sm,
    },
    noRoundsRow: {
      paddingHorizontal: 18,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
    },
    noRoundsText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.muted,
    },

    emptyCard: {
      borderWidth: 1,
      borderColor: colors.border.medium,
      borderStyle: 'dashed',
      borderRadius: Radius['2xl'],
      paddingVertical: Spacing['3xl'],
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.lg,
    },
    emptyIcon: {
      fontSize: 32,
      marginBottom: 4,
    },
    emptyTitle: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.lg,
      color: colors.text.secondary,
      letterSpacing: 0.2,
    },
    emptySubtitle: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.muted,
      textAlign: 'center',
    },
  });
