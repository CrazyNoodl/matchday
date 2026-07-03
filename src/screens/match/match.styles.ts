import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: colors.text.muted,
  },

  // Header actions
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  editBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.text.secondary,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: colors.accent.redSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnIcon: {
    fontSize: 14,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 40,
  },

  // Score hero card
  scoreHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.accent.greenBorder,
    padding: Spacing.xl,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  heroSide: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  heroName: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.base,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  heroNameLoser: {
    color: colors.text.muted,
  },
  heroCenter: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
  },
  heroScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroScoreNum: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['5xl'],
    color: colors.text.secondary,
    lineHeight: FontSize['5xl'] + 8,
    minWidth: 36,
    textAlign: 'center',
  },
  heroColon: {
    fontFamily: FontFamily.displayBold,
    fontSize: 30,
    color: colors.text.placeholder,
    lineHeight: 40,
  },
  heroResult: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.accent.green,
    textAlign: 'center',
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sourceBadgeBlue: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: colors.accent.blueSubtle,
    borderWidth: 1,
    borderColor: 'rgba(106,166,255,0.25)',
  },
  sourceBadgeBlueText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.accent.blue,
  },
  sourceBadgeMuted: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  sourceBadgeMutedText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },
  editLink: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.accent.blue,
  },
  rescanLink: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.text.muted,
  },
  clearLink: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.accent.red,
  },
  statsMenuDots: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.lg,
    color: colors.text.muted,
    letterSpacing: 1,
    lineHeight: 20,
  },
  statsMenuDropdown: {
    position: 'absolute',
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    minWidth: 130,
    overflow: 'hidden',
  },
  statsMenuItem: {
    paddingVertical: 11,
    paddingHorizontal: Spacing.lg,
  },
  statsMenuItemText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.text.primary,
  },
  statsMenuSep: {
    height: 1,
    backgroundColor: colors.border.default,
  },
  swapBtnText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
    letterSpacing: 0.3,
  },
  sheetScrollFlex: {
    flex: 1,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.md,
  },

  // Stats card
  statsCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: Spacing.lg,
    gap: 2,
  },

  // Media
  mediaScroll: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  mediaThumbnail: {
    width: 90,
    height: 118,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.bg.media,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  mediaImage: {
    width: 90,
    height: 118,
  },
  mediaEmpty: {
    height: 80,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaEmptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.placeholder,
  },

  // Commentary
  noteCard: {
    backgroundColor: 'rgba(106,166,255,0.08)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(106,166,255,0.2)',
    padding: Spacing.lg,
  },
  noteText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  noNoteRow: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  noNoteText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.placeholder,
  },

  // Edit stats sheet
  sheet: {
    backgroundColor: colors.bg.sheet,
    paddingBottom: 32,
  },
  sheetFlex: {
    flex: 1,
    backgroundColor: colors.bg.sheet,
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  sheetTitle: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  sheetSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.muted,
    textAlign: 'right',
  },
  sheetScroll: {
    maxHeight: 360,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.md,
  },

  // Score edit sheet
  scoreEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['2xl'],
  },
  scoreEditSide: {
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  scoreEditName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
  },
  scoreEditControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  scoreEditVal: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['4xl'],
    color: colors.text.primary,
    minWidth: 48,
    textAlign: 'center',
  },
  scoreEditColon: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['3xl'],
    color: colors.text.placeholder,
    paddingHorizontal: Spacing.sm,
  },

  // Media viewer
  mediaViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaViewerImage: {
    width: '100%',
    height: '100%',
  },

  // Edit stat rows
  editStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    gap: Spacing.sm,
  },
  editSideControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  stepBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.md,
    color: colors.text.primary,
    lineHeight: 20,
  },
  editStatVal: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.md,
    color: colors.text.primary,
    minWidth: 28,
    textAlign: 'center',
  },
  editStatLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
    width: 70,
  },

  // Sheet buttons
  sheetButtons: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.text.secondary,
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: colors.accent.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.bg.base,
  },

  // Media section actions
  mediaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  importStatsBtn: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(106,166,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  importStatsBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.accent.blue,
  },

  // Import stats modal rows
  importStatRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  importStatRowLow: {
    backgroundColor: 'rgba(255,160,50,0.12)',
  },
  importStatRowMed: {
    backgroundColor: 'rgba(246,195,80,0.07)',
  },
  importConfStripe: {
    width: 3,
  },
  importStatContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  importErrorBody: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.xl,
  },
  importErrorText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Cross-blocked state: the OTHER button is busy (own button still shows its own spinner)
  btnCrossBlocked: {
    opacity: 0.35,
  },

  // Add media button
  addMediaBtn: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: colors.accent.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMediaBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.accent.green,
  },

  // Media delete button
  mediaDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaDeleteBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 14,
    color: '#fff',
    lineHeight: 16,
  },
  pendingUploadOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pendingUploadIcon: {
    fontSize: 20,
    color: colors.accent.yellow,
  },
  pendingUploadText: {
    fontFamily: FontFamily.body,
    fontSize: 9,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 6,
  },

  // Note edit
  noteEditBody: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  noteInput: {
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: Spacing.lg,
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: colors.text.primary,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  noteCharCount: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.placeholder,
    textAlign: 'right',
    marginTop: 4,
  },

  // Delete dialog
  delOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  delDialog: {
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border.strong,
    padding: Spacing['2xl'],
    width: '100%',
    alignItems: 'center',
    gap: Spacing.md,
  },
  delIconCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: colors.accent.redSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  delIconEmoji: {
    fontSize: 22,
  },
  delTitle: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    color: colors.text.primary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  delDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  delButtons: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.md,
    width: '100%',
  },
  delCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delCancelText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.text.secondary,
  },
  delConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: colors.accent.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delConfirmText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: '#fff',
  },
  dialogOverlay: {
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
  dialogTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  dialogDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: colors.text.muted,
    textAlign: 'center',
  },
  dialogActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  dialogCancel: {
    flex: 1,
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  dialogCancelText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.text.muted,
  },
  dialogConfirm: {
    flex: 1,
    backgroundColor: colors.accent.red,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  dialogConfirmText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: '#fff',
    letterSpacing: 0.3,
  },
});
