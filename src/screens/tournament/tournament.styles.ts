import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  // ---- Header ----
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.bg.surface,
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
    gap: 2,
    paddingHorizontal: Spacing.sm,
  },
  headerTitle: {
    fontFamily: FontFamily.display,
    fontSize: 21,
    color: colors.text.primary,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
  },
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

  // ---- Scroll ----
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: 40,
  },

  sectionLabel: {
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },

  // ---- Current Match Day Card ----
  matchDayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.accent.greenBorder,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  matchDayLeft: {
    flex: 1,
    gap: Spacing.xs,
  },
  roundBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent.greenSubtle,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: colors.accent.greenBorder,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginBottom: Spacing.xs,
  },
  roundBadgeText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xs,
    color: colors.accent.green,
    letterSpacing: 0.5,
  },
  inProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  inProgressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.green,
  },
  inProgressText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.accent.green,
    letterSpacing: 0.8,
  },
  matchDayCount: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.md,
    color: colors.text.primary,
  },
  matchDayLeader: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.muted,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  playBtnIcon: {
    fontSize: 16,
    color: colors.accent.greenDark,
    marginLeft: 2,
  },

  // ---- Played Rounds ----
  emptyRounds: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyRoundsText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: colors.text.muted,
  },
  // ---- Bottom CTA ----
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg.base,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  ctaBtn: {
    backgroundColor: colors.accent.green,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    shadowColor: colors.accent.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.lg,
    color: colors.accent.greenDark,
    letterSpacing: 0.6,
  },
});

// ---------------------------------------------------------------------------
// Sheet styles
// ---------------------------------------------------------------------------

export const makeSheetStyles = (colors: AppColors) => StyleSheet.create({
  sheet: {
    backgroundColor: colors.bg.sheet,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  sheetTitleBlock: {
    gap: 3,
    flex: 1,
  },
  sheetTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['2xl'],
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  sheetSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.muted,
  },
  doneBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    backgroundColor: colors.accent.greenSubtle,
    borderWidth: 1,
    borderColor: colors.accent.greenBorder,
  },
  doneBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.accent.green,
  },
  rows: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowIconText: {
    fontSize: 16,
    color: colors.accent.blue,
  },
  rowLabelBlock: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.text.primary,
    flex: 1,
  },
  rowSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },
  rowChevron: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    color: colors.text.muted,
    lineHeight: 24,
  },
});

// ---------------------------------------------------------------------------
// Input sheet styles (rename modal)
// ---------------------------------------------------------------------------

export const makeInputStyles = (colors: AppColors) => StyleSheet.create({
  input: {
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
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
  saveBtn: {
    flex: 2,
    backgroundColor: colors.accent.green,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  saveText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: colors.accent.greenDark,
    letterSpacing: 0.4,
  },
  saveTextDisabled: {
    color: colors.text.ghost,
  },
});

// ---------------------------------------------------------------------------
// Dialog styles (close tournament)
// ---------------------------------------------------------------------------

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
    borderColor: colors.accent.goldBorder,
    padding: Spacing['2xl'],
    width: '100%',
    gap: Spacing.md,
    alignItems: 'center',
  },
  dialogIcon: {
    fontSize: 40,
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
    marginBottom: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
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
  archiveBtn: {
    flex: 1,
    backgroundColor: colors.accent.gold,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  archiveBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: '#1a1200',
    letterSpacing: 0.3,
  },
});

