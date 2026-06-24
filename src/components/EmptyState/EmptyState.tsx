import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useColors } from '../../theme';
import { makeStyles } from './EmptyState.styles';

interface EmptyStateProps {
  message: string;
  ctaText?: string;
  ctaColor?: string;
  onPress?: () => void;
}

export function EmptyState({ message, ctaText, ctaColor, onPress }: EmptyStateProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {ctaText ? (
        <TouchableOpacity style={styles.cta} activeOpacity={0.75} onPress={onPress}>
          <Text
            style={[
              styles.ctaText,
              { color: ctaColor ?? colors.accent.green },
            ]}
          >
            {ctaText}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
