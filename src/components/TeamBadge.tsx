import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useStore } from '../store';
import { FontFamily, FontSize } from '../theme/typography';
import { Radius } from '../theme/spacing';

type BadgeSize = 'xs' | 'md' | 'lg';

interface TeamBadgeProps {
  teamCode: string;
  size?: BadgeSize;
  style?: ViewStyle;
}

export function TeamBadge({ teamCode, size = 'md', style }: TeamBadgeProps) {
  const team = useStore((s) => s.teams.find((t) => t.code === teamCode));

  const label = team?.short ?? teamCode.slice(0, 3).toUpperCase();
  const color = team?.color ?? '#5d666b';

  if (size === 'xs') {
    return (
      <View
        style={[
          styles.xs,
          { backgroundColor: color + '28', borderColor: color + '55' },
          style,
        ]}
      >
        <Text style={[styles.textXs, { color }]}>{label}</Text>
      </View>
    );
  }

  if (size === 'lg') {
    return (
      <View
        style={[
          styles.lg,
          { backgroundColor: color + '28', borderColor: color + '55' },
          style,
        ]}
      >
        <Text style={[styles.textLg, { color }]}>{label}</Text>
      </View>
    );
  }

  // md (default)
  return (
    <View
      style={[
        styles.md,
        { backgroundColor: color + '28', borderColor: color + '55' },
        style,
      ]}
    >
      <Text style={[styles.textMd, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  xs: {
    height: 18,
    paddingHorizontal: 5,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  md: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textXs: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.4,
  },
  textMd: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.4,
  },
  textLg: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.sm,
    letterSpacing: 0.4,
  },
});
