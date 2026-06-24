import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '../../theme';
import { makeStyles } from './StatsRow.styles';

interface StatsRowProps {
  label: string;
  aValue: number;
  bValue: number;
  aWins: boolean;
}

export function StatsRow({ label, aValue, bValue, aWins }: StatsRowProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const total = aValue + bValue;
  const aRatio = total > 0 ? aValue / total : 0.5;
  const bRatio = total > 0 ? bValue / total : 0.5;

  const aBarColor = aWins ? colors.accent.green : colors.text.ghost;
  const bBarColor = !aWins ? colors.accent.green : colors.text.ghost;

  return (
    <View style={styles.row}>
      {/* A value */}
      <Text style={[styles.value, { color: aWins ? colors.text.primary : colors.text.muted }]}>
        {aValue}
      </Text>

      {/* Dual bar */}
      <View style={styles.barContainer}>
        {/* A bar — grows from center to left */}
        <View style={styles.barHalf}>
          <View style={styles.barInnerRight}>
            <View
              style={[
                styles.bar,
                {
                  width: `${Math.round(aRatio * 100)}%`,
                  backgroundColor: aBarColor,
                },
              ]}
            />
          </View>
        </View>

        {/* Label */}
        <Text style={styles.label}>{label}</Text>

        {/* B bar — grows from center to right */}
        <View style={styles.barHalf}>
          <View
            style={[
              styles.bar,
              {
                width: `${Math.round(bRatio * 100)}%`,
                backgroundColor: bBarColor,
              },
            ]}
          />
        </View>
      </View>

      {/* B value */}
      <Text style={[styles.value, { color: !aWins ? colors.text.primary : colors.text.muted }]}>
        {bValue}
      </Text>
    </View>
  );
}
