import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    sheet: {
      backgroundColor: colors.bg.sheet,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing['2xl'],
    },
    title: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize['2xl'],
      color: colors.text.primary,
      letterSpacing: 0.5,
      marginBottom: 3,
    },
    subtitle: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.muted,
      marginBottom: Spacing.xl,
    },
    playersLabel: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      color: colors.text.muted,
      letterSpacing: 0.8,
      marginTop: Spacing.md,
      marginBottom: Spacing.sm,
    },
    playersList: {
      maxHeight: 280,
      marginBottom: Spacing.sm,
    },
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: Radius.md,
      gap: Spacing.md,
      marginBottom: 4,
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    playerRowSelected: {
      borderColor: colors.accent.greenBorder,
      backgroundColor: colors.accent.greenSubtle,
    },
    playerRowInfo: {
      flex: 1,
      gap: 1,
    },
    playerRowName: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.sm,
      color: colors.text.primary,
    },
    playerRowNick: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: colors.border.strong,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    checkboxOn: {
      backgroundColor: colors.accent.green,
      borderColor: colors.accent.green,
    },
    checkmark: {
      fontFamily: FontFamily.bodyBold,
      fontSize: 13,
      color: colors.accent.greenDark,
      lineHeight: 16,
    },
    minPlayersHint: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.accent.red,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    actions: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.sm,
    },
    cancelBtn: {
      flex: 1,
      backgroundColor: colors.bg.elevated,
      borderRadius: Radius.md,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    cancelText: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.base,
      color: colors.text.muted,
      letterSpacing: 0.4,
    },
    startBtn: {
      flex: 2,
      backgroundColor: colors.accent.green,
      borderRadius: Radius.md,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      shadowColor: colors.accent.green,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
    },
    startBtnDisabled: {
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.medium,
      shadowOpacity: 0,
      elevation: 0,
    },
    startText: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.base,
      color: colors.accent.greenDark,
      letterSpacing: 0.6,
    },
    startTextDisabled: {
      color: colors.text.ghost,
    },
  });
