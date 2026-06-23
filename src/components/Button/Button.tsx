import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Radius, Spacing } from '../../theme/spacing';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outlined'
  | 'ghost'
  | 'destructive';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
}

type VariantDef = { container: ViewStyle; text: TextStyle; loadingColor: string };
type SizeDef = { container: ViewStyle; text: TextStyle; loadingSize: number };

const VARIANTS: Record<ButtonVariant, VariantDef> = {
  primary: {
    container: { backgroundColor: Colors.accent.green },
    text: { color: Colors.bg.base },
    loadingColor: Colors.bg.base,
  },
  secondary: {
    container: {
      backgroundColor: Colors.bg.elevated,
      borderWidth: 1,
      borderColor: Colors.border.strong,
    },
    text: { color: Colors.text.primary },
    loadingColor: Colors.text.primary,
  },
  outlined: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: Colors.accent.green,
    },
    text: { color: Colors.accent.green },
    loadingColor: Colors.accent.green,
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: Colors.text.secondary },
    loadingColor: Colors.text.secondary,
  },
  destructive: {
    container: {
      backgroundColor: Colors.accent.redSubtle,
      borderWidth: 1,
      borderColor: 'rgba(255,93,90,0.30)',
    },
    text: { color: Colors.accent.red },
    loadingColor: Colors.accent.red,
  },
};

const SIZES: Record<ButtonSize, SizeDef> = {
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

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onPress,
}: ButtonProps) {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const inactive = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        v.container,
        s.container,
        fullWidth && styles.fullWidth,
        inactive && styles.muted,
      ]}
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.72}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size={s.loadingSize} color={v.loadingColor} />
      ) : (
        <Text style={[styles.label, v.text, s.text]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
