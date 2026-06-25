import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { calculateStandings } from '@/utils/standings';
import { useColors } from '@/theme';
import { Radius } from '@/theme/spacing';
import { Avatar, NavHeader, SectionLabel, GlowBackground, SegmentedControl, PlayerRankCard } from '@/components';
import type { Match, Player } from '@/store/types';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '@/screens/stats/stats.styles';

type Tab = 'ranking' | 'h2h';

// ---------------------------------------------------------------------------
// H2H pair type
// ---------------------------------------------------------------------------
interface H2HPair {
  playerA: Player;
  playerB: Player;
  aWins: number;
  bWins: number;
  draws: number;
  aGoals: number;
  bGoals: number;
  games: number;
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function StatsScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const colors = useColors();
  const styles = makeStyles(colors);
  const [activeTab, setActiveTab] = useState<Tab>('ranking');
  const { t } = useTranslation();

  const tournamentPlayers = useStore((s) => s.tournamentPlayers);
  const archivedRounds = useStore((s) => s.archivedRounds);
  const currentMatches = useStore((s) => s.matches);
  const closedTournaments = useStore((s) => s.closedTournaments);
  const players = useStore((s) => s.players);

  // Combine all matches: closed tournaments + current tournament archived rounds + current round
  const allMatches = useMemo<Match[]>(() => {
    const fromClosed = closedTournaments.flatMap((t) => t.rounds.flatMap((r) => r.matches));
    const fromArchived = archivedRounds.flatMap((r) => r.matches);
    return [...fromClosed, ...fromArchived, ...currentMatches];
  }, [closedTournaments, archivedRounds, currentMatches]);

  // Player IDs — union of current tournament + all closed tournaments
  const playerIds = useMemo<string[]>(() => {
    const ids = new Set<string>();
    for (const id of tournamentPlayers) ids.add(id);
    for (const t of closedTournaments) {
      for (const id of t.players) ids.add(id);
    }
    for (const m of allMatches) {
      ids.add(m.aId);
      ids.add(m.bId);
    }
    return Array.from(ids);
  }, [tournamentPlayers, closedTournaments, allMatches]);

  const standings = useMemo(
    () => calculateStandings(allMatches, playerIds),
    [allMatches, playerIds],
  );

  const totalGoals = useMemo(
    () => allMatches.reduce((acc, m) => acc + m.aScore + m.bScore, 0),
    [allMatches],
  );
  const matchDaysPlayed = useMemo(
    () =>
      archivedRounds.length +
      closedTournaments.reduce((acc, t) => acc + t.rounds.length, 0),
    [archivedRounds, closedTournaments],
  );

  // H2H pairs — all combinations of player IDs
  const h2hPairs = useMemo<H2HPair[]>(() => {
    const result: H2HPair[] = [];
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        const idA = playerIds[i];
        const idB = playerIds[j];
        const playerA = players.find((p) => p.id === idA);
        const playerB = players.find((p) => p.id === idB);
        if (!playerA || !playerB) continue;

        let aWins = 0;
        let bWins = 0;
        let draws = 0;
        let aGoals = 0;
        let bGoals = 0;

        for (const m of allMatches) {
          const isAB = m.aId === idA && m.bId === idB;
          const isBA = m.aId === idB && m.bId === idA;
          if (!isAB && !isBA) continue;

          if (isAB) {
            aGoals += m.aScore;
            bGoals += m.bScore;
            if (m.aScore > m.bScore) aWins++;
            else if (m.aScore < m.bScore) bWins++;
            else draws++;
          } else {
            // isBA: flip perspective so A = playerA
            aGoals += m.bScore;
            bGoals += m.aScore;
            if (m.bScore > m.aScore) aWins++;
            else if (m.bScore < m.aScore) bWins++;
            else draws++;
          }
        }

        const games = aWins + bWins + draws;
        if (games === 0) continue;

        result.push({ playerA, playerB, aWins, bWins, draws, aGoals, bGoals, games });
      }
    }
    return result.sort((a, b) => b.games - a.games);
  }, [playerIds, players, allMatches]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <GlowBackground />

      {/* Custom two-line header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.chevron}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          {t('stats.title').split('\n').map((line, i) => (
            <Text key={i} style={styles.headerTitle}>{line}</Text>
          ))}
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Tab pills */}
      <View style={styles.tabRow}>
        <SegmentedControl
          variant="pill"
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: 'ranking', label: t('stats.ranking') },
            { value: 'h2h', label: t('stats.h2h') },
          ]}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'ranking' ? (
          <RankingTab
            standings={standings}
            players={players}
            totalGoals={totalGoals}
            matchDaysPlayed={matchDaysPlayed}
          />
        ) : (
          <H2HTab pairs={h2hPairs} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Ranking tab
// ---------------------------------------------------------------------------
interface RankingTabProps {
  standings: ReturnType<typeof calculateStandings>;
  players: Player[];
  totalGoals: number;
  matchDaysPlayed: number;
}

function RankingTab({
  standings,
  players,
  totalGoals,
  matchDaysPlayed,
}: RankingTabProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);

  const MEDALS = [
    {
      rank: 1,
      badgeColor: colors.accent.gold,
      badgeBg: 'rgba(255,212,94,0.18)',
      cardBorder: colors.accent.greenBorder,
    },
    {
      rank: 2,
      badgeColor: colors.text.secondary,
      badgeBg: 'rgba(200,205,210,0.16)',
      cardBorder: colors.border.default,
    },
    {
      rank: 3,
      badgeColor: '#d08a4a',
      badgeBg: 'rgba(205,127,50,0.16)',
      cardBorder: colors.border.default,
    },
  ];

  const sectionLabel = t('stats.allTime');

  return (
    <View style={styles.tabContent}>
      <SectionLabel label={sectionLabel} style={styles.sectionLabel} />

      {standings.map((s, index) => {
        const player = players.find((p) => p.id === s.playerId);
        if (!player) return null;

        return (
          <PlayerRankCard
            key={s.playerId}
            rank={index + 1}
            medal={MEDALS[index] ?? null}
            playerId={player.id}
            name={player.name}
            subText={t('stats.record', { played: s.played, wins: s.wins, draws: s.draws, losses: s.losses, gf: s.gf, ga: s.ga })}
            points={s.pts}
            pointsLabel={t('common.pts')}
            pointsColor={colors.accent.green}
          />
        );
      })}

      {standings.length === 0 && (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{t('stats.noMatches')}</Text>
        </View>
      )}

      {/* Stat tiles */}
      <View style={styles.tilesRow}>
        <View style={styles.statTile}>
          <Text style={styles.statTileLabel}>{t('stats.matchDaysPlayed')}</Text>
          <Text style={styles.statTileValue}>{matchDaysPlayed}</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statTileLabel}>{t('stats.goalsScored')}</Text>
          <Text style={[styles.statTileValue, styles.statTileValueGreen]}>
            {totalGoals}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// H2H tab
// ---------------------------------------------------------------------------
interface H2HTabProps {
  pairs: H2HPair[];
}

function H2HTab({ pairs }: H2HTabProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  return (
    <View style={styles.tabContent}>
      <SectionLabel label={t('stats.rivalries')} style={styles.sectionLabel} />

      {pairs.map((pair) => {
        const { playerA, playerB, aWins, bWins, draws, aGoals, bGoals, games } = pair;
        const totalDecisive = aWins + bWins;
        const aBarFlex = totalDecisive > 0 ? aWins / totalDecisive : 0.5;
        const bBarFlex = totalDecisive > 0 ? bWins / totalDecisive : 0.5;
        const allDraws = totalDecisive === 0;

        return (
          <View key={`${playerA.id}-${playerB.id}`} style={styles.h2hCard}>
            {/* Top row: Player A · games · Player B */}
            <View style={styles.h2hTopRow}>
              <View style={styles.h2hPlayerLeft}>
                <Avatar playerId={playerA.id} size="sm" />
                <Text style={styles.h2hPlayerName} numberOfLines={1}>
                  {playerA.name}
                </Text>
              </View>

              <View style={styles.h2hGamesWrap}>
                <Text style={styles.h2hGamesText}>{t('stats.h2hGames', { count: games })}</Text>
              </View>

              <View style={styles.h2hPlayerRight}>
                <Text style={styles.h2hPlayerName} numberOfLines={1}>
                  {playerB.name}
                </Text>
                <Avatar playerId={playerB.id} size="sm" />
              </View>
            </View>

            {/* Wins counts + draws label */}
            <View style={styles.h2hScoreRow}>
              <Text style={[styles.h2hWinsCount, { color: playerA.color }]}>
                {aWins}
              </Text>
              <Text style={styles.h2hDrawsLabel}>{t('stats.h2hDraws', { count: draws })}</Text>
              <Text style={[styles.h2hWinsCount, { color: playerB.color }]}>
                {bWins}
              </Text>
            </View>

            {/* Progress bar */}
            <View style={styles.h2hBarContainer}>
              {allDraws ? (
                <View
                  style={[
                    styles.h2hBarSegment,
                    {
                      flex: 1,
                      backgroundColor: colors.border.strong,
                      borderRadius: Radius.full,
                    },
                  ]}
                />
              ) : (
                <>
                  <View
                    style={[
                      styles.h2hBarSegment,
                      {
                        flex: aBarFlex,
                        backgroundColor: playerA.color,
                        borderTopLeftRadius: Radius.full,
                        borderBottomLeftRadius: Radius.full,
                        borderTopRightRadius: bWins === 0 ? Radius.full : 0,
                        borderBottomRightRadius: bWins === 0 ? Radius.full : 0,
                      },
                    ]}
                  />
                  {aWins > 0 && bWins > 0 && <View style={styles.h2hBarGap} />}
                  <View
                    style={[
                      styles.h2hBarSegment,
                      {
                        flex: bBarFlex,
                        backgroundColor: playerB.color,
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
            <Text style={styles.h2hGoals}>
              {t('stats.h2hGoals', { a: aGoals, b: bGoals })}
            </Text>
          </View>
        );
      })}

      {pairs.length === 0 && (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{t('stats.noRivalries')}</Text>
        </View>
      )}
    </View>
  );
}
