import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStore } from '../../store';
import { Standing } from '../../utils/standings';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Radius, Spacing } from '../../theme/spacing';
import { Avatar } from '../Avatar';
import { FormChip } from '../FormChip';
import { getFormChips } from '../../utils/standings';
import { getPlayerDisplayName } from '../../utils/playerDisplay';

interface StandingCardProps {
  standing: Standing;
  position: number;
  playerId: string;
  showFormChips?: boolean;
}

const POSITION_COLORS: Record<number, string> = {
  1: Colors.accent.green,
  2: '#b0b8be',
  3: '#cd7f32',
};

export function StandingCard({
  standing,
  position,
  playerId,
  showFormChips = true,
}: StandingCardProps) {
  const player = useStore((s) => s.players.find((p) => p.id === playerId));
  const matches = useStore((s) => s.matches);
  const showNick = useStore((s) => s.showNick);

  const formChips = showFormChips
    ? getFormChips(matches, playerId, 3)
    : [];

  const posColor = POSITION_COLORS[position] ?? Colors.text.muted;
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
              <Text style={styles.leaderText}>LEADER</Text>
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
                  { color: standing.gd > 0 ? Colors.accent.green : Colors.accent.red },
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
        <Text style={styles.ptsLabel}>PTS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  cardLeader: {
    borderColor: Colors.accent.greenBorder,
    backgroundColor: Colors.accent.greenSubtle,
  },
  position: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    width: 24,
    textAlign: 'center',
  },
  avatar: {
    // no extra style needed; gap handles spacing
  },
  info: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  name: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    flexShrink: 1,
  },
  leaderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    backgroundColor: Colors.accent.greenSubtle,
    borderWidth: 1,
    borderColor: Colors.accent.greenBorder,
  },
  leaderText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.accent.green,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  statDivider: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.ghost,
  },
  chips: {
    flexDirection: 'row',
    gap: 3,
  },
  ptsBlock: {
    alignItems: 'center',
    minWidth: 42,
  },
  pts: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['3xl'],
    color: Colors.accent.green,
    lineHeight: 34,
  },
  ptsLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 0.6,
  },
});
