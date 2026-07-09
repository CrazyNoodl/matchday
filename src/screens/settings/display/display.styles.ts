import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg.base },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xl,
      gap: Spacing.lg,
      paddingBottom: Spacing.xl,
    },
    sectionTitle: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.xs,
      color: colors.text.muted,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.sm,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.sm,
    },
    sectionTitleRowText: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.xs,
      color: colors.text.muted,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    badge: {
      backgroundColor: colors.accent.blueSubtle,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
    },
    badgeText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: 10,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.accent.blue,
    },
    card: {
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: colors.border.default,
      overflow: 'hidden',
    },
    themeRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
    },
    themeBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.lg,
      borderRadius: Radius.lg,
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.default,
      gap: Spacing.xs,
    },
    themeBtnActive: {
      borderColor: colors.accent.green,
      backgroundColor: colors.accent.greenSubtle,
    },
    themeBtnIcon: {
      fontSize: 24,
    },
    themeBtnLabel: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.sm,
      color: colors.text.muted,
    },
    themeBtnLabelActive: {
      color: colors.accent.green,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      gap: Spacing.md,
    },
    rowDisabled: {
      opacity: 0.5,
    },
    rowLeft: {
      flex: 1,
      gap: 4,
    },
    rowLabel: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.base,
      color: colors.text.primary,
    },
    rowDesc: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
      lineHeight: 16,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border.default,
      marginHorizontal: Spacing.lg,
    },
  });
