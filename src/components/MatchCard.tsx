import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useStore } from '../store';
import { Match } from '../store/types';
import { Colors } from '../theme/colors';
import { FontFamily, FontSize } from '../theme/typography';
import { Radius, Spacing } from '../theme/spacing';
import { Avatar } from './Avatar';
import { TeamBadge } from './TeamBadge';

interface MatchCardProps {
  match: Match;
  onPress?: () => void;
  readonly?: boolean;
}

export function MatchCard({ match, onPress, readonly = false }: MatchCardProps) {
  const players = useStore((s) => s.players);

  const playerA = players.find((p) => p.id === match.aId);
  const playerB = players.find((p) => p.id === match.bId);

  const aWins = match.aScore > match.bScore;
  const bWins = match.bScore > match.aScore;
  const isDraw = match.aScore === match.bScore;

  const aNameColor = !bWins ? Colors.text.primary : Colors.text.muted;
  const bNameColor = !aWins ? Colors.text.primary : Colors.text.muted;
  const aScoreColor = aWins ? Colors.accent.green : isDraw ? Colors.text.secondary : '#7c8388';
  const bScoreColor = bWins ? Colors.accent.green : isDraw ? Colors.text.secondary : '#7c8388';

  const Container = onPress && !readonly ? TouchableOpacity : View;
  const containerProps = onPress && !readonly ? { onPress, activeOpacity: 0.75 } : {};

  return (
    <Container
      {...containerProps}
      style={styles.card}
    >
      {/* Side A */}
      <View style={styles.side}>
        <Avatar playerId={match.aId} size="md" />
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, { color: aNameColor }]} numberOfLines={1}>
            {playerA?.name ?? 'Unknown'}
          </Text>
          <TeamBadge teamCode={match.aTeam} size="xs" />
        </View>
      </View>

      {/* Score */}
      <View style={styles.scoreBlock}>
        <Text style={[styles.scoreText, { color: aScoreColor }]}>
          {match.aScore}
        </Text>
        <Text style={styles.scoreSeparator}>:</Text>
        <Text style={[styles.scoreText, { color: bScoreColor }]}>
          {match.bScore}
        </Text>
      </View>

      {/* Side B */}
      <View style={[styles.side, styles.sideRight]}>
        <View style={[styles.playerInfo, styles.playerInfoRight]}>
          <Text
            style={[styles.playerName, { color: bNameColor, textAlign: 'right' }]}
            numberOfLines={1}
          >
            {playerB?.name ?? 'Unknown'}
          </Text>
          <View style={styles.badgeRight}>
            <TeamBadge teamCode={match.bTeam} size="xs" />
          </View>
        </View>
        <Avatar playerId={match.bId} size="md" />
      </View>

      {/* Media / comment indicators */}
      {(match.media && match.media.length > 0 || !!match.note) && (
        <View style={styles.indicators}>
          {match.media && match.media.length > 0 && (
            <View style={styles.indicator}>
              <Text style={styles.indicatorIcon}>📷</Text>
              <Text style={styles.indicatorCount}>{match.media.length}</Text>
            </View>
          )}
          {!!match.note && (
            <View style={styles.indicator}>
              <Text style={styles.indicatorIcon}>💬</Text>
            </View>
          )}
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  playerInfo: {
    flex: 1,
    gap: 3,
  },
  playerInfoRight: {
    alignItems: 'flex-end',
  },
  playerName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    lineHeight: 18,
  },
  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
  },
  scoreText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['2xl'],
    lineHeight: 30,
    minWidth: 22,
    textAlign: 'center',
  },
  scoreSeparator: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    color: Colors.text.ghost,
    lineHeight: 30,
  },
  badgeRight: {
    alignItems: 'flex-end',
  },
  indicators: {
    width: '100%',
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  indicatorIcon: {
    fontSize: 10,
  },
  indicatorCount: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    color: Colors.text.muted,
  },
} as const);
