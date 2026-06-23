import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontFamily, FontSize } from '../../theme/typography';

type Result = 'W' | 'D' | 'L';

interface FormChipProps {
  result: Result;
}

interface ChipStyle {
  bg: string;
  text: string;
}

const STYLES: Record<Result, ChipStyle> = {
  W: { bg: '#1a3d28', text: '#3ddc84' },
  D: { bg: '#2a2a1c', text: '#f6c350' },
  L: { bg: '#2a1c1c', text: '#ff5d5a' },
};

export function FormChip({ result }: FormChipProps) {
  const cfg = STYLES[result];

  return (
    <View style={[styles.chip, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.label, { color: cfg.text }]}>{result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: 16,
    height: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    lineHeight: 16,
    textAlign: 'center',
  },
});
