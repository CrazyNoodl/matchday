import React from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { Colors } from '@/theme/colors';
import { Avatar } from '@/components/Avatar';
import { styles } from './PlayerRankCard.styles';

export interface RankMedal {
  badgeColor: string;
  badgeBg: string;
  cardBorder: string;
}

interface PlayerRankCardProps {
  rank: number;
  medal: RankMedal | null;
  playerId: string;
  name: string;
  subText: string;
  points: number;
  pointsLabel: string;
  pointsColor?: string;
  /** Highlights the card with a subtle green background (e.g. the #1 row). */
  emphasized?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PlayerRankCard({
  rank,
  medal,
  playerId,
  name,
  subText,
  points,
  pointsLabel,
  pointsColor,
  emphasized,
  style,
}: PlayerRankCardProps) {
  return (
    <View
      style={[
        styles.card,
        { borderColor: medal ? medal.cardBorder : Colors.border.default },
        emphasized && styles.cardEmphasized,
        style,
      ]}
    >
      <View
        style={[
          styles.medalBadge,
          { backgroundColor: medal ? medal.badgeBg : 'rgba(255,255,255,0.06)' },
        ]}
      >
        <Text style={[styles.medalText, { color: medal ? medal.badgeColor : Colors.text.muted }]}>
          {rank}
        </Text>
      </View>

      <View style={styles.info}>
        <Avatar playerId={playerId} size="md" />
        <View style={styles.nameWrap}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.subText} numberOfLines={1}>
            {subText}
          </Text>
        </View>
      </View>

      <View style={styles.ptsBlock}>
        <Text style={[styles.ptsNumber, pointsColor ? { color: pointsColor } : null]}>
          {points}
        </Text>
        <Text style={styles.ptsLabel}>{pointsLabel}</Text>
      </View>
    </View>
  );
}
