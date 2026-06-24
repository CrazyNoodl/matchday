import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { useStore } from '../../store';
import { useColors } from '../../theme';
import { FontFamily, FontSize } from '../../theme/typography';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<AvatarSize, number> = {
  sm: 30,
  md: 40,
  lg: 44,
  xl: 50,
};

const RADII: Record<AvatarSize, number> = {
  sm: 9,
  md: 12,
  lg: 13,
  xl: 15,
};

const FONT_SIZES: Record<AvatarSize, number> = {
  sm: FontSize.xs,
  md: FontSize.base,
  lg: FontSize.md,
  xl: FontSize.lg,
};

interface AvatarProps {
  playerId?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

export function Avatar({ playerId, size = 'md', style }: AvatarProps) {
  const colors = useColors();
  const player = useStore((s) => s.players.find((p) => p.id === playerId));
  const team = useStore((s) => s.teams.find((t) => t.code === player?.teamCode));

  const dim = SIZES[size];
  const radius = RADII[size];
  const fontSize = FONT_SIZES[size];

  const baseStyle = [
    styles.base,
    { width: dim, height: dim, borderRadius: radius },
    style,
  ];

  if (!team) {
    return <View style={[...baseStyle, { backgroundColor: colors.bg.elevated }]} />;
  }

  if (team.logo?.startsWith('http')) {
    return (
      <View style={baseStyle}>
        <Image source={{ uri: team.logo }} style={styles.image} resizeMode="cover" />
      </View>
    );
  }

  const label = team.short.slice(0, 3).toUpperCase();
  const color = team.color;

  return (
    <View style={[...baseStyle, { backgroundColor: color + '28' }]}>
      <Text
        style={[styles.text, { color, fontSize, lineHeight: dim - 4 }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  text: {
    fontFamily: FontFamily.bodySemiBold,
    textAlign: 'center',
  },
});
