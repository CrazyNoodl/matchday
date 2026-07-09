import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      paddingBottom: 40,
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
      minHeight: 64,
    },
    flagContainer: {
      width: 44,
      height: 44,
      borderRadius: Radius.sm,
      backgroundColor: colors.bg.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    flag: {
      fontSize: 26,
    },
    info: {
      flex: 1,
      gap: 2,
    },
    nativeName: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.base,
      color: colors.text.primary,
    },
    translatedName: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },
    checkContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.accent.greenSubtle,
      borderWidth: 1,
      borderColor: colors.accent.greenBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkMark: {
      fontSize: 14,
      color: colors.accent.green,
      fontFamily: FontFamily.bodyBold,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border.default,
      marginLeft: 44 + Spacing.lg + Spacing.md,
    },
  });
