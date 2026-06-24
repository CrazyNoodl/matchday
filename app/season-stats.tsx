import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { NavHeader } from '@/components/NavHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { Avatar } from '@/components/Avatar';
import { MatchCard } from '@/components/MatchCard';
import { GlowBackground } from '@/components/GlowBackground';
import { PlayerRankCard } from '@/components/PlayerRankCard';
import type { ArchivedRound, Match } from '@/store/types';
import { useTranslation } from 'react-i18next';

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
// Medal config
// ---------------------------------------------------------------------------

const MEDALS: Record<number, { badgeColor: string; badgeBg: string; cardBorder: string }> = {
  1: {
    badgeColor: Colors.accent.gold,
    badgeBg: 'rgba(255,212,94,0.18)',
    cardBorder: Colors.accent.goldBorder,
  },
  2: {
    badgeColor: Colors.text.secondary,
    badgeBg: 'rgba(200,205,210,0.16)',
    cardBorder: Colors.border.default,
  },
  3: {
    badgeColor: '#d08a4a',
    badgeBg: 'rgba(205,127,50,0.16)',
    cardBorder: Colors.border.default,
  },
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SeasonStatsScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { t } = useTranslation();
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
        <NavHeader title={t('seasonStats.title')} onBack={() => goBack()} />
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
          <Text style={styles.filterLabel}>{t('seasonStats.include')}</Text>
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
              {t('seasonStats.champion', { year: fcYear })}
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
            <Text style={styles.totalLabel}>{t('seasonStats.days')}</Text>
          </View>
          <View style={styles.totalCard}>
            <Text style={styles.totalValue}>{allMatches.length}</Text>
            <Text style={styles.totalLabel}>{t('seasonStats.matches')}</Text>
          </View>
          <View style={styles.totalCard}>
            <Text style={[styles.totalValue, styles.totalValueGreen]}>
              {totalGoals}
            </Text>
            <Text style={styles.totalLabel}>{t('seasonStats.goals')}</Text>
          </View>
        </View>

        {/* SEASON RANKING section */}
        <SectionLabel label={t('seasonStats.seasonRanking')} style={styles.sectionLabel} />

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
                pointsColor={rank === 1 ? Colors.accent.green : undefined}
                emphasized={rank === 1}
              />
            );
          })
        )}

        {/* ── GAMES section ── */}
        <SectionLabel label={t('seasonStats.gamesSection')} style={styles.sectionLabel} />

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
                  <Text style={styles.roundNumText}>{round.n}</Text>
                </View>
                <View style={styles.roundHeaderInfo}>
                  <Text style={styles.roundHeaderTitle}>
                    {t('matchday.round', { n: round.n })}
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 48,
  },

  // Tournament header
  tourHeader: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: 4,
  },
  tourName: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['2xl'],
    color: Colors.text.primary,
    letterSpacing: 0.3,
  },
  tourSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },

  // Include filter row
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  filterLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  filterChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterChip: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  filterChipActive: {
    backgroundColor: Colors.accent.green,
    borderColor: Colors.accent.green,
  },
  filterChipText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  filterChipTextActive: {
    color: Colors.accent.greenDark,
  },

  // Champion hero card
  champCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,212,94,0.30)',
    padding: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  champAvatarWrap: {
    borderWidth: 2,
    borderColor: Colors.accent.gold,
    borderRadius: 19,
    padding: 2,
  },
  champAvatar: {
    // xl = 50px, borderRadius handled inside Avatar
  },
  champInfo: {
    flex: 1,
    gap: 3,
  },
  champBadgeLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.accent.green,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  champName: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['3xl'],
    color: Colors.text.primary,
    letterSpacing: 0.3,
    lineHeight: 34,
  },
  champMeta: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  champDiamond: {
    fontSize: 36,
    color: Colors.accent.gold,
  },

  // Totals row
  totalsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  totalCard: {
    flex: 1,
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 3,
  },
  totalValue: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  totalValueGreen: {
    color: Colors.accent.green,
  },
  totalLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 0.8,
  },

  // Section label
  sectionLabel: {
    marginBottom: Spacing.md,
  },

  // Param chips
  paramChipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  paramChip: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  paramChipActive: {
    borderColor: Colors.accent.greenBorder,
    backgroundColor: Colors.accent.greenSubtle,
  },
  paramChipText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  paramChipTextActive: {
    color: Colors.accent.green,
  },

  // Ranking cards
  rankCardSpacing: {
    marginBottom: Spacing.sm,
  },

  // Games / rounds table
  roundBlock: {
    marginBottom: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
    backgroundColor: Colors.bg.surface,
  },
  roundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    backgroundColor: Colors.bg.elevated,
  },
  roundNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  roundNumText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  roundHeaderInfo: {
    flex: 1,
    gap: 1,
  },
  roundHeaderTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  roundHeaderDate: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  friendlyTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border.strong,
    backgroundColor: Colors.bg.surface,
  },
  friendlyTagText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 0.5,
  },
  roundWinnerArea: {
    flexShrink: 0,
  },
  roundEmptyRow: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  roundEmptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },

  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: Colors.text.placeholder,
  },
});
