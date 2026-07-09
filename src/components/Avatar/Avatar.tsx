import React, { useEffect, useState } from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useStore } from '../../store';
import { useColors } from '../../theme';
import { SIZES, RADII, FONT_SIZES, styles } from './Avatar.styles';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  playerId?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

export const Avatar = React.memo(function Avatar({ playerId, size = 'md', style }: AvatarProps) {
  const colors = useColors();
  const player = useStore((s) => s.players.find((p) => p.id === playerId));
  const team = useStore((s) => s.teams.find((t) => t.code === player?.teamCode));
  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = team?.logo?.startsWith('http') ? team.logo : undefined;

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  const dim = SIZES[size];
  const radius = RADII[size];
  const fontSize = FONT_SIZES[size];

  const baseStyle = [styles.base, { width: dim, height: dim, borderRadius: radius }, style];

  if (!team) {
    return <View style={[...baseStyle, { backgroundColor: colors.bg.elevated }]} />;
  }

  if (logoUrl && !logoFailed) {
    return (
      <View style={baseStyle}>
        <Image
          testID="avatar-logo"
          source={{ uri: logoUrl }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          onError={() => setLogoFailed(true)}
        />
      </View>
    );
  }

  const label = team.short.slice(0, 3).toUpperCase();
  const color = team.color;

  return (
    <View style={[...baseStyle, { backgroundColor: color + '28' }]}>
      <Text style={[styles.text, { color, fontSize, lineHeight: dim - 4 }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
});
