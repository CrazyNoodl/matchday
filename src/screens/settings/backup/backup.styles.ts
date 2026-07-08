import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.xl,
  },

  // Info card
  infoCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  infoTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.text.primary,
  },
  infoDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.muted,
    lineHeight: 18,
  },
  infoNote: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.placeholder,
    fontStyle: 'italic',
    lineHeight: 16,
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

  // Demo-mode guard
  warnCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: 'rgba(246,195,80,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(246,195,80,0.22)',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  warnIcon: { fontSize: 18 },
  warnDesc: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.accent.yellow,
    lineHeight: 18,
  },

  // Status banners
  statusCardOk: {
    backgroundColor: colors.accent.greenSubtle,
    borderWidth: 1,
    borderColor: colors.accent.greenBorder,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  statusCardErr: {
    backgroundColor: 'rgba(255,93,90,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,93,90,0.25)',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  statusTextOk: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.accent.green,
  },
  statusTextErr: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.accent.red,
  },

  // Buttons
  primaryBtn: {
    backgroundColor: colors.accent.green,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    backgroundColor: colors.bg.elevated,
  },
  primaryBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.md,
    color: colors.bg.base,
    letterSpacing: 1,
  },
  primaryBtnTextDisabled: {
    color: colors.text.ghost,
  },
  secondaryBtn: {
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  secondaryBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.text.primary,
  },
  secondaryBtnTextDisabled: {
    color: colors.text.ghost,
  },
  pushBtn: {
    backgroundColor: colors.accent.blue,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  pushBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.md,
    color: '#fff',
    letterSpacing: 1,
  },

  // Blocking overlay shown while a restore (local apply + cloud push) is in flight
  blockingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    zIndex: 50,
  },
  blockingOverlayText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: '#fff',
  },

  // Backup list
  emptyList: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.ghost,
    paddingVertical: Spacing.md,
    textAlign: 'center',
  },
  backupCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: Spacing.xs,
  },
  backupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  backupRowLast: {
    borderBottomWidth: 0,
  },
  backupInfo: { flex: 1, gap: 2 },
  backupDate: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.text.primary,
  },
  backupSize: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },
  backupActions: { flexDirection: 'row', gap: Spacing.sm },
  backupActionBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.elevated,
  },
  backupActionIcon: { fontSize: 16 },
});
