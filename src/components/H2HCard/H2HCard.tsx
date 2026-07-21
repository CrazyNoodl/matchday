import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { useColors } from '@/theme';
import { Radius } from '@/theme/spacing';
import { Avatar } from '../Avatar';
import { makeStyles } from './H2HCard.styles';
import type { H2HPair } from '@/utils/statsAggregation';
import type { Player } from '@/store/types';

interface H2HCardProps {
  pair: H2HPair;
}

/** Wins/draws/goals summary card for one rivalry pair — used by the H2H tab and the rivalry detail screen. */
export function H2HCard({ pair }: H2HCardProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const teams = useStore((s) => s.teams);
  const teamColorFor = (player: Player) =>
    teams.find((team) => team.code === player.teamCode)?.color ?? colors.text.secondary;

  const { playerA, playerB, aWins, bWins, draws, aGoals, bGoals, games } = pair;
  const totalDecisive = aWins + bWins;
  const aBarFlex = totalDecisive > 0 ? aWins / totalDecisive : 0.5;
  const bBarFlex = totalDecisive > 0 ? bWins / totalDecisive : 0.5;
  const allDraws = totalDecisive === 0;

  return (
    <View style={styles.card}>
      {/* Top row: Player A · games · Player B */}
      <View style={styles.topRow}>
        <View style={styles.playerLeft}>
          <Avatar playerId={playerA.id} size="sm" />
          <Text style={styles.playerName} numberOfLines={1}>
            {playerA.name}
          </Text>
        </View>

        <View style={styles.gamesWrap}>
          <Text style={styles.gamesText}>{t('stats.h2hGames', { count: games })}</Text>
        </View>

        <View style={styles.playerRight}>
          <Text style={styles.playerName} numberOfLines={1}>
            {playerB.name}
          </Text>
          <Avatar playerId={playerB.id} size="sm" />
        </View>
      </View>

      {/* Wins counts + draws label */}
      <View style={styles.scoreRow}>
        <Text style={[styles.winsCount, { color: teamColorFor(playerA) }]}>{aWins}</Text>
        <Text style={styles.drawsLabel}>{t('stats.h2hDraws', { count: draws })}</Text>
        <Text style={[styles.winsCount, { color: teamColorFor(playerB) }]}>{bWins}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.barContainer}>
        {allDraws ? (
          <View
            style={[
              styles.barSegment,
              { flex: 1, backgroundColor: colors.border.strong, borderRadius: Radius.full },
            ]}
          />
        ) : (
          <>
            <View
              style={[
                styles.barSegment,
                {
                  flex: aBarFlex,
                  backgroundColor: teamColorFor(playerA),
                  borderTopLeftRadius: Radius.full,
                  borderBottomLeftRadius: Radius.full,
                  borderTopRightRadius: bWins === 0 ? Radius.full : 0,
                  borderBottomRightRadius: bWins === 0 ? Radius.full : 0,
                },
              ]}
            />
            {aWins > 0 && bWins > 0 && <View style={styles.barGap} />}
            <View
              style={[
                styles.barSegment,
                {
                  flex: bBarFlex,
                  backgroundColor: teamColorFor(playerB),
                  borderTopRightRadius: Radius.full,
                  borderBottomRightRadius: Radius.full,
                  borderTopLeftRadius: aWins === 0 ? Radius.full : 0,
                  borderBottomLeftRadius: aWins === 0 ? Radius.full : 0,
                },
              ]}
            />
          </>
        )}
      </View>

      {/* Goals line */}
      <Text style={styles.goals}>{t('stats.h2hGoals', { a: aGoals, b: bGoals })}</Text>
    </View>
  );
}
