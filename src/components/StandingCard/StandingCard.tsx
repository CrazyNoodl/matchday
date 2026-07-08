import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../../store';
import { Standing, getFormChips } from '../../utils/standings';
import { useColors } from '../../theme';
import { Avatar } from '../Avatar';
import { FormChip } from '../FormChip';
import { getPlayerDisplayName } from '../../utils/playerDisplay';
import { makeStyles } from './StandingCard.styles';

interface StandingCardProps {
  standing: Standing;
  position: number;
  playerId: string;
  showFormChips?: boolean;
}

export const StandingCard = React.memo(function StandingCard({
  standing,
  position,
  playerId,
  showFormChips = true,
}: StandingCardProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const player = useStore((s) => s.players.find((p) => p.id === playerId));
  const showNick = useStore((s) => s.showNick);
  const formChips = useStore(
    useShallow((s) => (showFormChips ? getFormChips(s.matches, playerId, 3) : [])),
  );

  const POSITION_COLORS: Record<number, string> = {
    1: colors.accent.green,
    2: '#b0b8be',
    3: '#cd7f32',
  };

  const posColor = POSITION_COLORS[position] ?? colors.text.muted;
  const isLeader = position === 1;

  return (
    <View
      style={[
        styles.card,
        isLeader && styles.cardLeader,
      ]}
    >
      {/* Position */}
      <Text style={[styles.position, { color: posColor }]}>
        {position}
      </Text>

      {/* Avatar */}
      <Avatar playerId={playerId} size="lg" style={styles.avatar} />

      {/* Player info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {getPlayerDisplayName(player, showNick)}
          </Text>
          {isLeader && (
            <View style={styles.leaderBadge}>
              <Text style={styles.leaderText}>{t('common.leader').toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>{standing.played}G</Text>
          <Text style={styles.statDivider}>·</Text>
          <Text style={styles.statText}>{standing.wins}W</Text>
          <Text style={styles.statDivider}>·</Text>
          <Text style={styles.statText}>{standing.draws}D</Text>
          <Text style={styles.statDivider}>·</Text>
          <Text style={styles.statText}>{standing.losses}L</Text>
          {standing.gd !== 0 && (
            <>
              <Text style={styles.statDivider}>·</Text>
              <Text
                style={[
                  styles.statText,
                  { color: standing.gd > 0 ? colors.accent.green : colors.accent.red },
                ]}
              >
                {standing.gd > 0 ? '+' : ''}{standing.gd}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Form chips */}
      {showFormChips && formChips.length > 0 && (
        <View style={styles.chips}>
          {formChips.map((result, i) => (
            <FormChip key={i} result={result} />
          ))}
        </View>
      )}

      {/* Points */}
      <View style={styles.ptsBlock}>
        <Text style={styles.pts}>
          {standing.pts}
        </Text>
        <Text style={styles.ptsLabel}>{t('common.pts')}</Text>
      </View>
    </View>
  );
});
