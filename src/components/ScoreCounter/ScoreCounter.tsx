import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Radius, Spacing } from '../../theme/spacing';
import { Avatar } from '../Avatar';
import { useStore } from '../../store';
import { getPlayerDisplayName } from '../../utils/playerDisplay';

interface ScoreCounterProps {
  playerId: string;
  teamCode: string;
  score: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function ScoreCounter({
  playerId,
  teamCode: _teamCode,
  score,
  onIncrement,
  onDecrement,
}: ScoreCounterProps) {
  const player = useStore((s) => s.players.find((p) => p.id === playerId));
  const showNick = useStore((s) => s.showNick);

  const displayName = getPlayerDisplayName(player, showNick);

  return (
    <View style={styles.container}>
      {/* Player avatar + name */}
      <Avatar playerId={playerId} size="xl" />
      <Text style={styles.name} numberOfLines={1}>
        {displayName}
      </Text>

      {/* Score display */}
      <Text style={styles.score}>{score}</Text>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.btn, score <= 0 && styles.btnDisabled]}
          onPress={onDecrement}
          disabled={score <= 0}
          activeOpacity={0.7}
        >
          <Text style={[styles.btnText, score <= 0 && styles.btnTextDisabled]}>
            −
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btn}
          onPress={onIncrement}
          activeOpacity={0.7}
        >
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  name: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  score: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.score,
    color: Colors.accent.green,
    lineHeight: FontSize.score + 8,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    lineHeight: 28,
    textAlign: 'center',
  },
  btnTextDisabled: {
    color: Colors.text.muted,
  },
});
