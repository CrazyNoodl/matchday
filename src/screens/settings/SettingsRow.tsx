import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useColors } from '@/theme';
import { makeStyles } from './settings.styles';

interface SettingsRowProps {
  icon: string;
  label: string;
  sub?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  chevron?: boolean;
}

export function SettingsRow({ icon, label, sub, onPress, right, chevron = true }: SettingsRowProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const Row = onPress ? TouchableOpacity : View;
  return (
    <Row style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {right ?? (chevron && onPress ? <Text style={styles.chevron}>›</Text> : null)}
    </Row>
  );
}
