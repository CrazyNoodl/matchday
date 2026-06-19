import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useStore } from '../store';
import { FontFamily, FontSize } from '../theme/typography';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<AvatarSize, number> = {
  sm: 30,
  md: 40,
  lg: 44,
  xl: 50,
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
  const player = useStore((s) => s.players.find((p) => p.id === playerId));

  const dim = SIZES[size];
  const fontSize = FONT_SIZES[size];

  const name = player?.name ?? '??';
  const color = player?.color ?? '#5d666b';

  const parts = name.trim().split(/\s+/);
  const init =
    parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();

  return (
    <View
      style={[
        styles.base,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: color,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize, lineHeight: dim },
        ]}
        numberOfLines={1}
      >
        {init}
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
  text: {
    color: '#0c0e10',
    fontFamily: FontFamily.bodySemiBold,
    textAlign: 'center',
  },
});
