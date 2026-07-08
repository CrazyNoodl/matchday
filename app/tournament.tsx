import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { calculateStandings } from '@/utils/standings';
import { formatShortDate } from '@/utils/dateFormat';
import { getRankedRoundOrdinals } from '@/utils/roundOrdinals';
import { useColors } from '@/theme';
import { SectionLabel, GlowBackground, RoundCard, ShareStandingsModal, NewRoundModal, StandingsTable, getStandingsTableColumns } from '@/components';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '@/screens/tournament/tournament.styles';
import { TourSettingsSheet, EditTournamentNameSheet, CloseTournamentDialog } from '@/screens/tournament/TournamentModals';

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
  const store = useStore();

  const {
    tournamentName,
    round,
    roundOpen,
    tournamentRanked,
    tournamentRounds,
    tournamentPlayers,
    matches,
    archivedRounds,
    players,
    modal,
  } = store;

  const colors = useColors();
  const styles = makeStyles(colors);

  const [renameValue, setRenameValue] = useState('');
  const [shareStandingsVisible, setShareStandingsVisible] = useState(false);
  const { t } = useTranslation();

  // All ranked matches across all archived rounds + current open round (if ranked)
  const allRankedMatches = [
    ...archivedRounds.filter((r) => r.ranked).flatMap((r) => r.matches),
    ...(tournamentRanked && roundOpen ? matches : []),
  ];

  const standings = calculateStandings(allRankedMatches, tournamentPlayers);
  const leader = standings[0]
    ? players.find((p) => p.id === standings[0].playerId)
    : null;

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
  const shareRoundLabel = t('tournament.shareStandings.roundLabel', { round: rankedTotal, total: roundsTarget });

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
          onPress={() => store.setModal('tourSettings')}
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
          columns={getStandingsTableColumns(t)}
        />

        {/* ---- CURRENT MATCH DAY (only if roundOpen) ---- */}
        {roundOpen && (
          <>
            <SectionLabel label={t('tournament.currentMatchDay').toUpperCase()} style={styles.sectionLabel} />

            <View style={styles.matchDayCard}>
              <View style={styles.matchDayLeft}>
                {/* Round badge */}
                <View style={styles.roundBadge}>
                  <Text style={styles.roundBadgeText}>{t('tournament.roundBadge', { n: round })}</Text>
                </View>

                {/* In progress label */}
                <View style={styles.inProgressRow}>
                  <View style={styles.inProgressDot} />
                  <Text style={styles.inProgressText}>{t('tournament.inProgress').toUpperCase()}</Text>
                </View>

                {/* Match count */}
                <Text style={styles.matchDayCount}>
                  {matches.length === 1 ? t('tournament.matchesToday', { count: matches.length }) : t('tournament.matchesTodayPlural', { count: matches.length })}
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
        <SectionLabel
          label={t('tournament.playedRounds', { count: archivedRounds.length }).toUpperCase()}
          style={styles.sectionLabel}
        />

        {archivedRounds.length === 0 ? (
          <View style={styles.emptyRounds}>
            <Text style={styles.emptyRoundsText}>{t('tournament.noRounds')}</Text>
          </View>
        ) : (
          [...archivedRounds].reverse().map((r) => {
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
                onPress={() => {
                  store.setViewingRound(r);
                  router.push('/archive-day');
                }}
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
            onPress={() => store.setModal('newRound')}
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
        onClose={() => store.setModal(null)}
        tournamentName={tournamentName}
        onRename={() => {
          setRenameValue(tournamentName);
          store.setModal('editTourName');
        }}
        onShareStandings={() => {
          store.setModal(null);
          setShareStandingsVisible(true);
        }}
        onCloseTournament={() => store.setModal('closeTour')}
      />

      <EditTournamentNameSheet
        visible={modal === 'editTourName'}
        onClose={() => store.setModal('tourSettings')}
        value={renameValue}
        onChangeValue={setRenameValue}
        onSave={() => {
          const trimmed = renameValue.trim();
          if (trimmed) {
            store.renameTournament(trimmed);
          }
          store.setModal(null);
        }}
      />

      <CloseTournamentDialog
        visible={modal === 'closeTour'}
        onClose={() => store.setModal('tourSettings')}
        onConfirm={() => {
          store.closeTournament();
          store.setModal(null);
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
        standings={standings}
      />
    </SafeAreaView>
  );
}

