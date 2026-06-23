import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';

interface SectionLabelProps {
  label: string;
  style?: TextStyle;
}

export function SectionLabel({ label, style }: SectionLabelProps) {
  return (
    <Text style={[styles.label, style]}>
      {label.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.sm,
    letterSpacing: 1.2,
    color: Colors.text.placeholder,
    textTransform: 'uppercase',
  },
});
