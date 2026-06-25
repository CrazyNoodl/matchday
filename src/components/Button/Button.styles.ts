import { StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import type { AppColors } from '../../theme';
import { FontFamily, FontSize } from '../../theme/typography';
import { Radius, Spacing } from '../../theme/spacing';
import type { ButtonVariant, ButtonSize } from './Button';

type VariantDef = { container: ViewStyle; text: TextStyle; loadingColor: string };
type SizeDef = { container: ViewStyle; text: TextStyle; loadingSize: number };

export const makeVariants = (colors: AppColors): Record<ButtonVariant, VariantDef> => ({
  primary: {
    container: { backgroundColor: colors.accent.green },
    text: { color: colors.bg.base },
    loadingColor: colors.bg.base,
  },
  secondary: {
    container: {
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.strong,
    },
    text: { color: colors.text.primary },
    loadingColor: colors.text.primary,
  },
  outlined: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.accent.green,
    },
    text: { color: colors.accent.green },
    loadingColor: colors.accent.green,
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.text.secondary },
    loadingColor: colors.text.secondary,
  },
  destructive: {
    container: {
      backgroundColor: colors.accent.redSubtle,
      borderWidth: 1,
      borderColor: 'rgba(255,93,90,0.30)',
    },
    text: { color: colors.accent.red },
    loadingColor: colors.accent.red,
  },
});

export const SIZES: Record<ButtonSize, SizeDef> = {
  sm: {
    container: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: Radius.sm,
      minHeight: 32,
    },
    text: { fontSize: FontSize.sm },
    loadingSize: 12,
  },
  md: {
    container: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm + 2,
      borderRadius: Radius.md,
      minHeight: 44,
    },
    text: { fontSize: FontSize.base },
    loadingSize: 16,
  },
  lg: {
    container: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: Radius.lg,
      minHeight: 54,
    },
    text: { fontSize: FontSize.md },
    loadingSize: 20,
  },
};

export const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  muted: {
    opacity: 0.4,
  },
  label: {
    fontFamily: FontFamily.bodySemiBold,
    textAlign: 'center',
  },
});
