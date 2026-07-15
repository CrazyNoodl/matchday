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
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: Spacing.xl,
    },
    header: {
      alignItems: 'center',
      marginBottom: 48,
    },
    logo: {
      fontSize: 56,
      marginBottom: Spacing.sm,
    },
    title: {
      fontFamily: FontFamily.displayBold,
      fontSize: 28,
      color: colors.text.primary,
      letterSpacing: 2,
      textAlign: 'center',
    },
    sub: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.muted,
      marginTop: Spacing.xs,
      textAlign: 'center',
    },
    form: {
      gap: Spacing.sm,
    },
    label: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.xs,
      color: colors.text.muted,
      letterSpacing: 1.5,
      marginBottom: -Spacing.xs / 2,
    },
    input: {
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontFamily: FontFamily.body,
      fontSize: FontSize.md,
      color: colors.text.primary,
    },
    btn: {
      marginTop: Spacing.sm,
      backgroundColor: colors.accent.green,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    btnDisabled: {
      opacity: 0.6,
    },
    btnText: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.sm,
      color: colors.bg.base,
      letterSpacing: 1.5,
    },
    errorBox: {
      backgroundColor: colors.accent.redSubtle,
      borderWidth: 1,
      borderColor: colors.accent.red + '44',
      borderRadius: Radius.md,
      padding: Spacing.sm,
    },
    errorText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.accent.red,
    },
  });
