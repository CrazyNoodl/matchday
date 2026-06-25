import React from 'react';
import { View, Text } from 'react-native';
import { STYLES, styles } from './FormChip.styles';

type Result = 'W' | 'D' | 'L';

interface FormChipProps {
  result: Result;
}

export function FormChip({ result }: FormChipProps) {
  const cfg = STYLES[result];

  return (
    <View style={[styles.chip, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.label, { color: cfg.text }]}>{result}</Text>
    </View>
  );
}
