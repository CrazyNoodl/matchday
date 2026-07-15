import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg.base },
    addBtn: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.full,
      backgroundColor: colors.accent.greenSubtle,
      borderWidth: 1,
      borderColor: colors.accent.greenBorder,
    },
    addBtnText: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.sm,
      color: colors.accent.green,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      gap: Spacing.sm,
    },
    teamRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: Spacing.md,
      gap: Spacing.md,
    },
    teamBadgeWrap: {
      position: 'relative',
    },
    teamColorSwatch: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: colors.bg.surface,
    },
    teamInfo: {
      flex: 1,
      gap: 2,
    },
    teamName: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.base,
      color: colors.text.primary,
    },
    teamCode: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },
    teamActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    actionBtn: {
      width: 32,
      height: 32,
      borderRadius: Radius.sm,
      backgroundColor: colors.bg.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    deleteBtn: {
      backgroundColor: colors.accent.redSubtle,
      borderColor: colors.accent.red + '44',
    },
    editIcon: { fontSize: 14 },
    deleteIcon: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xl,
      color: colors.accent.red,
      lineHeight: 22,
    },
  });
