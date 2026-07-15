import { Platform, StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backChevron: {
      fontFamily: FontFamily.display,
      fontSize: FontSize['2xl'],
      color: colors.text.secondary,
      lineHeight: 28,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
      gap: 1,
    },
    headerTitle: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.xl,
      color: colors.text.primary,
      letterSpacing: 0.3,
    },
    headerSubtitle: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },
    headerRight: {
      width: 40,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing['3xl'],
    },
    sectionGap: {
      marginTop: Spacing['2xl'],
      marginBottom: Spacing.sm,
    },
    input: {
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.md,
      color: colors.text.primary,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    optionInfo: {
      flex: 1,
      gap: 3,
    },
    optionLabel: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.base,
      color: colors.text.primary,
    },
    optionDesc: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      gap: Spacing.md,
    },
    stepperInfo: {
      flex: 1,
    },
    stepperDesc: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    stepperBtn: {
      width: 34,
      height: 34,
      borderRadius: Radius.sm,
      backgroundColor: colors.accent.greenSubtle,
      borderWidth: 1,
      borderColor: colors.accent.greenBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperBtnDisabled: {
      backgroundColor: colors.bg.elevated,
      borderColor: colors.border.medium,
    },
    stepperBtnText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.lg,
      color: colors.accent.green,
      lineHeight: 22,
    },
    stepperBtnTextDisabled: {
      color: colors.text.ghost,
    },
    stepperValue: {
      width: 44,
      alignItems: 'center',
    },
    stepperValueText: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.xl,
      color: colors.text.primary,
      letterSpacing: 0.5,
    },
    playersList: {
      gap: Spacing.sm,
    },
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: Spacing.md,
      gap: Spacing.md,
    },
    playerRowSelected: {
      backgroundColor: colors.accent.greenSubtle,
      borderColor: colors.accent.greenBorder,
    },
    playerInfo: {
      flex: 1,
      gap: 2,
    },
    playerName: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.base,
      color: colors.text.primary,
    },
    playerNick: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.xs,
      color: colors.text.muted,
    },
    teamChip: {
      padding: 2,
    },
    checkCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border.strong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkCircleSelected: {
      backgroundColor: colors.accent.green,
      borderColor: colors.accent.green,
    },
    checkMark: {
      color: colors.accent.greenDark,
      fontSize: FontSize.sm,
      fontFamily: FontFamily.bodyBold,
      lineHeight: 16,
    },
    manageTeamsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.surface,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: Spacing.md,
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    manageTeamsIcon: {
      fontSize: 16,
    },
    manageTeamsText: {
      flex: 1,
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.base,
      color: colors.text.secondary,
    },
    manageTeamsChevron: {
      fontFamily: FontFamily.display,
      fontSize: FontSize.xl,
      color: colors.text.muted,
      lineHeight: 24,
    },
    // Bottom CTA
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.bg.base,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.xl,
      borderTopWidth: 1,
      borderTopColor: colors.border.default,
    },
    startBtn: {
      backgroundColor: colors.accent.green,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
    },
    startBtnDisabled: {
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    startBtnText: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.lg,
      color: colors.accent.greenDark,
      letterSpacing: 0.8,
    },
    startBtnTextDisabled: {
      color: colors.text.ghost,
    },
  });
