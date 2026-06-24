import React from 'react';
import { View } from 'react-native';
import { styles } from './GlowBackground.styles';

interface GlowBackgroundProps {
  variant?: 'green' | 'blue';
}

export function GlowBackground({ variant = 'green' }: GlowBackgroundProps) {
  return (
    <View
      style={variant === 'blue' ? styles.glowBlue : styles.glowGreen}
      pointerEvents="none"
    />
  );
}
