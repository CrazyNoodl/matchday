import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

// ---- Dialog styles ----
export const makeDialogStyles = (colors: AppColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  dialog: {
    backgroundColor: colors.bg.surface,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border.medium,
    padding: Spacing['2xl'],
    width: '100%',
    gap: Spacing.md,
    alignItems: 'center',
  },
  dialogIcon: {
    fontSize: 36,
  },
  dialogTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['2xl'],
    color: colors.text.primary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  dialogDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  cancelText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.text.muted,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.accent.green,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: colors.accent.greenDark,
    letterSpacing: 0.3,
  },
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
export const makeWinnerStyles = (colors: AppColors) => StyleSheet.create({
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
