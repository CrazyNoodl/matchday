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
    paddingBottom: 40,
    gap: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.text.placeholder,
    letterSpacing: 1.2,
    paddingLeft: Spacing.xs,
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    minHeight: 56,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconText: {
    fontSize: 18,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.text.primary,
  },
  rowSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },
  chevron: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    color: colors.text.muted,
    lineHeight: 24,
  },
  accountCard: {
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  accountAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAvatarText: {
    fontSize: 26,
  },
  accountEmail: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.text.primary,
    maxWidth: '100%',
  },
  signOutBtn: {
    marginTop: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,93,90,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,93,90,0.25)',
  },
  signOutBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.accent.red,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginLeft: 56 + Spacing.lg,
  },
  resetBtn: {
    backgroundColor: 'rgba(255,93,90,0.10)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,93,90,0.25)',
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  resetBtnDisabled: {
    backgroundColor: colors.bg.elevated,
    borderColor: colors.border.default,
  },
  resetBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.accent.red,
  },
  resetBtnTextDisabled: {
    color: colors.text.ghost,
  },
  dialogBackupBtn: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.accent.blue,
    alignItems: 'center',
  },
  dialogBackupText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.accent.blue,
  },
});
