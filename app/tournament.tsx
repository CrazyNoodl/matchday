import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { calculateStandings } from '@/utils/standings';
import { formatShortDate } from '@/utils/dateFormat';
import { getRankedRoundOrdinals } from '@/utils/roundOrdinals';
import { hasAnyRecordedMatch } from '@/utils/tournamentGuards';
import { useColors } from '@/theme';
import {
  SectionLabel,
  GlowBackground,
  RoundCard,
  ShareStandingsModal,
  NewRoundModal,
  StandingsTable,
  getStandingsTableColumns,
} from '@/components';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '@/screens/tournament/tournament.styles';
import {
  TourSettingsSheet,
  EditTournamentNameSheet,
  CloseTournamentDialog,
} from '@/screens/tournament/TournamentModals';
import { trackEvent } from '@/analytics';
import type { ArchivedRound } from '@/store/types';

// ---------------------------------------------------------------------------
// Column definitions (outside component to avoid recreation on every render)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function TournamentScreen() {
  const router = useRouter();
  const tournamentName = useStore((s) => s.tournamentName);
  const round = useStore((s) => s.round);
  const roundOpen = useStore((s) => s.roundOpen);
  const tournamentRanked = useStore((s) => s.tournamentRanked);
  const tournamentRounds = useStore((s) => s.tournamentRounds);
  const tournamentPlayers = useStore((s) => s.tournamentPlayers);
  const matches = useStore((s) => s.matches);
  const archivedRounds = useStore((s) => s.archivedRounds);
  const players = useStore((s) => s.players);
  const modal = useStore((s) => s.modal);
  const setModal = useStore((s) => s.setModal);
  const setViewingRound = useStore((s) => s.setViewingRound);
  const renameTournament = useStore((s) => s.renameTournament);
  const closeTournament = useStore((s) => s.closeTournament);
  const deleteTournament = useStore((s) => s.deleteTournament);
  const showAvgGoals = useStore((s) => s.showAvgGoals);

  const colors = useColors();
  const styles = makeStyles(colors);

  const [renameValue, setRenameValue] = useState('');
  const [shareStandingsVisible, setShareStandingsVisible] = useState(false);
  const [roundsNewestFirst, setRoundsNewestFirst] = useState(true);
  const { t } = useTranslation();

  // #86: only when this is false is there truly nothing to archive.
  const hasAnyFinishedMatch = useMemo(
    () => hasAnyRecordedMatch(matches, archivedRounds),
    [matches, archivedRounds],
  );

  // All ranked matches across all archived rounds + current open round (if ranked)
  const allRankedMatches = useMemo(
    () => [
      ...archivedRounds.filter((r) => r.ranked).flatMap((r) => r.matches),
      ...(tournamentRanked && roundOpen ? matches : []),
    ],
    [archivedRounds, tournamentRanked, roundOpen, matches],
  );

  // All friendly matches across all archived rounds + current open round (if not ranked) —
  // only used by ShareStandingsModal's own include toggles, not the on-screen standings above.
  const allFriendlyMatches = useMemo(
    () => [
      ...archivedRounds.filter((r) => !r.ranked).flatMap((r) => r.matches),
      ...(!tournamentRanked && roundOpen ? matches : []),
    ],
    [archivedRounds, tournamentRanked, roundOpen, matches],
  );

  const standings = useMemo(
    () => calculateStandings(allRankedMatches, tournamentPlayers),
    [allRankedMatches, tournamentPlayers],
  );
  const leader = standings[0] ? players.find((p) => p.id === standings[0].playerId) : null;

  const roundOrdinals = getRankedRoundOrdinals(archivedRounds);
  const rankedCompleted = archivedRounds.filter((r) => r.ranked).length;
  const rankedTotal = rankedCompleted + (roundOpen && tournamentRanked ? 1 : 0);
  const roundsTarget = tournamentRounds > 0 ? tournamentRounds : rankedTotal;

  const headerSubtitle = t('tournament.headerSubtitle', {
    round: rankedTotal,
    total: roundsTarget,
    played: rankedCompleted,
    date: formatShortDate(new Date().toISOString()),
  });
  const shareRoundLabel = t('tournament.shareStandings.roundLabel', {
    round: rankedTotal,
    total: roundsTarget,
  });
  const sortedArchivedRounds = useMemo(
    () => (roundsNewestFirst ? [...archivedRounds].reverse() : archivedRounds),
    [archivedRounds, roundsNewestFirst],
  );

  const handleRoundPress = useCallback(
    (r: ArchivedRound) => {
      setViewingRound(r);
      router.push('/archive-day');
    },
    [setViewingRound, router],
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push('/')}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backChevron}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {tournamentName || t('tournament.sheet.title').toUpperCase()}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {headerSubtitle}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.dotsBtn}
          onPress={() => setModal('tourSettings')}
          activeOpacity={0.75}
        >
          <Text style={styles.dotsIcon}>···</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- TOURNAMENT STANDINGS ---- */}
        <SectionLabel label={t('tournament.standings').toUpperCase()} style={styles.sectionLabel} />

        <StandingsTable
          standings={standings}
          players={players}
          playerLabel={t('table.player').toUpperCase()}
          emptyLabel={t('tournament.noMatches')}
          columns={getStandingsTableColumns(t, showAvgGoals)}
        />

        {/* ---- CURRENT MATCH DAY (only if roundOpen) ---- */}
        {roundOpen && (
          <>
            <SectionLabel
              label={t('tournament.currentMatchDay').toUpperCase()}
              style={styles.sectionLabel}
            />

            <View style={styles.matchDayCard}>
              <View style={styles.matchDayLeft}>
                {/* Round badge */}
                <View style={styles.roundBadge}>
                  <Text style={styles.roundBadgeText}>
                    {t('tournament.roundBadge', { n: round })}
                  </Text>
                </View>

                {/* In progress label */}
                <View style={styles.inProgressRow}>
                  <View style={styles.inProgressDot} />
                  <Text style={styles.inProgressText}>
                    {t('tournament.inProgress').toUpperCase()}
                  </Text>
                </View>

                {/* Match count */}
                <Text style={styles.matchDayCount}>
                  {matches.length === 1
                    ? t('tournament.matchesToday', { count: matches.length })
                    : t('tournament.matchesTodayPlural', { count: matches.length })}
                </Text>

                {/* Leader */}
                {leader ? (
                  <Text style={styles.matchDayLeader} numberOfLines={1}>
                    {t('tournament.leader', { name: leader.nick ?? leader.name })}
                  </Text>
                ) : null}
              </View>

              {/* Play button */}
              <TouchableOpacity
                style={styles.playBtn}
                onPress={() => router.push('/round')}
                activeOpacity={0.8}
              >
                <Text style={styles.playBtnIcon}>▶</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ---- PLAYED ROUNDS ---- */}
        <View style={styles.playedRoundsHeader}>
          <SectionLabel
            label={t('tournament.playedRounds', { count: archivedRounds.length }).toUpperCase()}
          />

          {archivedRounds.length > 1 && (
            <TouchableOpacity
              style={styles.sortToggleBtn}
              onPress={() => setRoundsNewestFirst((v) => !v)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={
                roundsNewestFirst
                  ? t('tournament.sortNewestFirst')
                  : t('tournament.sortOldestFirst')
              }
            >
              <Text style={[styles.sortToggleIcon, !roundsNewestFirst && styles.sortToggleIconAsc]}>
                ▾
              </Text>
              <Text style={styles.sortToggleText}>
                {roundsNewestFirst
                  ? t('tournament.sortNewestFirst')
                  : t('tournament.sortOldestFirst')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {archivedRounds.length === 0 ? (
          <View style={styles.emptyRounds}>
            <Text style={styles.emptyRoundsText}>{t('tournament.noRounds')}</Text>
          </View>
        ) : (
          sortedArchivedRounds.map((r) => {
            const roundWinner = players.find((p) => p.id === r.winner);
            return (
              <RoundCard
                key={r.id}
                n={roundOrdinals[r.id] ?? 0}
                ranked={r.ranked}
                dateText={formatShortDate(r.date)}
                matchCountText={t('tournament.roundMatches', { count: r.games })}
                winnerId={roundWinner?.id}
                winnerName={roundWinner ? (roundWinner.nick ?? roundWinner.name) : '—'}
                onPress={() => handleRoundPress(r)}
              />
            );
          })
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        {roundOpen ? (
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/round')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>{t('tournament.continueMatchDay')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => setModal('newRound')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>{t('tournament.newMatchDay')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ================================================================
          MODALS
          ================================================================ */}

      <TourSettingsSheet
        visible={modal === 'tourSettings'}
        onClose={() => setModal(null)}
        tournamentName={tournamentName}
        onRename={() => {
          setRenameValue(tournamentName);
          setModal('editTourName');
        }}
        onShareStandings={() => {
          setModal(null);
          setShareStandingsVisible(true);
        }}
        onCloseTournament={() => setModal('closeTour')}
        canArchive={hasAnyFinishedMatch}
      />

      <EditTournamentNameSheet
        visible={modal === 'editTourName'}
        onClose={() => setModal('tourSettings')}
        value={renameValue}
        onChangeValue={setRenameValue}
        onSave={() => {
          const trimmed = renameValue.trim();
          if (trimmed) {
            renameTournament(trimmed);
          }
          setModal(null);
        }}
      />

      <CloseTournamentDialog
        visible={modal === 'closeTour'}
        onClose={() => setModal('tourSettings')}
        canArchive={hasAnyFinishedMatch}
        onConfirm={() => {
          closeTournament();
          trackEvent('tournament_closed');
          setModal(null);
          router.push('/');
        }}
        onDelete={() => {
          deleteTournament();
          trackEvent('tournament_deleted_empty');
          setModal(null);
          router.push('/');
        }}
      />

      {/* ---- New Round Sheet ---- */}
      <NewRoundModal />

      <ShareStandingsModal
        visible={shareStandingsVisible}
        onClose={() => setShareStandingsVisible(false)}
        tournamentName={tournamentName || t('tournament.sheet.title').toUpperCase()}
        subtitle={shareRoundLabel}
        rankedMatches={allRankedMatches}
        friendlyMatches={allFriendlyMatches}
        tournamentPlayers={tournamentPlayers}
        archivedRounds={archivedRounds}
      />
    </SafeAreaView>
  );
}
