import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { styles } from './RoundCard.styles';

interface RoundCardProps {
  n: number;
  dateText: string;
  matchCountText: string;
  winnerId?: string;
  winnerName: string;
  /** Renders a tag (e.g. "Friendly") next to the chevron — only used by the 'card' variant. */
  friendlyLabel?: string;
  onPress: () => void;
  /** 'card' = standalone bordered card (tournament.tsx). 'row' = row nested
   *  inside an already-bordered accordion card (archive.tsx). */
  variant?: 'card' | 'row';
}

export function RoundCard({
  n,
  dateText,
  matchCountText,
  winnerId,
  winnerName,
  friendlyLabel,
  onPress,
  variant = 'card',
}: RoundCardProps) {
  const isRow = variant === 'row';
  return (
    <TouchableOpacity
      style={isRow ? styles.rowOuter : styles.cardOuter}
      onPress={onPress}
      activeOpacity={isRow ? 0.75 : 0.8}
    >
      <View style={isRow ? styles.badgeRow : styles.badgeCard}>
        <Text style={isRow ? styles.badgeTextRow : styles.badgeTextCard}>{n}</Text>
      </View>

      <View style={isRow ? styles.infoRow : styles.infoCard}>
        <Text style={isRow ? styles.dateRow : styles.dateCard}>{dateText}</Text>
        <Text style={styles.matchCount}>{matchCountText}</Text>
      </View>

      <View style={isRow ? styles.winnerAreaRow : styles.winnerAreaCard}>
        {winnerId ? (
          <>
            <Avatar playerId={winnerId} size="sm" style={isRow ? styles.avatarRow : undefined} />
            <Text style={isRow ? styles.winnerNameRow : styles.winnerNameCard} numberOfLines={1}>
              {winnerName}
            </Text>
          </>
        ) : (
          <Text style={isRow ? styles.winnerNameRow : styles.winnerNameCard}>{winnerName}</Text>
        )}
      </View>

      {!isRow && friendlyLabel && (
        <View style={styles.friendlyBadge}>
          <Text style={styles.friendlyBadgeText}>{friendlyLabel}</Text>
        </View>
      )}

      <Text style={isRow ? styles.chevronRow : styles.chevronCard}>›</Text>
    </TouchableOpacity>
  );
}
