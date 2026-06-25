import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '../../theme';
import { makeConfig, styles } from './StatusBadge.styles';

export type BadgeType =
  | 'live'
  | 'soon'
  | 'leader'
  | 'editing'
  | 'archived'
  | 'friendly'
  | 'auto'
  | 'ranked';

interface StatusBadgeProps {
  type: BadgeType;
}

export function StatusBadge({ type }: StatusBadgeProps) {
  const colors = useColors();
  const cfg = makeConfig(colors)[type];

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: cfg.bg,
          borderColor: cfg.borderColor ?? 'transparent',
        },
      ]}
    >
      <Text style={[styles.label, { color: cfg.textColor }]}>
        {cfg.label}
      </Text>
    </View>
  );
}
