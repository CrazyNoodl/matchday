import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { styles } from './EmptyState.styles';

interface EmptyStateProps {
  message: string;
  ctaText?: string;
  ctaColor?: string;
  onPress?: () => void;
}

export function EmptyState({ message, ctaText, ctaColor, onPress }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {ctaText ? (
        <TouchableOpacity style={styles.cta} activeOpacity={0.75} onPress={onPress}>
          <Text
            style={[
              styles.ctaText,
              { color: ctaColor ?? Colors.accent.green },
            ]}
          >
            {ctaText}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
