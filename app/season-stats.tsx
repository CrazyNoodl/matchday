import React, { useState, useMemo, useCallback } from 'react';
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
import { formatShortDate, formatYearShort } from '@/utils/dateFormat';
import { getPlayerDisplayName } from '@/utils/playerDisplay';
import { getRankedRoundOrdinals } from '@/utils/roundOrdinals';
import { useColors } from '@/theme';
import { NavHeader, SectionLabel, Avatar, MatchCard, GlowBackground, PlayerRankCard } from '@/components';
import type { ArchivedRound, Match } from '@/store/types';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '@/screens/season-stats/season-stats.styles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IncludeFilter = 'Rated' | 'Friendly' | 'Both';
type ParamChip = 'wdl' | 'gd' | 'gfa';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------


function filterRounds(
  rounds: ArchivedRound[],
  filter: IncludeFilter,
): ArchivedRound[] {
  if (filter === 'Rated') return rounds.filter((r) => r.ranked);
  if (filter === 'Friendly') return rounds.filter((r) => !r.ranked);
  return rounds;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SeasonStatsScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);

  const MEDALS: Record<number, { badgeColor: string; badgeBg: string; cardBorder: string }> = {
    1: {
      badgeColor: colors.accent.gold,
      badgeBg: 'rgba(255,212,94,0.18)',
      cardBorder: colors.accent.goldBorder,
    },
    2: {
      badgeColor: colors.text.secondary,
      badgeBg: 'rgba(200,205,210,0.16)',
      cardBorder: colors.border.default,
    },
    3: {
      badgeColor: '#d08a4a',
      badgeBg: 'rgba(205,127,50,0.16)',
      cardBorder: colors.border.default,
    },
  };

  const viewingTournament = useStore((s) => s.viewingTournament);
  const players = useStore((s) => s.players);
  const showNick = useStore((s) => s.showNick);

  const [includeFilter, setIncludeFilter] = useState<IncludeFilter>('Both');
  const [paramChip, setParamChip] = useState<ParamChip>('wdl');

  const handleMatchPress = useCallback(
    (matchId: string) => router.push(`/match/${matchId}`),
    [router],
  );

  function buildSubText(
    param: ParamChip,
    wins: number,
    draws: number,
    losses: number,
    gf: number,
    ga: number,
    gd: number,
    pts: number,
  ): string {
    if (param === 'wdl') return t('seasonStats.wdlStats', { wins, draws, losses, pts });
    if (param === 'gd') return t('seasonStats.goalDiff', { gd: gd > 0 ? `+${gd}` : String(gd) });
    return t('seasonStats.gfa', { gf, ga });
  }

  // Guard: no tournament selected
  if (!viewingTournament) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <NavHeader title={t('seasonStats.title').toUpperCase()} onBack={() => goBack()} />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{t('seasonStats.noTournament')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredRounds = useMemo(
    () => filterRounds(viewingTournament.rounds, includeFilter),
    [viewingTournament.rounds, includeFilter],
  );
  const roundOrdinals = useMemo(
    () => getRankedRoundOrdinals(viewingTournament.rounds),
    [viewingTournament.rounds],
  );

  const allMatches = useMemo<Match[]>(
    () => filteredRounds.flatMap((r) => r.matches),
    [filteredRounds],
  );

  const standings = useMemo(
    () => calculateStandings(allMatches, viewingTournament.players),
    [allMatches, viewingTournament.players],
  );

  const totalGoals = useMemo(
    () => allMatches.reduce((acc, m) => acc + m.aScore + m.bScore, 0),
    [allMatches],
  );

  const champDaysWon = useMemo(
    () =>
      filteredRounds.filter((r) => r.winner === viewingTournament.champId).length,
    [filteredRounds, viewingTournament.champId],
  );

  const d = new Date(viewingTournament.date);
  const fullYear = d.getFullYear();
  const shortYear = String(fullYear + 1).slice(-2);
  const seasonSubtitle = t('seasonStats.seasonSubtitle', { year1: fullYear, year2: shortYear });
  const fcYear = formatYearShort(viewingTournament.date);

  const includeFilters: { key: IncludeFilter; label: string }[] = [
    { key: 'Rated', label: t('seasonStats.rated') },
    { key: 'Friendly', label: t('seasonStats.friendly') },
    { key: 'Both', label: t('seasonStats.both') },
  ];
  const paramChips: { key: ParamChip; label: string }[] = [
    { key: 'wdl', label: t('seasonStats.wdlLabel') },
    { key: 'gd', label: t('seasonStats.goalDiffLabel') },
    { key: 'gfa', label: t('seasonStats.gfaLabel') },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />

      {/* Header */}
      <NavHeader title={t('seasonStats.title')} onBack={() => goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tournament name + season subtitle */}
        <View style={styles.tourHeader}>
          <Text style={styles.tourName} numberOfLines={1}>
            {viewingTournament.name}
          </Text>
          <Text style={styles.tourSubtitle}>{seasonSubtitle}</Text>
        </View>

        {/* INCLUDE filter chips */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>{t('seasonStats.include').toUpperCase()}</Text>
          <View style={styles.filterChips}>
            {includeFilters.map((f) => {
              const active = includeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setIncludeFilter(f.key)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Champion hero card */}
        <View style={styles.champCard}>
          {/* Avatar with gold ring */}
          <View style={styles.champAvatarWrap}>
            <Avatar
              playerId={viewingTournament.champId}
              size="xl"
              style={styles.champAvatar}
            />
          </View>

          {/* Middle info */}
          <View style={styles.champInfo}>
            <Text style={styles.champBadgeLabel}>
              {t('seasonStats.champion', { year: fcYear }).toUpperCase()}
            </Text>
            <Text style={styles.champName} numberOfLines={1}>
              {viewingTournament.champName}
            </Text>
            <Text style={styles.champMeta}>
              {t('seasonStats.champDays', { count: champDaysWon })}
            </Text>
          </View>

          {/* Gold diamond icon */}
          <Text style={styles.champDiamond}>♦</Text>
        </View>

        {/* Totals row: Days | Matches | Goals */}
        <View style={styles.totalsRow}>
          <View style={styles.totalCard}>
            <Text style={styles.totalValue}>{filteredRounds.length}</Text>
            <Text style={styles.totalLabel}>{t('seasonStats.days').toUpperCase()}</Text>
          </View>
          <View style={styles.totalCard}>
            <Text style={styles.totalValue}>{allMatches.length}</Text>
            <Text style={styles.totalLabel}>{t('seasonStats.matches').toUpperCase()}</Text>
          </View>
          <View style={styles.totalCard}>
            <Text style={[styles.totalValue, styles.totalValueGreen]}>
              {totalGoals}
            </Text>
            <Text style={styles.totalLabel}>{t('seasonStats.goals').toUpperCase()}</Text>
          </View>
        </View>

        {/* SEASON RANKING section */}
        <SectionLabel label={t('seasonStats.seasonRanking').toUpperCase()} style={styles.sectionLabel} />

        {/* Param chips */}
        <View style={styles.paramChipsRow}>
          {paramChips.map(({ key, label }) => {
            const active = paramChip === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.paramChip, active && styles.paramChipActive]}
                onPress={() => setParamChip(key)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.paramChipText,
                    active && styles.paramChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Ranking cards */}
        {standings.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{t('seasonStats.noMatchesFilter')}</Text>
          </View>
        ) : (
          standings.map((s, index) => {
            const rank = index + 1;
            const player = players.find((p) => p.id === s.playerId);
            const displayName = getPlayerDisplayName(player, showNick, '—');
            const subText = buildSubText(
              paramChip,
              s.wins,
              s.draws,
              s.losses,
              s.gf,
              s.ga,
              s.gd,
              s.pts,
            );

            return (
              <PlayerRankCard
                key={s.playerId}
                style={styles.rankCardSpacing}
                rank={rank}
                medal={MEDALS[rank] ?? null}
                playerId={s.playerId}
                name={displayName}
                subText={subText}
                points={s.pts}
                pointsLabel={t('seasonStats.pts')}
                pointsColor={rank === 1 ? colors.accent.green : undefined}
                emphasized={rank === 1}
              />
            );
          })
        )}

        {/* ── GAMES section ── */}
        <SectionLabel label={t('seasonStats.gamesSection').toUpperCase()} style={styles.sectionLabel} />

        {filteredRounds.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{t('seasonStats.noMatchesFilter')}</Text>
          </View>
        ) : (
          [...filteredRounds].reverse().map((round) => (
            <View key={round.id} style={styles.roundBlock}>
              {/* Round header */}
              <View style={styles.roundHeader}>
                <View style={styles.roundNumBadge}>
                  <Text style={styles.roundNumText}>{round.ranked ? (roundOrdinals[round.id] ?? 0) : '–'}</Text>
                </View>
                <View style={styles.roundHeaderInfo}>
                  <Text style={styles.roundHeaderTitle}>
                    {round.ranked ? t('matchday.round', { n: roundOrdinals[round.id] ?? 0 }) : t('common.friendly').toUpperCase()}
                  </Text>
                  <Text style={styles.roundHeaderDate}>{formatShortDate(round.date)}</Text>
                </View>
                {!round.ranked && (
                  <View style={styles.friendlyTag}>
                    <Text style={styles.friendlyTagText}>{t('seasonStats.friendly')}</Text>
                  </View>
                )}
                {round.winner ? (
                  <View style={styles.roundWinnerArea}>
                    <Avatar playerId={round.winner} size="sm" />
                  </View>
                ) : null}
              </View>

              {/* Matches */}
              {round.matches.length === 0 ? (
                <View style={styles.roundEmptyRow}>
                  <Text style={styles.roundEmptyText}>—</Text>
                </View>
              ) : (
                [...round.matches].reverse().map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => handleMatchPress(m.id)}
                    activeOpacity={0.75}
                  >
                    <MatchCard match={m} readonly />
                  </TouchableOpacity>
                ))
              )}
            </View>
          ))
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
