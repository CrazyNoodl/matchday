import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store';
import { Match } from '../../store/types';
import { useColors } from '../../theme';
import { Avatar } from '../Avatar';
import { makeStyles } from './MatchCard.styles';

interface MatchCardProps {
  match: Match;
  onPress?: (matchId: string) => void;
  readonly?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const MatchCard = React.memo(function MatchCard({ match, onPress, readonly = false, style }: MatchCardProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const players = useStore((s) => s.players);

  const playerA = players.find((p) => p.id === match.aId);
  const playerB = players.find((p) => p.id === match.bId);

  const aWins = match.aScore > match.bScore;
  const bWins = match.bScore > match.aScore;
  const isDraw = match.aScore === match.bScore;

  const aNameColor = !bWins ? colors.text.primary : colors.text.muted;
  const bNameColor = !aWins ? colors.text.primary : colors.text.muted;
  const aScoreColor = aWins ? colors.accent.green : isDraw ? colors.text.secondary : colors.text.ghost;
  const bScoreColor = bWins ? colors.accent.green : isDraw ? colors.text.secondary : colors.text.ghost;

  const handlePress = onPress ? () => onPress(match.id) : undefined;
  const Container = handlePress && !readonly ? TouchableOpacity : View;
  const containerProps = handlePress && !readonly ? { onPress: handlePress, activeOpacity: 0.75 } : {};

  return (
    <Container
      {...containerProps}
      style={[styles.card, style]}
    >
      {/* Side A */}
      <View style={styles.side}>
        <Avatar playerId={match.aId} size="md" />
        <Text style={[styles.playerName, { color: aNameColor }]} numberOfLines={1}>
          {playerA?.name ?? t('common.unknown')}
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
          {playerB?.name ?? t('common.unknown')}
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
});
