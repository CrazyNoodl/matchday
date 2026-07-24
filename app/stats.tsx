import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { calculateStandings } from '@/utils/standings';
import {
  collectAllMatches,
  collectPlayerIds,
  buildH2HPairs,
  sumGoals,
  countMatchDaysPlayed,
  type H2HPair,
} from '@/utils/statsAggregation';
import { useColors } from '@/theme';
import {
  NavHeader,
  SectionLabel,
  GlowBackground,
  SegmentedControl,
  PlayerRankCard,
  H2HCard,
} from '@/components';
import type { Match, Player } from '@/store/types';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '@/screens/stats/stats.styles';

type Tab = 'ranking' | 'h2h';

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function StatsScreen() {
  const goBack = useGoBack();
  const colors = useColors();
  const styles = makeStyles(colors);
  const [activeTab, setActiveTab] = useState<Tab>('ranking');
  const { t } = useTranslation();

  const { scope } = useLocalSearchParams<{ scope?: string }>();
  // Opened from the round screen mid-tournament (#87): scope to the active
  // tournament only, same as if closedTournaments were empty — the season-wide
  // view (default, no param) stays the behavior for the Home > Stats entry.
  const tournamentOnly = scope === 'tournament';

  const tournamentPlayers = useStore((s) => s.tournamentPlayers);
  const archivedRounds = useStore((s) => s.archivedRounds);
  const currentMatches = useStore((s) => s.matches);
  const allClosedTournaments = useStore((s) => s.closedTournaments);
  const closedTournaments = useMemo(
    () => (tournamentOnly ? [] : allClosedTournaments),
    [tournamentOnly, allClosedTournaments],
  );
  const players = useStore((s) => s.players);

  // Combine all matches: closed tournaments + current tournament archived rounds + current round
  const allMatches = useMemo<Match[]>(
    () => collectAllMatches(closedTournaments, archivedRounds, currentMatches),
    [closedTournaments, archivedRounds, currentMatches],
  );

  // Player IDs — union of current tournament + all closed tournaments
  const playerIds = useMemo<string[]>(
    () => collectPlayerIds(tournamentPlayers, closedTournaments, allMatches),
    [tournamentPlayers, closedTournaments, allMatches],
  );

  const standings = useMemo(
    () => calculateStandings(allMatches, playerIds),
    [allMatches, playerIds],
  );

  const totalGoals = useMemo(() => sumGoals(allMatches), [allMatches]);
  const matchDaysPlayed = useMemo(
    () => countMatchDaysPlayed(archivedRounds, closedTournaments),
    [archivedRounds, closedTournaments],
  );

  // H2H pairs — all combinations of player IDs
  const h2hPairs = useMemo<H2HPair[]>(
    () => buildH2HPairs(playerIds, players, allMatches),
    [playerIds, players, allMatches],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <GlowBackground />
      <NavHeader title={t('stats.title').toUpperCase()} onBack={() => goBack()} />

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
          <H2HTab pairs={h2hPairs} tournamentOnly={tournamentOnly} />
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

function RankingTab({ standings, players, totalGoals, matchDaysPlayed }: RankingTabProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);

  const MEDALS = useMemo(
    () => [
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
    ],
    [colors],
  );

  const sectionLabel = t('stats.allTime').toUpperCase();

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
            subText={t('stats.record', {
              played: s.played,
              wins: s.wins,
              draws: s.draws,
              losses: s.losses,
              gf: s.gf,
              ga: s.ga,
            })}
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
          <Text style={styles.statTileLabel}>{t('stats.matchDaysPlayed').toUpperCase()}</Text>
          <Text style={styles.statTileValue}>{matchDaysPlayed}</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statTileLabel}>{t('stats.goalsScored').toUpperCase()}</Text>
          <Text style={[styles.statTileValue, styles.statTileValueGreen]}>{totalGoals}</Text>
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
  tournamentOnly: boolean;
}

function H2HTab({ pairs, tournamentOnly }: H2HTabProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();

  return (
    <View style={styles.tabContent}>
      <SectionLabel label={t('stats.rivalries').toUpperCase()} style={styles.sectionLabel} />

      {pairs.map((pair) => (
        <TouchableOpacity
          key={`${pair.playerA.id}-${pair.playerB.id}`}
          activeOpacity={0.85}
          delayLongPress={3000}
          onLongPress={() =>
            router.push(
              `/rivalry/${pair.playerA.id}/${pair.playerB.id}${tournamentOnly ? '?scope=tournament' : ''}`,
            )
          }
        >
          <H2HCard pair={pair} />
        </TouchableOpacity>
      ))}

      {pairs.length === 0 && (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{t('stats.noRivalries')}</Text>
        </View>
      )}
    </View>
  );
}
