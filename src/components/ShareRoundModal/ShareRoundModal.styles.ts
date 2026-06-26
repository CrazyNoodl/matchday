import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const CARD_W = 320;

export const makeWinnerStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    width: CARD_W,
    backgroundColor: colors.bg.base,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: 30,
    left: CARD_W / 2 - 130,
    opacity: 0.12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  appName: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.sm,
    color: colors.text.placeholder,
    letterSpacing: 2.5,
  },
  topDate: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.placeholder,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 28,
    gap: Spacing.md,
  },
  heroLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.accent.gold,
    letterSpacing: 2,
  },
  heroMatchCount: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: colors.text.placeholder,
    letterSpacing: 1,
    marginTop: -Spacing.sm,
  },
  avatarRing: {
    padding: 5,
    borderRadius: 29,
    marginVertical: Spacing.sm,
  },
  drawCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.bg.elevated,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawCircleText: {
    fontFamily: FontFamily.display,
    fontSize: FontSize['2xl'],
    color: colors.text.muted,
  },
  heroName: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['3xl'],
    color: colors.text.primary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 28,
  },
  statValue: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.lg,
    color: colors.text.primary,
  },
  statGA: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.base,
    color: colors.text.muted,
  },
  statLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 8,
    color: colors.text.placeholder,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.text.placeholder,
    marginBottom: 10,
  },
  statSep: {
    width: 1,
    height: 28,
    backgroundColor: colors.border.medium,
    marginHorizontal: 4,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: 3,
  },
  footerTour: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.sm,
    color: colors.text.secondary,
    letterSpacing: 1,
  },
  footerRound: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.placeholder,
  },
  matchesSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  matchesTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.text.placeholder,
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  matchRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  matchSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  matchSideRight: {
    justifyContent: 'flex-end',
  },
  matchName: {
    flexShrink: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },
  matchNameRight: {
    textAlign: 'right',
  },
  matchNameWin: {
    fontFamily: FontFamily.bodySemiBold,
    color: colors.text.primary,
  },
  matchScore: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.sm,
    color: colors.text.secondary,
    paddingHorizontal: Spacing.sm,
  },
  matchScoreWin: {
    color: colors.accent.green,
  },
  standingsSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  standingsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
  },
  standingsHeaderCell: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 9,
    color: colors.text.placeholder,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  standingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    marginHorizontal: -Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
  },
  standingsRowLeader: {
    backgroundColor: colors.accent.greenSubtle,
  },
  standingsPlayerCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  standingsName: {
    flexShrink: 1,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: colors.text.primary,
  },
  standingsNumCol: {
    width: 24,
    textAlign: 'center',
  },
  standingsCell: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.secondary,
  },
  standingsPts: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.sm,
    color: colors.accent.green,
  },
});

export const makeModalStyles = (colors: AppColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  title: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    color: colors.text.primary,
    letterSpacing: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.lg,
    color: colors.text.muted,
  },
  previewScroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: colors.bg.base,
  },
  cardWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  optionLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveBtn: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  shareBtn: {
    backgroundColor: colors.accent.green,
  },
  actionText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.text.primary,
  },
  saveMsg: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  saveMsgOk: {
    color: colors.accent.green,
  },
  saveMsgErr: {
    color: colors.accent.red,
  },
});
