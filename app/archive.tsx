import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated,  } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { useColors } from '@/theme';
import { NavHeader, GlowBackground, RoundCard } from '@/components';
import { ArchivedRound, ClosedTournament } from '@/store/types';
import { formatShortDate, formatYearShort } from '@/utils/dateFormat';
import { getRankedRoundOrdinals } from '@/utils/roundOrdinals';
import { makeStyles } from '@/screens/archive/archive.styles';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Round row inside an expanded tournament card
// ---------------------------------------------------------------------------

interface RoundRowProps {
  round: ArchivedRound;
  ordinal: number;
  onPress: () => void;
}

function RoundRow({ round, ordinal, onPress }: RoundRowProps) {
  const { t } = useTranslation();
  const winner = useStore((s) => s.players.find((p) => p.id === round.winner));
  return (
    <RoundCard
      variant="row"
      n={ordinal}
      ranked={round.ranked}
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
  const roundOrdinals = getRankedRoundOrdinals(tournament.rounds);

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
                {t('archive.championDaysWon', { count: champDaysWon })}
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
            <Text style={styles.statsBtnText}>{t('stats.title').replace('\n', ' ').toUpperCase()}</Text>
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
              <RoundRow key={r.id} round={r} ordinal={roundOrdinals[r.id] ?? 0} onPress={() => onRoundPress(r)} />
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
  const closedTournaments = useStore((s) => s.closedTournaments);
  const setViewingRound = useStore((s) => s.setViewingRound);
  const setViewingTournament = useStore((s) => s.setViewingTournament);

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
        title={t('archive.title').toUpperCase()}
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

