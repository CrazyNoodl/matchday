import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '@/theme/colors';

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

const styles = StyleSheet.create({
  glowGreen: {
    position: 'absolute',
    width: 340,
    height: 340,
    top: -80,
    left: -40,
    borderRadius: 170,
    backgroundColor: Colors.accent.green,
    opacity: 0.06,
  },
  glowBlue: {
    position: 'absolute',
    width: 300,
    height: 300,
    top: -80,
    right: -40,
    borderRadius: 150,
    backgroundColor: Colors.accent.blue,
    opacity: 0.05,
  },
});
