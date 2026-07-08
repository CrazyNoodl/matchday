import React from 'react';
import { View } from 'react-native';
import { makeStyles } from './GlowBackground.styles';
import { useColors } from '@/theme';

interface GlowBackgroundProps {
  variant?: 'green' | 'blue';
}

export function GlowBackground({ variant = 'green' }: GlowBackgroundProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  return (
    <View style={variant === 'blue' ? styles.glowBlue : styles.glowGreen} pointerEvents="none" />
  );
}
