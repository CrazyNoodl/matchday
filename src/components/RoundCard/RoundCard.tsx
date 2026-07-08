import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { makeStyles } from './RoundCard.styles';
import { useColors } from '@/theme';

interface RoundCardProps {
  /** Ordinal number among ranked rounds — meaningless (and not shown) for friendly rounds. */
  n: number;
  ranked: boolean;
  dateText: string;
  matchCountText: string;
  winnerId?: string;
  winnerName: string;
  onPress: () => void;
  /** 'card' = standalone bordered card (tournament.tsx). 'row' = row nested
   *  inside an already-bordered accordion card (archive.tsx). */
  variant?: 'card' | 'row';
}

export const RoundCard = React.memo(function RoundCard({
  n,
  ranked,
  dateText,
  matchCountText,
  winnerId,
  winnerName,
  onPress,
  variant = 'card',
}: RoundCardProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const isRow = variant === 'row';
  return (
    <TouchableOpacity
      style={isRow ? styles.rowOuter : styles.cardOuter}
      onPress={onPress}
      activeOpacity={isRow ? 0.75 : 0.8}
    >
      <View style={isRow ? styles.badgeRow : styles.badgeCard}>
        <Text style={isRow ? styles.badgeTextRow : styles.badgeTextCard}>{ranked ? n : '–'}</Text>
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

      {!ranked && (
        <View style={styles.friendlyBadge}>
          <Text style={styles.friendlyBadgeText}>{t('common.friendly').toUpperCase()}</Text>
        </View>
      )}

      <Text style={isRow ? styles.chevronRow : styles.chevronCard}>›</Text>
    </TouchableOpacity>
  );
});
