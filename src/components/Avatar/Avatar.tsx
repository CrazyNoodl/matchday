import React from 'react';
import { View, Text, Image, ViewStyle } from 'react-native';
import { useStore } from '../../store';
import { useColors } from '../../theme';
import { SIZES, RADII, FONT_SIZES, styles } from './Avatar.styles';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

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
