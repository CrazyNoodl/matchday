import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { calculateStandings, isTopTied } from '@/utils/standings';
import { useColors } from '@/theme';
import { Spacing } from '@/theme/spacing';
import { MatchCard, StandingCard, StandingsTable, getStandingsTableColumns, SectionLabel, EmptyState, GlowBackground, SegmentedControl, Sheet } from '@/components';
import { groupMatchesByTour } from '@/utils/matchTours';
import { useTranslation } from 'react-i18next';
import { makeStyles, makeSheetStyles } from '@/screens/round/round.styles';
import { useAddMatchFlow } from '@/screens/round/useAddMatchFlow';
import { AddMatchSheet } from '@/screens/round/AddMatchSheet';
import {
  EndRoundDialog,
  NeedEqualDialog,
  DeleteMatchDialog,
  DeleteRoundDialog,
  WinnerCelebrationModal,
} from '@/screens/round/RoundDialogs';

type StandingsView = 'table' | 'cards';

export default function MatchdayScreen() {
  const router = useRouter();
  const store = useStore();
  const { t } = useTranslation();

  const {
    tournamentName,
    round,
    roundOpen,
    tournamentRanked,
    roundPlayers,
    matches,
    modal,
    players,
    selectedMatchId,
    teams,
  } = store;

  const colors = useColors();
  const styles = makeStyles(colors);
  const sheetStyles = makeSheetStyles(colors);

  const [standingsView, setStandingsView] = useState<StandingsView>('table');
  const [localWinnerId, setLocalWinnerId] = useState<string | null>(null);

  const closeModal = useCallback(() => store.setModal(null), [store]);
  const addMatchFlow = useAddMatchFlow({
    tournamentRanked,
    players,
    addMatchToStore: store.addMatch,
    closeModal,
  });

  const standings = useMemo(
    () => calculateStandings(matches, roundPlayers),
    [matches, roundPlayers],
  );

  const tournamentPlayerList = useMemo(
    () => players.filter((p) => roundPlayers.includes(p.id)),
    [players, roundPlayers],
  );

  // ---- Match validation ----
  const allPlayedEqual = useMemo(() => {
    if (standings.length === 0) return true;
    const counts = standings.map((s) => s.played);
    return counts.every((c) => c === counts[0]);
  }, [standings]);

  const handleFinishPress = useCallback(() => {
    if (matches.length === 0) {
      store.setModal('needEqual');
      return;
    }
    if (!allPlayedEqual) {
      store.setModal('needEqual');
      return;
    }
    store.setModal('end');
  }, [allPlayedEqual, matches.length, store]);

  const handleConfirmFinish = useCallback(() => {
    const s = calculateStandings(matches, roundPlayers);
    const isTrueDraw = isTopTied(s, matches);
    const winnerId = isTrueDraw || !s[0] ? null : s[0].playerId;
    setLocalWinnerId(winnerId);
    store.finishRound();
    store.setModal('winner');
  }, [matches, roundPlayers, store]);

  const handleWinnerDone = useCallback(() => {
    store.setModal(null);
    router.push('/tournament');
  }, [store, router]);

  const handleConfirmDeleteRound = useCallback(() => {
    store.deleteRound();
    store.setModal(null);
    router.push('/tournament');
  }, [store, router]);

  const winner = localWinnerId ? players.find((p) => p.id === localWinnerId) : null;
  const leader = standings[0];
  const leaderName = leader ? (players.find((p) => p.id === leader.playerId)?.name ?? '') : '';

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
          <Text style={styles.headerTitle}>{tournamentName}</Text>
          <Text style={styles.headerSubtitle}>{t('matchday.round', { n: round })}</Text>
        </View>
        <View style={styles.headerRight}>
          {roundOpen ? (
            <TouchableOpacity
              style={styles.dotsBtn}
              onPress={() => store.setModal('roundSettings')}
              activeOpacity={0.75}
            >
              <Text style={styles.dotsIcon}>···</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.statsBtn}
              onPress={() => router.push('/stats')}
              activeOpacity={0.75}
            >
              <Text style={styles.statsBtnIcon}>📊</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Standings toggle */}
      <View style={styles.toggleContainer}>
        <SegmentedControl
          value={standingsView}
          onChange={setStandingsView}
          options={[
            { value: 'table', label: t('matchday.table') },
            { value: 'cards', label: t('matchday.cards') },
          ]}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Standings */}
        {standingsView === 'table' ? (
          <StandingsTable
            style={{ marginBottom: Spacing.lg }}
            standings={standings}
            players={players}
            playerLabel={t('table.player')}
            compact
            columns={getStandingsTableColumns(t)}
          />
        ) : (
          <View style={styles.cardsContainer}>
            {standings.map((s, idx) => (
              <StandingCard
                key={s.playerId}
                standing={s}
                position={idx + 1}
                playerId={s.playerId}
              />
            ))}
          </View>
        )}

        {/* Matches */}
        <View style={styles.matchesSection}>
          <SectionLabel label={t('matchday.matchesSection', { count: matches.length })} />
          <View style={styles.matchesList}>
            {matches.length === 0 ? (
              <EmptyState
                message={t('matchday.noMatches')}
                ctaText={roundOpen ? t('matchday.noMatchesAction') : undefined}
                onPress={roundOpen ? () => store.setModal('add') : undefined}
              />
            ) : (() => {
              const tours = groupMatchesByTour(matches, roundPlayers.length).reverse();
              const showTourLabel = tours.length > 1 || matches.length >= (roundPlayers.length * (roundPlayers.length - 1)) / 2;
              return tours.map((tour) => {
                const reversed = [...tour.matches].reverse();
                return (
                  <View key={tour.tourNumber} style={styles.tourGroup}>
                    {showTourLabel && (
                      <Text style={styles.tourLabel}>{t('matchday.tour', { n: tour.tourNumber })}</Text>
                    )}
                    <View style={styles.matchBlock}>
                      {reversed.map((m, idx) => (
                        <MatchCard
                          key={m.id}
                          match={m}
                          style={idx < reversed.length - 1 ? styles.matchCardInBlock : styles.matchCardInBlockLast}
                          onPress={() => {
                            store.setSelectedMatch(m.id);
                            router.push(`/match/${m.id}`);
                          }}
                        />
                      ))}
                    </View>
                  </View>
                );
              });
            })()}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Match CTA */}
      {roundOpen && (
        <View style={styles.fab}>
          <TouchableOpacity
            style={styles.fabBtn}
            onPress={() => store.setModal('add')}
            activeOpacity={0.85}
          >
            <Text style={styles.fabText}>{t('matchday.addMatch')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <AddMatchSheet
        visible={modal === 'add'}
        onClose={() => { closeModal(); addMatchFlow.reset(); }}
        tournamentRanked={tournamentRanked}
        tournamentPlayerList={tournamentPlayerList}
        players={players}
        teams={teams}
        flow={addMatchFlow}
      />

      <EndRoundDialog
        visible={modal === 'end'}
        onClose={closeModal}
        onConfirm={handleConfirmFinish}
        leader={leader}
        leaderName={leaderName}
      />

      <NeedEqualDialog
        visible={modal === 'needEqual'}
        onClose={closeModal}
        standings={standings}
        players={players}
      />

      <DeleteMatchDialog
        visible={modal === 'del'}
        onClose={closeModal}
        onConfirm={() => {
          if (selectedMatchId) {
            store.deleteMatch(selectedMatchId);
            store.setSelectedMatch(null);
          }
          closeModal();
        }}
      />

      <WinnerCelebrationModal
        visible={modal === 'winner'}
        onDone={handleWinnerDone}
        winnerId={localWinnerId}
        winner={winner}
      />

      <DeleteRoundDialog
        visible={modal === 'delRound'}
        onClose={closeModal}
        onConfirm={handleConfirmDeleteRound}
      />

      {/* ---- Round Settings Sheet ---- */}
      <Sheet visible={modal === 'roundSettings'} onClose={closeModal}>
        <View style={sheetStyles.sheet}>
          <View style={sheetStyles.sheetHeaderRow}>
            <Text style={sheetStyles.sheetTitle}>{t('matchday.roundSettings')}</Text>
            <TouchableOpacity
              style={sheetStyles.doneBtn}
              onPress={closeModal}
              activeOpacity={0.75}
            >
              <Text style={sheetStyles.doneBtnText}>{t('matchday.winner.done')}</Text>
            </TouchableOpacity>
          </View>

          <View style={sheetStyles.rows}>
            {/* Finish Round */}
            <TouchableOpacity
              style={sheetStyles.row}
              onPress={() => {
                closeModal();
                handleFinishPress();
              }}
              activeOpacity={0.8}
            >
              <View style={[sheetStyles.rowIcon, { backgroundColor: 'rgba(246,195,80,0.12)' }]}>
                <Text style={sheetStyles.rowIconText}>🏁</Text>
              </View>
              <Text style={sheetStyles.rowLabel}>{t('matchday.finish')}</Text>
              <Text style={sheetStyles.rowChevron}>›</Text>
            </TouchableOpacity>

            {/* Stats */}
            <TouchableOpacity
              style={sheetStyles.row}
              onPress={() => {
                closeModal();
                router.push('/stats');
              }}
              activeOpacity={0.8}
            >
              <View style={[sheetStyles.rowIcon, { backgroundColor: colors.accent.blueSubtle }]}>
                <Text style={sheetStyles.rowIconText}>📊</Text>
              </View>
              <Text style={sheetStyles.rowLabel}>{t('home.stats')}</Text>
              <Text style={sheetStyles.rowChevron}>›</Text>
            </TouchableOpacity>

            {/* Delete Round */}
            <TouchableOpacity
              style={sheetStyles.row}
              onPress={() => store.setModal('delRound')}
              activeOpacity={0.8}
            >
              <View style={[sheetStyles.rowIcon, { backgroundColor: colors.accent.redSubtle }]}>
                <Text style={[sheetStyles.rowIconText, { color: colors.accent.red }]}>🗑</Text>
              </View>
              <Text style={[sheetStyles.rowLabel, { color: colors.accent.red }]}>{t('matchday.dialogs.deleteRoundConfirm')}</Text>
              <Text style={sheetStyles.rowChevron}>›</Text>
            </TouchableOpacity>
          </View>

          {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
        </View>
      </Sheet>
    </SafeAreaView>
  );
}
