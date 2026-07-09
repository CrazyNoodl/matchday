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
    glow: {
      position: 'absolute',
      width: 300,
      height: 300,
      top: -60,
      right: -60,
      borderRadius: 150,
      backgroundColor: colors.accent.blue,
      opacity: 0.05,
    },
    content: {
      flex: 1,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      gap: Spacing.xl,
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(106,166,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(106,166,255,0.28)',
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    badgeText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      color: colors.accent.blue,
      letterSpacing: 1.2,
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
  });
