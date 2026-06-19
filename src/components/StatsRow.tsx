import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Spacing } from '../theme/spacing';

interface StatsRowProps {
  label: string;
  aValue: number;
  bValue: number;
  aWins: boolean;
}

export function StatsRow({ label, aValue, bValue, aWins }: StatsRowProps) {
  const total = aValue + bValue;
  const aRatio = total > 0 ? aValue / total : 0.5;
  const bRatio = total > 0 ? bValue / total : 0.5;

  const aBarColor = aWins ? Colors.accent.green : Colors.text.ghost;
  const bBarColor = !aWins ? Colors.accent.green : Colors.text.ghost;

  return (
    <View style={styles.row}>
      {/* A value */}
      <Text style={[styles.value, { color: aWins ? Colors.text.primary : Colors.text.muted }]}>
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
      <Text style={[styles.value, { color: !aWins ? Colors.text.primary : Colors.text.muted }]}>
        {bValue}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  value: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    width: 28,
    textAlign: 'center',
  },
  barContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  barHalf: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.bg.elevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barInnerRight: {
    flex: 1,
    height: 6,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: 'center',
    minWidth: 60,
  },
});
