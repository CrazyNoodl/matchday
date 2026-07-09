import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useColors } from '@/theme';
import { makeStyles } from './settings.styles';

interface DangerZoneCardProps {
  title: string;
  label: string;
  description: string;
  buttonLabel: string;
  disabled?: boolean;
  onPress: () => void;
}

export function DangerZoneCard({
  title,
  label,
  description,
  buttonLabel,
  disabled,
  onPress,
}: DangerZoneCardProps) {
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <View style={styles.section}>
      <Text style={styles.dangerHeader}>{title.toUpperCase()}</Text>
      <View style={styles.dangerCard}>
        <View style={styles.dangerRow}>
          <View style={styles.dangerRowInfo}>
            <Text style={styles.dangerRowLabel}>{label}</Text>
            <Text style={styles.dangerRowSub}>{description}</Text>
          </View>
          <TouchableOpacity
            style={[styles.resetBtn, disabled && styles.resetBtnDisabled]}
            onPress={() => !disabled && onPress()}
            activeOpacity={disabled ? 1 : 0.8}
          >
            <Text style={[styles.resetBtnText, disabled && styles.resetBtnTextDisabled]}>
              {buttonLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
