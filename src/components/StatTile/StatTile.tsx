import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '../../theme';
import { makeStyles } from './StatTile.styles';

interface StatTileProps {
  label: string;
  value: string | number;
  highlight?: boolean;
  /** 'card' = left-aligned, label above value (stats.tsx style).
   *  'compact' = centered, value above label (season-stats.tsx style). */
  variant?: 'card' | 'compact';
}

export function StatTile({ label, value, highlight = false, variant = 'card' }: StatTileProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const isCompact = variant === 'compact';

  const valueText = (
    <Text style={[isCompact ? styles.compactValue : styles.cardValue, highlight && styles.valueHighlight]}>
      {value}
    </Text>
  );
  const labelText = (
    <Text style={isCompact ? styles.compactLabel : styles.cardLabel}>{label}</Text>
  );

  return (
    <View style={isCompact ? styles.compactTile : styles.cardTile}>
      {isCompact ? (
        <>
          {valueText}
          {labelText}
        </>
      ) : (
        <>
          {labelText}
          {valueText}
        </>
      )}
    </View>
  );
}
