import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

// ---- Dialog styles (NeedEqualDialog's player-list body only — the chrome
// itself now lives in ConfirmDialog) ----
export const makeDialogStyles = (colors: AppColors) =>
  StyleSheet.create({
    equalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      width: '100%',
      backgroundColor: colors.bg.elevated,
      borderRadius: Radius.sm,
      padding: Spacing.sm,
    },
    equalName: {
      flex: 1,
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.base,
      color: colors.text.primary,
    },
    equalCount: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.muted,
    },
  });

// ---- Winner styles ----
export const makeWinnerStyles = (colors: AppColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    content: {
      alignItems: 'center',
      gap: Spacing.lg,
      paddingHorizontal: Spacing['3xl'],
    },
    matchDayLabel: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.sm,
      color: colors.accent.gold,
      letterSpacing: 2,
    },
    trophyEmoji: {
      fontSize: 64,
    },
    winnerName: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize['4xl'],
      color: colors.accent.green,
      letterSpacing: 1,
      textAlign: 'center',
    },
    winnerRecord: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.base,
      color: colors.text.muted,
      letterSpacing: 0.5,
    },
    doneBtn: {
      backgroundColor: colors.accent.green,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing['3xl'],
      paddingVertical: Spacing.lg,
      marginTop: Spacing.md,
    },
    doneBtnText: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.lg,
      color: colors.accent.greenDark,
      letterSpacing: 0.8,
    },
  });
