import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useStore } from '../../store';
import { Match } from '../../store/types';
import { Colors } from '../../theme/colors';
import { Avatar } from '../Avatar';
import { styles } from './MatchCard.styles';

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
        <Text style={[styles.playerName, { color: aNameColor }]} numberOfLines={1}>
          {playerA?.name ?? 'Unknown'}
        </Text>
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
        <Text
          style={[styles.playerName, { color: bNameColor, textAlign: 'right' }]}
          numberOfLines={1}
        >
          {playerB?.name ?? 'Unknown'}
        </Text>
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
