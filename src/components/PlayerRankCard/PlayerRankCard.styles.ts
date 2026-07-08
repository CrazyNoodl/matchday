import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.xl,
      borderWidth: 1,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    cardEmphasized: {
      backgroundColor: colors.accent.greenSubtle,
    },
    medalBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    medalText: {
      fontFamily: FontFamily.display,
      fontSize: FontSize.md,
      lineHeight: 18,
    },
    info: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      overflow: 'hidden',
    },
    nameWrap: {
      flex: 1,
      gap: 3,
    },
    name: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.md,
      color: colors.text.primary,
    },
    subText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },
    ptsBlock: {
      alignItems: 'center',
      minWidth: 40,
      flexShrink: 0,
    },
    ptsNumber: {
      fontFamily: FontFamily.display,
      fontSize: FontSize['3xl'],
      color: colors.text.primary,
      lineHeight: 34,
    },
    ptsLabel: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
      letterSpacing: 0.8,
      marginTop: -2,
    },
  });
