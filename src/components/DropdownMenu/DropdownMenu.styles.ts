import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeDropdownMenuStyles = (colors: AppColors) =>
  StyleSheet.create({
    dropdown: {
      position: 'absolute',
      backgroundColor: colors.bg.elevated,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border.strong,
      minWidth: 150,
      overflow: 'hidden',
    },
    item: {
      paddingVertical: 11,
      paddingHorizontal: Spacing.lg,
    },
    itemText: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.sm,
      color: colors.text.primary,
    },
    sep: {
      height: 1,
      backgroundColor: colors.border.default,
    },
  });
