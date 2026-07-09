import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useColors } from '../../theme';
import { makeVariants, SIZES, styles } from './Button.styles';

export type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'ghost' | 'destructive';

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

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onPress,
}: ButtonProps) {
  const colors = useColors();
  const VARIANTS = makeVariants(colors);
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
