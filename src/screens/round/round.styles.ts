import { Platform, StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

// ---- Main screen styles ----
export const makeStyles = (colors: AppColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
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
    gap: 1,
  },
  headerTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    width: 80,
    justifyContent: 'flex-end',
  },
  statsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBtnIcon: {
    fontSize: 14,
  },
  finishBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: colors.accent.yellow,
    backgroundColor: 'rgba(246,195,80,0.12)',
  },
  finishBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.sm,
    color: colors.accent.yellow,
    letterSpacing: 0.5,
  },
  toggleContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  cardsContainer: {
    marginBottom: Spacing.lg,
  },
  matchesSection: {
    gap: Spacing.md,
  },
  matchesList: {
    gap: 0,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 20,
    left: Spacing.xl,
    right: Spacing.xl,
  },
  fabBtn: {
    backgroundColor: colors.accent.green,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    shadowColor: colors.accent.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.lg,
    color: colors.accent.greenDark,
    letterSpacing: 0.8,
  },
});

// ---- Sheet styles ----
export const makeSheetStyles = (colors: AppColors) => StyleSheet.create({
  sheet: {
    backgroundColor: colors.bg.sheet,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: Spacing.lg,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.bg.elevated,
  },
  progressSegmentFilled: {
    backgroundColor: colors.accent.green,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  stepTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['2xl'],
    color: colors.text.primary,
    letterSpacing: 0.4,
    flex: 1,
  },
  stepIndicator: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.text.muted,
    letterSpacing: 0.8,
  },
  contentScroll: {
    maxHeight: 420,
  },
  contentScrollPad: {
    paddingBottom: Spacing.xl,
  },
  stepContent: {
    gap: Spacing.md,
  },
  stepHint: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.muted,
    letterSpacing: 0.3,
  },
  playerChips: {
    gap: Spacing.sm,
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  playerChipHome: {
    backgroundColor: colors.accent.greenSubtle,
    borderColor: colors.accent.greenBorder,
  },
  playerChipAway: {
    backgroundColor: colors.accent.blueSubtle,
    borderColor: colors.accent.blue + '44',
  },
  playerChipName: {
    flex: 1,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.text.muted,
  },
  homeLabel: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    backgroundColor: colors.accent.greenSubtle,
  },
  homeLabelText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.accent.green,
    letterSpacing: 0.5,
  },
  awayLabel: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    backgroundColor: colors.accent.blueSubtle,
  },
  awayLabelText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.accent.blue,
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  scoreDivider: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  scoreDividerText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    color: colors.text.ghost,
  },
  resultPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.xs,
  },
  resultLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  mediaScroll: {
    flexGrow: 0,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  addMediaBtn: {
    width: 90,
    height: 118,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border.strong,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  addMediaIcon: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize['2xl'],
    color: colors.text.muted,
    lineHeight: 28,
  },
  addMediaText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  ocrStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  ocrStatusText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.accent.blue,
  },
  ocrFoundText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.accent.green,
  },
  ocrError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  ocrErrorText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.accent.red,
    flex: 1,
  },
  ocrRetryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: colors.accent.blue,
  },
  ocrRetryText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.accent.blue,
  },
  ocrSkipText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.muted,
  },
  ocrSkippedText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.placeholder,
  },
  commentInput: {
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: Spacing.lg,
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: colors.text.primary,
    minHeight: 120,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  backActionBtn: {
    flex: 1,
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  backActionText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: colors.text.muted,
    letterSpacing: 0.5,
  },
  nextBtn: {
    flex: 2,
    backgroundColor: colors.accent.green,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  nextBtnDisabled: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  nextBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: colors.accent.greenDark,
    letterSpacing: 0.5,
  },
  nextBtnTextDisabled: {
    color: colors.text.ghost,
  },
});

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
