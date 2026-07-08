import React from 'react';
import { View, Text } from 'react-native';
import type { MatchResult } from '../../store/types';
import { STYLES, styles } from './FormChip.styles';

interface FormChipProps {
  result: MatchResult;
}

export const FormChip = React.memo(function FormChip({ result }: FormChipProps) {
  const cfg = STYLES[result];

  return (
    <View style={[styles.chip, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.label, { color: cfg.text }]}>{result}</Text>
    </View>
  );
});
