import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { useColors } from '@/theme';
import { makeStyles } from './Toggle.styles';

interface ToggleProps {
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  /** 'boxed' = standalone card row with its own border/background (default).
   *  'flat' = no border/background/radius, for use inside an already-bordered
   *  card with divider-separated rows (e.g. display.tsx settings card). */
  variant?: 'boxed' | 'flat';
  /** Track color when on. Defaults to colors.accent.green. */
  accentColor?: string;
  testID?: string;
}

// Single toggle control used everywhere the app needs an on/off row —
// e.g. "Ranked" in NewRoundModal, "Include standings/matches" in
// ShareRoundModal. Replaces both the previous hand-rolled row toggle and
// the native RN `Switch` so every on/off choice looks the same.
export function Toggle({
  label,
  subtitle,
  value,
  onValueChange,
  disabled = false,
  variant = 'boxed',
  accentColor,
  testID,
}: ToggleProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const onColor = accentColor ?? colors.accent.green;

  return (
    <TouchableOpacity
      testID={testID}
      style={[
        variant === 'flat' ? styles.rowFlat : styles.row,
        disabled && styles.rowDisabled,
      ]}
      onPress={() => !disabled && onValueChange(!value)}
      activeOpacity={disabled ? 1 : 0.8}
      disabled={disabled}
    >
      <View style={styles.labelBlock}>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.track, value && { backgroundColor: onColor, borderColor: onColor }]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </TouchableOpacity>
  );
}
