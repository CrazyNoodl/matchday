import React, { useEffect, useState } from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useStore } from '../../store';
import { useColors } from '../../theme';
import { initials } from '../../store/sliceHelpers';
import type { Player, Team } from '../../store/types';
import { SIZES, RADII, FONT_SIZES, styles } from './Avatar.styles';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type AvatarVariant = 'team' | 'player';

interface AvatarProps {
  playerId?: string;
  size?: AvatarSize;
  /** 'team' (default) shows the team logo/color; 'player' shows the player's initials on a neutral background — see issue #89 */
  variant?: AvatarVariant;
  style?: ViewStyle;
  /**
   * Explicit player/team data, used instead of resolving `playerId` against
   * the Zustand store — for screens rendering data that never lives in the
   * local store (e.g. a public shared-round page fetched via RPC, see
   * src/screens/shared/). Falls back to the normal store lookup when omitted.
   */
  playerOverride?: Player;
  teamOverride?: Team;
}

export const Avatar = React.memo(function Avatar({
  playerId,
  size = 'md',
  variant = 'team',
  style,
  playerOverride,
  teamOverride,
}: AvatarProps) {
  const colors = useColors();
  const storePlayer = useStore((s) => s.players.find((p) => p.id === playerId));
  const storeTeam = useStore((s) => s.teams.find((t) => t.code === storePlayer?.teamCode));
  const player = playerOverride ?? storePlayer;
  const team = teamOverride ?? storeTeam;
  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = team?.logo?.startsWith('http') ? team.logo : undefined;

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  const dim = SIZES[size];
  const radius = RADII[size];
  const fontSize = FONT_SIZES[size];

  const baseStyle = [styles.base, { width: dim, height: dim, borderRadius: radius }, style];

  if (variant === 'player') {
    return (
      <View style={[...baseStyle, { backgroundColor: colors.bg.elevated }]}>
        <Text
          style={[styles.text, { color: colors.text.secondary, fontSize, lineHeight: dim - 4 }]}
          numberOfLines={1}
        >
          {player ? initials(player.name) : ''}
        </Text>
      </View>
    );
  }

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
