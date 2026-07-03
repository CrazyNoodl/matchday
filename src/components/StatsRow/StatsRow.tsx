import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '../../theme';
import { makeStyles } from './StatsRow.styles';

interface StatsRowProps {
  label: string;
  aValue: number;
  bValue: number;
  aWins: boolean;
  /** Param wasn't recognized/set — shown as a muted placeholder value, no winner bars. */
  isNA?: boolean;
  /** AI wasn't fully confident about this value — shown as a small dot next to the label. */
  lowConfidence?: boolean;
}

export function StatsRow({ label, aValue, bValue, aWins, isNA, lowConfidence }: StatsRowProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const total = aValue + bValue;
  const aRatio = isNA ? 0.5 : total > 0 ? aValue / total : 0.5;
  const bRatio = isNA ? 0.5 : total > 0 ? bValue / total : 0.5;

  const aBarColor = isNA ? colors.text.ghost : aWins ? colors.accent.green : colors.text.ghost;
  const bBarColor = isNA ? colors.text.ghost : !aWins ? colors.accent.green : colors.text.ghost;

  return (
    <View style={styles.row}>
      {/* A value */}
      <Text
        style={[
          styles.value,
          isNA ? styles.valueNA : { color: aWins ? colors.text.primary : colors.text.muted },
        ]}
      >
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
        <View style={styles.labelRow}>
          {lowConfidence && <View style={styles.confidenceDot} />}
          <Text style={styles.label}>{label}</Text>
        </View>

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
      <Text
        style={[
          styles.value,
          isNA ? styles.valueNA : { color: !aWins ? colors.text.primary : colors.text.muted },
        ]}
      >
        {bValue}
      </Text>
    </View>
  );
}
