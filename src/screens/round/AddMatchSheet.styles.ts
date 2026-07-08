import { StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

// ---- Sheet styles ----
export const makeSheetStyles = (colors: AppColors) =>
  StyleSheet.create({
    sheet: {
      backgroundColor: colors.bg.sheet,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
    },
    progressBar: {
      flexDirection: 'row',
      gap: 4,
      marginBottom: Spacing.lg,
    },
    progressSegment: {
      flex: 1,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.bg.elevated,
    },
    progressSegmentFilled: {
      backgroundColor: colors.accent.green,
    },
    stepTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    stepTitle: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize['2xl'],
      color: colors.text.primary,
      letterSpacing: 0.4,
      flex: 1,
    },
    stepIndicator: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      color: colors.text.muted,
      letterSpacing: 0.8,
    },
    contentScroll: {
      maxHeight: 420,
    },
    contentScrollPad: {
      paddingBottom: Spacing.xl,
    },
    stepContent: {
      gap: Spacing.md,
    },
    stepHint: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.muted,
      letterSpacing: 0.3,
    },
    playerChips: {
      gap: Spacing.sm,
    },
    playerChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg.elevated,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: Spacing.md,
      gap: Spacing.md,
    },
    playerChipHome: {
      backgroundColor: colors.accent.greenSubtle,
      borderColor: colors.accent.greenBorder,
    },
    playerChipAway: {
      backgroundColor: colors.accent.blueSubtle,
      borderColor: colors.accent.blue + '44',
    },
    playerChipDisabled: {
      opacity: 0.4,
    },
    playerChipName: {
      flex: 1,
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.base,
      color: colors.text.muted,
    },
    homeLabel: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: Radius.xs,
      backgroundColor: colors.accent.greenSubtle,
    },
    homeLabelText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      color: colors.accent.green,
      letterSpacing: 0.5,
    },
    awayLabel: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: Radius.xs,
      backgroundColor: colors.accent.blueSubtle,
    },
    awayLabelText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      color: colors.accent.blue,
      letterSpacing: 0.5,
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    scoreDivider: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.sm,
      gap: Spacing.sm,
    },
    scoreDividerText: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.xl,
      color: colors.text.ghost,
    },
    resultPill: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      backgroundColor: colors.bg.elevated,
      borderRadius: Radius.xs,
    },
    resultLabel: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      letterSpacing: 0.5,
    },
    mediaScroll: {
      flexGrow: 0,
    },
    mediaRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      paddingBottom: Spacing.sm,
    },
    addMediaBtn: {
      width: 90,
      height: 118,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.border.strong,
      backgroundColor: colors.bg.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
    },
    addMediaIcon: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize['2xl'],
      color: colors.text.muted,
      lineHeight: 28,
    },
    addMediaText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      color: colors.text.muted,
      letterSpacing: 0.5,
    },
    ocrStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.md,
      paddingHorizontal: Spacing.xs,
    },
    ocrStatusText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.accent.blue,
    },
    ocrFoundText: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.sm,
      color: colors.accent.green,
    },
    ocrError: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginTop: Spacing.md,
      paddingHorizontal: Spacing.xs,
    },
    ocrErrorText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.accent.red,
      flex: 1,
    },
    ocrRetryBtn: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.accent.blue,
    },
    ocrRetryText: {
      fontFamily: FontFamily.bodySemiBold,
      fontSize: FontSize.sm,
      color: colors.accent.blue,
    },
    ocrSkipText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.muted,
    },
    ocrSkippedText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.text.placeholder,
    },
    commentInput: {
      backgroundColor: colors.bg.elevated,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: Spacing.lg,
      fontFamily: FontFamily.body,
      fontSize: FontSize.base,
      color: colors.text.primary,
      minHeight: 120,
    },
    saveErrorText: {
      fontFamily: FontFamily.body,
      fontSize: FontSize.sm,
      color: colors.accent.red,
      textAlign: 'center',
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.sm,
    },
    actions: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingVertical: Spacing.lg,
    },
    backActionBtn: {
      flex: 1,
      backgroundColor: colors.bg.elevated,
      borderRadius: Radius.md,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    backActionText: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.base,
      color: colors.text.muted,
      letterSpacing: 0.5,
    },
    nextBtn: {
      flex: 2,
      backgroundColor: colors.accent.green,
      borderRadius: Radius.md,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
    },
    nextBtnDisabled: {
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    nextBtnText: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.base,
      color: colors.accent.greenDark,
      letterSpacing: 0.5,
    },
    nextBtnTextDisabled: {
      color: colors.text.ghost,
    },
  });
