import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Avatar } from '../Avatar';
import { useStore } from '../../store';
import { useColors } from '../../theme';
import { getPlayerDisplayName } from '../../utils/playerDisplay';
import { makeStyles } from './ScoreCounter.styles';

interface ScoreCounterProps {
  playerId: string;
  teamCode: string;
  score: number;
  onIncrement: () => void;
  onDecrement: () => void;
  testID?: string;
}

export function ScoreCounter({
  playerId,
  teamCode: _teamCode,
  score,
  onIncrement,
  onDecrement,
  testID,
}: ScoreCounterProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
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
          testID={testID && `${testID}-decrement`}
          style={[styles.btn, score <= 0 && styles.btnDisabled]}
          onPress={onDecrement}
          disabled={score <= 0}
          activeOpacity={0.7}
        >
          <Text style={[styles.btnText, score <= 0 && styles.btnTextDisabled]}>−</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID={testID && `${testID}-increment`}
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
