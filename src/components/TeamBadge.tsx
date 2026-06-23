import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
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
  const logo = team?.logo?.startsWith('http') ? team.logo : undefined;

  if (size === 'xs') {
    if (logo) {
      return (
        <View style={[styles.xs, styles.noBorder, style]}>
          <Image source={{ uri: logo }} style={styles.imageXs} resizeMode="cover" />
        </View>
      );
    }
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
    if (logo) {
      return (
        <View style={[styles.lg, styles.noBorder, style]}>
          <Image source={{ uri: logo }} style={styles.imageLg} resizeMode="cover" />
        </View>
      );
    }
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
  if (logo) {
    return (
      <View style={[styles.md, styles.noBorder, style]}>
        <Image source={{ uri: logo }} style={styles.imageMd} resizeMode="cover" />
      </View>
    );
  }
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
    width: 18,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  md: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  noBorder: { borderWidth: 0 },
  imageXs: { width: '100%', height: '100%' },
  imageMd: { width: '100%', height: '100%' },
  imageLg: { width: '100%', height: '100%' },
  textXs: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    lineHeight: 16,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  textMd: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    lineHeight: 28,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  textLg: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.sm,
    lineHeight: 32,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});
