import React, { useEffect, useState } from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useStore } from '../../store';
import { styles } from './TeamBadge.styles';

type BadgeSize = 'xs' | 'md' | 'lg';

interface TeamBadgeProps {
  teamCode: string;
  size?: BadgeSize;
  style?: ViewStyle;
}

export const TeamBadge = React.memo(function TeamBadge({
  teamCode,
  size = 'md',
  style,
}: TeamBadgeProps) {
  const team = useStore((s) => s.teams.find((t) => t.code === teamCode));
  const [logoFailed, setLogoFailed] = useState(false);

  const label = team?.short ?? teamCode.slice(0, 3).toUpperCase();
  const color = team?.color ?? '#5d666b';
  const logoUrl = team?.logo?.startsWith('http') ? team.logo : undefined;

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  const logo = logoFailed ? undefined : logoUrl;

  if (size === 'xs') {
    if (logo) {
      return (
        <View style={[styles.xs, styles.noBorder, style]}>
          <Image
            testID="team-badge-logo"
            source={{ uri: logo }}
            style={styles.imageXs}
            contentFit="cover"
            cachePolicy="memory-disk"
            onError={() => setLogoFailed(true)}
          />
        </View>
      );
    }
    return (
      <View
        style={[styles.xs, { backgroundColor: color + '28', borderColor: color + '55' }, style]}
      >
        <Text style={[styles.textXs, { color }]}>{label}</Text>
      </View>
    );
  }

  if (size === 'lg') {
    if (logo) {
      return (
        <View style={[styles.lg, styles.noBorder, style]}>
          <Image
            testID="team-badge-logo"
            source={{ uri: logo }}
            style={styles.imageLg}
            contentFit="cover"
            cachePolicy="memory-disk"
            onError={() => setLogoFailed(true)}
          />
        </View>
      );
    }
    return (
      <View
        style={[styles.lg, { backgroundColor: color + '28', borderColor: color + '55' }, style]}
      >
        <Text style={[styles.textLg, { color }]}>{label}</Text>
      </View>
    );
  }

  // md (default)
  if (logo) {
    return (
      <View style={[styles.md, styles.noBorder, style]}>
        <Image
          testID="team-badge-logo"
          source={{ uri: logo }}
          style={styles.imageMd}
          contentFit="cover"
          cachePolicy="memory-disk"
          onError={() => setLogoFailed(true)}
        />
      </View>
    );
  }
  return (
    <View style={[styles.md, { backgroundColor: color + '28', borderColor: color + '55' }, style]}>
      <Text style={[styles.textMd, { color }]}>{label}</Text>
    </View>
  );
});
