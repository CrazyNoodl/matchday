import { Platform, StyleSheet } from 'react-native';
import type { AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

export const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    sheet: {
      backgroundColor: colors.bg.sheet,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      paddingBottom: Platform.OS === 'ios' ? 32 : Spacing['2xl'],
    },
    sheetTitle: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize['2xl'],
      color: colors.text.primary,
      letterSpacing: 0.5,
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    formGroup: {
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    formLabel: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.xs,
      color: colors.text.muted,
      letterSpacing: 1,
    },
    input: {
      backgroundColor: colors.bg.elevated,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      fontFamily: FontFamily.body,
      fontSize: FontSize.base,
      color: colors.text.primary,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    logoPickerBtn: {
      width: 64,
      height: 64,
      borderRadius: Radius.md,
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    logoPreview: {
      width: '100%',
      height: '100%',
    },
    logoPickerBtnDisabled: {
      opacity: 0.4,
    },
    logoPickerIcon: {
      fontSize: 24,
    },
    logoRemoveBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.accent.redSubtle,
      borderWidth: 1,
      borderColor: colors.accent.red + '44',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoRemoveText: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.lg,
      color: colors.accent.red,
      lineHeight: 20,
    },
    colorPicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    colorDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    colorDotSelected: {
      borderWidth: 3,
      borderColor: '#fff',
    },
    sheetActions: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.md,
    },
    cancelBtn: {
      flex: 1,
      backgroundColor: colors.bg.elevated,
      borderRadius: Radius.md,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    cancelBtnText: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.base,
      color: colors.text.muted,
      letterSpacing: 0.5,
    },
    saveBtn: {
      flex: 2,
      backgroundColor: colors.accent.green,
      borderRadius: Radius.md,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
    },
    saveBtnDisabled: {
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    saveBtnText: {
      fontFamily: FontFamily.displayBold,
      fontSize: FontSize.base,
      color: colors.accent.greenDark,
      letterSpacing: 0.5,
    },
    saveBtnTextDisabled: {
      color: colors.text.ghost,
    },
  });
