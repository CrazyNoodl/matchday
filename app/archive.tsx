import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { useColors, AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { NavHeader } from '@/components/NavHeader';
import { GlowBackground } from '@/components/GlowBackground';
import { RoundCard } from '@/components/RoundCard';
import { ArchivedRound, ClosedTournament } from '@/store/types';
import { formatShortDate, formatYearShort } from '@/utils/dateFormat';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Round row inside an expanded tournament card
// ---------------------------------------------------------------------------

interface RoundRowProps {
  round: ArchivedRound;
  onPress: () => void;
}

function RoundRow({ round, onPress }: RoundRowProps) {
  const { t } = useTranslation();
  const winner = useStore((s) => s.players.find((p) => p.id === round.winner));
  return (
    <RoundCard
      variant="row"
      n={round.n}
      dateText={formatShortDate(round.date)}
      matchCountText={t('archive.roundMatches', { count: round.matches.length })}
      winnerId={round.winner}
      winnerName={winner?.nick ?? winner?.name ?? '—'}
      onPress={onPress}
    />
  );
}

// ---------------------------------------------------------------------------
// Closed tournament card (accordion)
// ---------------------------------------------------------------------------

interface ClosedTournamentCardProps {
  tournament: ClosedTournament;
  onRoundPress: (round: ArchivedRound) => void;
  onStatsPress: () => void;
}

function ClosedTournamentCard({
  tournament,
  onRoundPress,
  onStatsPress,
}: ClosedTournamentCardProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const champDaysWon = tournament.rounds.filter(
    (r) => r.winner === tournament.champId,
  ).length;

  const d = new Date(tournament.date);
  const fullYear = d.getFullYear();
  const shortYear = String(fullYear + 1).slice(-2);
  const year = formatYearShort(tournament.date);
  const seasonSubtitle = t('archive.season', {
    year1: fullYear,
    year2: shortYear,
    count: tournament.rounds.length,
  });

  return (
    <View style={styles.tourCard}>
      <TouchableOpacity
        style={styles.tourCardHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={styles.fcIcon}>
          <Text style={styles.fcIconText}>{'FC'}</Text>
          <Text style={styles.fcIconYear}>{year}</Text>
        </View>

        <View style={styles.tourTitleArea}>
          <Text style={styles.tourName} numberOfLines={1}>
            {tournament.name}
          </Text>
          <Text style={styles.tourSubtitle} numberOfLines={1}>
            {seasonSubtitle}
          </Text>

          {tournament.champId ? (
            <View style={styles.champRow}>
              <Text style={styles.champDiamond}>♦</Text>
              <View
                style={[
                  styles.champAvatarSmall,
                  { backgroundColor: tournament.champColor },
                ]}
              >
                <Text style={styles.champInitSmall}>{tournament.champInit}</Text>
              </View>
              <Text style={styles.champNameText} numberOfLines={1}>
                {tournament.champName}
              </Text>
              <Text style={styles.champMeta}>
                champion · {champDaysWon}d won
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.tourCardRight}>
          <TouchableOpacity
            style={styles.statsBtn}
            onPress={(e) => {
              e.stopPropagation();
              onStatsPress();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.statsBtnText}>{t('stats.title').replace('\n', ' ')}</Text>
          </TouchableOpacity>
          <Text style={[styles.chevron, expanded && styles.chevronExpanded]}>
            ›
          </Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.roundsList}>
          <View style={styles.roundsDivider} />
          {tournament.rounds.length === 0 ? (
            <View style={styles.noRoundsRow}>
              <Text style={styles.noRoundsText}>{t('tournament.noRounds')}</Text>
            </View>
          ) : (
            [...tournament.rounds].reverse().map((r) => (
              <RoundRow key={r.id} round={r} onPress={() => onRoundPress(r)} />
            ))
          )}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyArchive() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { t } = useTranslation();
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyIcon}>📂</Text>
      <Text style={styles.emptyTitle}>{t('archive.noArchive')}</Text>
      <Text style={styles.emptySubtitle}>{t('archive.noArchiveDesc')}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ArchiveScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const goBack = useGoBack();
  const { t } = useTranslation();
  const store = useStore();

  const {
    closedTournaments,
    setViewingRound,
    setViewingTournament,
  } = store;

  const handleRoundPress = useCallback(
    (round: ArchivedRound) => {
      setViewingRound(round);
      router.push('/archive-day');
    },
    [setViewingRound, router],
  );

  const handleStatsPress = useCallback(
    (tournament: ClosedTournament) => {
      setViewingTournament(tournament);
      router.push('/season-stats');
    },
    [setViewingTournament, router],
  );

  const hasAnything = closedTournaments.length > 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />

      <NavHeader
        title={t('archive.title')}
        onBack={() => goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!hasAnything ? (
          <EmptyArchive />
        ) : (
          <>
            {[...closedTournaments].reverse().map((tournament) => (
              <ClosedTournamentCard
                key={tournament.id}
                tournament={tournament}
                onRoundPress={handleRoundPress}
                onStatsPress={() => handleStatsPress(tournament)}
              />
            ))}
          </>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const makeStyles = (colors: AppColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: 40,
  },

  tourCard: {
    backgroundColor: colors.bg.archive,
    borderRadius: Radius['3xl'],
    borderWidth: 1,
    borderColor: colors.border.medium,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  tourCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
    gap: Spacing.md,
  },

  fcIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fcIconText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.sm,
    color: colors.text.muted,
    letterSpacing: 0.5,
    lineHeight: 14,
  },
  fcIconYear: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    color: colors.text.primary,
    lineHeight: 22,
  },

  tourTitleArea: {
    flex: 1,
    gap: 3,
    paddingTop: 2,
  },
  tourNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  tourName: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.lg,
    color: colors.text.primary,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  tourSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },

  champRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  champDiamond: {
    fontSize: 11,
    color: colors.accent.gold,
  },
  champAvatarSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  champInitSmall: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 8,
    color: colors.bg.base,
  },
  champNameText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: colors.text.secondary,
    flexShrink: 1,
  },
  champMeta: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },

  tourCardRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingTop: 2,
    flexShrink: 0,
  },
  statsBtn: {
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statsBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.text.secondary,
  },
  chevron: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    color: colors.text.muted,
    transform: [{ rotate: '0deg' }],
    lineHeight: 22,
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },

  roundsDivider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginHorizontal: 18,
  },
  roundsList: {
    paddingBottom: Spacing.sm,
  },
  noRoundsRow: {
    paddingHorizontal: 18,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  noRoundsText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.muted,
  },

  emptyCard: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderStyle: 'dashed',
    borderRadius: Radius['2xl'],
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.lg,
    color: colors.text.secondary,
    letterSpacing: 0.2,
  },
  emptySubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
  },
});
