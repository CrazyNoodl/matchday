import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
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
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: Spacing.md,
      gap: Spacing.md,
    },
    info: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.base,
      color: colors.text.primary,
    },
    subtitle: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },
    actions: {
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
    editIcon: {
      fontSize: 14,
    },
    deleteIcon: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xl,
      color: colors.accent.red,
      lineHeight: 22,
    },
  });
