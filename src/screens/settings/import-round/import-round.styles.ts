import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.xl,
  },

  // Status
  warnCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: 'rgba(255,93,90,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,93,90,0.25)',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  warnIcon: { fontSize: 20 },
  warnText: { flex: 1, gap: 4 },
  warnTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.accent.red,
  },
  warnDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.muted,
    lineHeight: 17,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: colors.accent.greenSubtle,
    borderWidth: 1,
    borderColor: colors.accent.greenBorder,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  statusIcon: { fontSize: 14 },
  statusTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.accent.green,
  },
  statusDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },

  // Sections
  section: { gap: Spacing.sm },
  sectionHeader: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.text.placeholder,
    letterSpacing: 1.2,
    paddingLeft: Spacing.xs,
  },

  // Format hint
  hintCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  hintLine: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.secondary,
  },
  hintBold: {
    fontFamily: FontFamily.bodySemiBold,
    color: colors.text.primary,
  },
  hintCode: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.accent.blue,
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    overflow: 'hidden',
  },
  hintDivider: {
    height: 1,
    backgroundColor: colors.border.default,
  },
  hintNote: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.placeholder,
    fontStyle: 'italic',
    lineHeight: 16,
  },

  // Input
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: Spacing.xs,
  },
  clearBtn: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: colors.accent.red,
    letterSpacing: 0.8,
    paddingRight: Spacing.xs,
  },
  input: {
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: Spacing.lg,
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.primary,
    minHeight: 160,
    textAlignVertical: 'top',
    lineHeight: 20,
  },

  // Errors
  errorsCard: {
    backgroundColor: 'rgba(255,93,90,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,93,90,0.20)',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  errorsTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.accent.red,
  },
  errorLine: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
    lineHeight: 16,
  },

  // New players
  newPlayersCard: {
    backgroundColor: 'rgba(246,195,80,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(246,195,80,0.22)',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  newPlayersTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.accent.yellow,
  },
  newPlayerName: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.secondary,
  },

  // Unknown teams
  warnTeamCard: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  warnTeamTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.text.secondary,
  },
  warnTeamCode: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },

  // Match list
  matchesCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  matchesTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.accent.green,
    marginBottom: Spacing.xs,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  matchNum: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.sm,
    color: colors.text.ghost,
    width: 18,
    textAlign: 'right',
  },
  matchPlayer: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
  matchPlayerB: {
    textAlign: 'right',
  },
  matchTeam: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xs,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  matchScore: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.md,
    color: colors.accent.green,
    minWidth: 36,
    textAlign: 'center',
  },

  // Footer
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    backgroundColor: colors.bg.base,
  },
  importBtn: {
    backgroundColor: colors.accent.green,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  importBtnDisabled: {
    backgroundColor: colors.bg.elevated,
  },
  importBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.md,
    color: colors.bg.base,
    letterSpacing: 1,
  },
  importBtnTextDisabled: {
    color: colors.text.ghost,
  },
});
