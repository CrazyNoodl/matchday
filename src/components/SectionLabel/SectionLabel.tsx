import React from 'react';
import { Text, StyleSheet, type TextStyle } from 'react-native';
import { useColors } from '../../theme';
import type { AppColors } from '../../theme';
import { FontFamily, FontSize } from '../../theme/typography';

interface SectionLabelProps {
  label: string;
  style?: TextStyle;
}

export function SectionLabel({ label, style }: SectionLabelProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  return <Text style={[styles.label, style]}>{label.toUpperCase()}</Text>;
}

const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    label: {
      fontFamily: FontFamily.bodyBold,
      fontSize: FontSize.sm,
      letterSpacing: 1.2,
      color: colors.text.placeholder,
      textTransform: 'uppercase',
    },
  });
