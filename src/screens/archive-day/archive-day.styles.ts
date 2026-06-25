import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) => StyleSheet.create({
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

  // ---- Share button ----
  shareBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    backgroundColor: colors.accent.greenSubtle,
    borderWidth: 1,
    borderColor: colors.accent.greenBorder,
  },
  shareBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: colors.accent.green,
    letterSpacing: 0.5,
  },

  // ---- Day Winner Banner ----
  winnerCard: {
    alignItems: 'center',
    backgroundColor: '#0c0e10',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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

  // ---- Match list ----
  matchList: {
    gap: 0,
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

  // ---- Round date ----
  dateRow: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    alignItems: 'flex-start',
  },
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
  dateSheetTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['2xl'],
    color: colors.text.primary,
    letterSpacing: 0.5,
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
