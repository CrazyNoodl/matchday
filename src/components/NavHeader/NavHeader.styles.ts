import { StyleSheet, Platform } from 'react-native';
import type { AppColors } from '../../theme';
import { FontFamily, FontSize } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
      paddingHorizontal: Spacing.lg,
      paddingTop: Platform.OS === 'ios' ? 0 : Spacing.sm,
      paddingBottom: Spacing.md,
      minHeight: 52,
    },
    side: {
      minWidth: 44,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    sideRight: {
      alignItems: 'flex-end',
    },
    spacer: {
      width: 44,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      gap: 1,
    },
    title: {
      fontFamily: FontFamily.display,
      fontSize: FontSize.xl,
      color: colors.text.primary,
      letterSpacing: 0.3,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
      textAlign: 'center',
    },
    backBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chevron: {
      fontFamily: FontFamily.display,
      fontSize: FontSize['2xl'],
      color: colors.text.secondary,
      lineHeight: 28,
      marginTop: -2,
    },
  });
