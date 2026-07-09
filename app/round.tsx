import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { calculateStandings, isTopTied } from '@/utils/standings';
import { useColors } from '@/theme';
import { Spacing } from '@/theme/spacing';
import {
  MatchCard,
  StandingCard,
  StandingsTable,
  getStandingsTableColumns,
  SectionLabel,
  EmptyState,
  GlowBackground,
  SegmentedControl,
  DropdownMenu,
  ConfirmDialog,
} from '@/components';
import { useDropdownMenu } from '@/hooks/useDropdownMenu';
import { groupMatchesByTour } from '@/utils/matchTours';
import { useTranslation } from 'react-i18next';
import { makeStyles } from '@/screens/round/round.styles';
import { useAddMatchFlow } from '@/screens/round/useAddMatchFlow';
import { AddMatchSheet } from '@/screens/round/AddMatchSheet';
import { trackEvent } from '@/analytics';
import {
  EndRoundDialog,
  NeedEqualDialog,
  WinnerCelebrationModal,
} from '@/screens/round/RoundDialogs';

type StandingsView = 'table' | 'cards';

export default function MatchdayScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const tournamentName = useStore((s) => s.tournamentName);
  const round = useStore((s) => s.round);
  const roundOpen = useStore((s) => s.roundOpen);
  const tournamentRanked = useStore((s) => s.tournamentRanked);
  const roundPlayers = useStore((s) => s.roundPlayers);
  const matches = useStore((s) => s.matches);
  const modal = useStore((s) => s.modal);
  const players = useStore((s) => s.players);
  const selectedMatchId = useStore((s) => s.selectedMatchId);
  const teams = useStore((s) => s.teams);
  const tournamentId = useStore((s) => s.tournamentId);
  const roundFolder = useStore((s) => s.roundFolder);
  const groupByTours = useStore((s) => s.groupByTours);
  const showAvgGoals = useStore((s) => s.showAvgGoals);
  const setModal = useStore((s) => s.setModal);
  const addMatch = useStore((s) => s.addMatch);
  const setSelectedMatch = useStore((s) => s.setSelectedMatch);
  const finishRound = useStore((s) => s.finishRound);
  const deleteMatch = useStore((s) => s.deleteMatch);
  const deleteRound = useStore((s) => s.deleteRound);

  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const roundMenu = useDropdownMenu();

  const [standingsView, setStandingsView] = useState<StandingsView>('table');
  const [localWinnerId, setLocalWinnerId] = useState<string | null>(null);

  const closeModal = useCallback(() => setModal(null), [setModal]);
  const addMatchFlow = useAddMatchFlow({
    tournamentRanked,
    tournamentId,
    roundFolder,
    players,
    addMatchToStore: addMatch,
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

  const handleOpenAddMatch = useCallback(() => {
    trackEvent('add_match_tapped');
    setModal('add');
  }, [setModal]);

  const handleFinishPress = useCallback(() => {
    if (matches.length === 0) {
      setModal('needEqual');
      return;
    }
    if (!allPlayedEqual) {
      setModal('needEqual');
      return;
    }
    setModal('end');
  }, [allPlayedEqual, matches.length, setModal]);

  const handleConfirmFinish = useCallback(() => {
    const s = calculateStandings(matches, roundPlayers);
    const isTrueDraw = isTopTied(s, matches);
    const winnerId = isTrueDraw || !s[0] ? null : s[0].playerId;
    setLocalWinnerId(winnerId);
    finishRound();
    trackEvent('round_finished', { matchCount: matches.length });
    setModal('winner');
  }, [matches, roundPlayers, finishRound, setModal]);

  const handleWinnerDone = useCallback(() => {
    setModal(null);
    router.push('/tournament');
  }, [setModal, router]);

  const handleConfirmDeleteRound = useCallback(() => {
    deleteRound();
    setModal(null);
    router.replace('/tournament');
  }, [deleteRound, setModal, router]);

  const winner = localWinnerId ? players.find((p) => p.id === localWinnerId) : null;
  const leader = standings[0];
  const leaderName = leader ? (players.find((p) => p.id === leader.playerId)?.name ?? '') : '';

  const tours = useMemo(
    () =>
      groupByTours
        ? groupMatchesByTour(matches, roundPlayers.length).reverse()
        : [{ tourNumber: 1, matches }],
    [matches, roundPlayers.length, groupByTours],
  );
  const showTourLabel =
    groupByTours &&
    (tours.length > 1 || matches.length >= (roundPlayers.length * (roundPlayers.length - 1)) / 2);

  const handleMatchPress = useCallback(
    (matchId: string) => {
      setSelectedMatch(matchId);
      router.push(`/match/${matchId}`);
    },
    [setSelectedMatch, router],
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
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {tournamentName}
          </Text>
          <Text style={styles.headerSubtitle}>
            {tournamentRanked
              ? t('matchday.round', { n: round })
              : t('common.friendly').toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {roundOpen ? (
            <TouchableOpacity
              ref={roundMenu.anchorRef}
              style={styles.dotsBtn}
              onPress={roundMenu.open}
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
            playerLabel={t('table.player').toUpperCase()}
            compact
            columns={getStandingsTableColumns(t, showAvgGoals)}
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
          <SectionLabel
            label={t('matchday.matchesSection', { count: matches.length }).toUpperCase()}
          />
          <View style={styles.matchesList}>
            {matches.length === 0 ? (
              <EmptyState
                message={t('matchday.noMatches')}
                ctaText={roundOpen ? t('matchday.noMatchesAction') : undefined}
                onPress={roundOpen ? handleOpenAddMatch : undefined}
              />
            ) : (
              tours.map((tour) => {
                const reversed = [...tour.matches].reverse();
                return (
                  <View key={tour.tourNumber} style={styles.tourGroup}>
                    {showTourLabel && (
                      <Text style={styles.tourLabel}>
                        {t('matchday.tour', { n: tour.tourNumber }).toUpperCase()}
                      </Text>
                    )}
                    <View style={styles.matchBlock}>
                      {reversed.map((m, idx) => (
                        <MatchCard
                          key={m.id}
                          match={m}
                          style={
                            idx < reversed.length - 1
                              ? styles.matchCardInBlock
                              : styles.matchCardInBlockLast
                          }
                          onPress={handleMatchPress}
                        />
                      ))}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Match CTA */}
      {roundOpen && (
        <View style={styles.fab}>
          <TouchableOpacity
            style={styles.fabBtn}
            onPress={handleOpenAddMatch}
            activeOpacity={0.85}
          >
            <Text style={styles.fabText}>{t('matchday.addMatch').toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      )}

      <AddMatchSheet
        visible={modal === 'add'}
        onClose={() => {
          closeModal();
          addMatchFlow.reset();
        }}
        tournamentRanked={tournamentRanked}
        tournamentPlayerList={tournamentPlayerList}
        players={players}
        teams={teams}
        matches={matches}
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

      <ConfirmDialog
        visible={modal === 'del'}
        onRequestClose={closeModal}
        icon="🗑"
        iconColor={colors.accent.red}
        variant="destructive"
        title={t('matchday.dialogs.deleteTitle').toUpperCase()}
        description={t('matchday.dialogs.deleteDesc')}
        cancel={{ label: t('matchday.dialogs.cancel'), onPress: closeModal }}
        confirm={{
          label: t('matchday.dialogs.delete'),
          onPress: () => {
            if (selectedMatchId) {
              deleteMatch(selectedMatchId);
              setSelectedMatch(null);
            }
            closeModal();
          },
        }}
      />

      <WinnerCelebrationModal
        visible={modal === 'winner'}
        onDone={handleWinnerDone}
        winnerId={localWinnerId}
        winner={winner}
      />

      <ConfirmDialog
        visible={modal === 'delRound'}
        onRequestClose={closeModal}
        icon="🗑"
        iconColor={colors.accent.red}
        variant="destructive"
        title={t('matchday.dialogs.deleteRoundTitle').toUpperCase()}
        description={t('matchday.dialogs.deleteRoundDesc')}
        cancel={{ label: t('matchday.dialogs.cancel'), onPress: closeModal }}
        confirm={{
          label: t('matchday.dialogs.deleteRoundConfirm'),
          onPress: handleConfirmDeleteRound,
        }}
      />

      {/* ---- Round Options Dropdown ---- */}
      <DropdownMenu
        visible={roundMenu.visible}
        onClose={roundMenu.close}
        position={roundMenu.position}
        items={[
          {
            key: 'finish',
            label: t('matchday.finish').toUpperCase(),
            onPress: () => {
              roundMenu.close();
              handleFinishPress();
            },
          },
          {
            key: 'stats',
            label: t('home.stats').toUpperCase(),
            onPress: () => {
              roundMenu.close();
              router.push('/stats');
            },
          },
          {
            key: 'delete',
            label: t('matchday.dialogs.deleteRoundConfirm'),
            destructive: true,
            onPress: () => {
              roundMenu.close();
              setModal('delRound');
            },
          },
        ]}
      />
    </SafeAreaView>
  );
}
