import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Radius, Spacing } from '../theme/spacing';

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

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  message: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  cta: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  ctaText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
  },
});
