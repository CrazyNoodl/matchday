import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { calculateStandings } from '@/utils/standings';
import { formatShortDate, formatEditableDate, parseEditableDate } from '@/utils/dateFormat';
import { useColors } from '@/theme';
import {
  NavHeader,
  SectionLabel,
  MatchCard,
  ShareRoundModal,
  CardAvatar,
  StandingsTable,
  getStandingsTableColumns,
  GlowBackground,
  ConfirmDialog,
  DropdownMenu,
} from '@/components';
import { useDropdownMenu } from '@/hooks/useDropdownMenu';
import { groupMatchesByTour } from '@/utils/matchTours';
import { getRankedRoundOrdinals, EMPTY_ROUNDS } from '@/utils/roundOrdinals';
import { type Match } from '@/store/types';
import { makeStyles } from '@/screens/archive-day/archive-day.styles';
import { EditRoundDateSheet } from '@/screens/archive-day/ArchiveDayModals';

// ---------------------------------------------------------------------------
// Day Winner Banner
// ---------------------------------------------------------------------------

interface DayWinnerBannerProps {
  winnerId: string;
  matchCount: number;
}

function DayWinnerBanner({ winnerId, matchCount }: DayWinnerBannerProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { t } = useTranslation();
  const player = useStore((s) => s.players.find((p) => p.id === winnerId));
  const name = player?.name ?? '—';

  return (
    <View style={styles.winnerCard}>
      <Text style={styles.winnerLabel}>♦ {t('archive.dayWinner').toUpperCase()} ♦</Text>
      <Text style={styles.winnerMatchCount}>
        {t('archive.matchCount', { count: matchCount }).toUpperCase()}
      </Text>
      <View style={styles.winnerLogoWrap}>
        <CardAvatar teamCode={player?.teamCode} size={56} />
      </View>
      <Text style={styles.winnerName} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ArchiveDayScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const goBack = useGoBack();
  const { t } = useTranslation();
  const viewingRound = useStore((s) => s.viewingRound);
  // Re-derive from live archivedRounds so edits (swap, stats) reflect immediately.
  // Falls back to the snapshot for closed-tournament rounds (not in archivedRounds).
  const liveRound = useStore((s) =>
    viewingRound ? (s.archivedRounds.find((r) => r.id === viewingRound.id) ?? viewingRound) : null,
  );
  const tournamentName = useStore((s) => s.viewingTournament?.name ?? s.tournamentName ?? '');
  const players = useStore((s) => s.players);
  const hasTournament = useStore((s) => s.hasTournament);
  const updateRoundDate = useStore((s) => s.updateRoundDate);
  // Editable only while the round still lives in the open tournament's
  // archivedRounds — once closeTournament() runs it moves to closedTournaments
  // and becomes read-only, same rule as match editing (see CLAUDE.md).
  const isEditableRound = useStore(
    (s) =>
      hasTournament && !!viewingRound && s.archivedRounds.some((r) => r.id === viewingRound.id),
  );
  const deleteArchivedRound = useStore((s) => s.deleteArchivedRound);
  const groupByTours = useStore((s) => s.groupByTours);
  const showAvgGoals = useStore((s) => s.showAvgGoals);
  const roundsForOrdinal = useStore((s) =>
    viewingRound && s.archivedRounds.some((r) => r.id === viewingRound.id)
      ? s.archivedRounds
      : (s.viewingTournament?.rounds ?? EMPTY_ROUNDS),
  );
  const roundNumber = useMemo(
    () => getRankedRoundOrdinals(roundsForOrdinal)[liveRound?.id ?? ''] ?? 0,
    [roundsForOrdinal, liveRound],
  );

  const [shareVisible, setShareVisible] = useState(false);
  const [editDateVisible, setEditDateVisible] = useState(false);
  const [dateValue, setDateValue] = useState('');
  const [dateError, setDateError] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const roundMenu = useDropdownMenu();

  const handleConfirmDelete = useCallback(() => {
    if (!liveRound) return;
    deleteArchivedRound(liveRound.id);
    setDeleteVisible(false);
    goBack();
  }, [liveRound, deleteArchivedRound, goBack]);

  const playerIds = useMemo(() => {
    if (!liveRound) return [];
    const ids = new Set<string>();
    for (const m of liveRound.matches) {
      ids.add(m.aId);
      ids.add(m.bId);
    }
    return Array.from(ids);
  }, [liveRound]);

  const standings = useMemo(
    () => (liveRound ? calculateStandings(liveRound.matches, playerIds) : []),
    [liveRound, playerIds],
  );

  if (!liveRound) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <GlowBackground />
        <NavHeader title="" onBack={() => goBack()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('archive.noRoundData')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { winner, matches, date } = liveRound;

  const openDateEditor = () => {
    setDateValue(formatEditableDate(date));
    setDateError(false);
    setEditDateVisible(true);
  };

  const saveDate = () => {
    const iso = parseEditableDate(dateValue, date);
    if (!iso) {
      setDateError(true);
      return;
    }
    updateRoundDate(liveRound.id, iso);
    setEditDateVisible(false);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />

      {/* Header */}
      <NavHeader
        title=""
        onBack={() => goBack()}
        rightElement={
          isEditableRound ? (
            <TouchableOpacity
              ref={roundMenu.anchorRef}
              style={styles.dotsBtn}
              onPress={roundMenu.open}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.dotsIcon}>···</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => setShareVisible(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.shareBtnText}>{t('common.share')}</Text>
            </TouchableOpacity>
          )
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Round date */}
        <View style={styles.dateRow}>
          {isEditableRound ? (
            <TouchableOpacity style={styles.datePill} onPress={openDateEditor} activeOpacity={0.7}>
              <Text style={styles.datePillText}>{formatShortDate(date)}</Text>
              <Text style={styles.datePillIcon}>✎</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.dateStatic}>{formatShortDate(date)}</Text>
          )}
        </View>

        {/* Day Winner Banner */}
        {winner ? <DayWinnerBanner winnerId={winner} matchCount={matches.length} /> : null}

        {/* Round standings table */}
        {standings.length > 0 && (
          <>
            <View style={styles.sectionLabelRow}>
              <SectionLabel label={t('tournament.standings').toUpperCase()} />
            </View>

            <StandingsTable
              standings={standings}
              players={players}
              playerLabel={t('table.player').toUpperCase()}
              columns={getStandingsTableColumns(t, showAvgGoals)}
            />
          </>
        )}

        {/* Section label */}
        <View style={[styles.sectionLabelRow, standings.length > 0 && styles.sectionLabelRowTop]}>
          <SectionLabel label={t('archive.allMatches').toUpperCase()} />
        </View>

        {/* Match list */}
        {matches.length === 0 ? (
          <View style={styles.emptyMatches}>
            <Text style={styles.emptyMatchesText}>{t('archive.noMatchesRecorded')}</Text>
          </View>
        ) : (
          (() => {
            const tours = groupByTours
              ? groupMatchesByTour(matches, playerIds.length).reverse()
              : [{ tourNumber: 1, matches }];
            const tourSize =
              playerIds.length > 1 ? (playerIds.length * (playerIds.length - 1)) / 2 : 0;
            const showTourLabel = groupByTours && (tours.length > 1 || matches.length >= tourSize);
            return tours.map((tour) => {
              const reversed = [...tour.matches].reverse();
              return (
                <View key={tour.tourNumber} style={styles.tourGroup}>
                  {showTourLabel && (
                    <Text style={styles.tourLabel}>
                      {t('matchday.tour', { n: tour.tourNumber }).toUpperCase()}
                    </Text>
                  )}
                  <View style={styles.matchBlock}>
                    {reversed.map((m: Match, idx) => (
                      <TouchableOpacity
                        key={m.id}
                        activeOpacity={0.75}
                        onPress={() => router.push(`/match/${m.id}`)}
                      >
                        <MatchCard
                          match={m}
                          readonly
                          style={
                            idx < reversed.length - 1
                              ? styles.matchCardInBlock
                              : styles.matchCardInBlockLast
                          }
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            });
          })()
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      {liveRound && (
        <ShareRoundModal
          visible={shareVisible}
          onClose={() => setShareVisible(false)}
          round={liveRound}
          roundNumber={roundNumber}
          tournamentName={tournamentName}
        />
      )}

      <DropdownMenu
        visible={roundMenu.visible}
        onClose={roundMenu.close}
        position={roundMenu.position}
        items={[
          {
            key: 'share',
            label: t('common.share'),
            onPress: () => {
              roundMenu.close();
              setShareVisible(true);
            },
          },
          {
            key: 'delete',
            label: t('archive.deleteRoundConfirm'),
            destructive: true,
            onPress: () => {
              roundMenu.close();
              setDeleteVisible(true);
            },
          },
        ]}
      />

      <ConfirmDialog
        visible={deleteVisible}
        onRequestClose={() => setDeleteVisible(false)}
        icon="🗑"
        iconColor={colors.accent.red}
        variant="destructive"
        title={t('archive.deleteRoundTitle').toUpperCase()}
        description={t('archive.deleteRoundDesc')}
        cancel={{ label: t('matchday.dialogs.cancel'), onPress: () => setDeleteVisible(false) }}
        confirm={{ label: t('archive.deleteRoundConfirm'), onPress: handleConfirmDelete }}
      />

      <EditRoundDateSheet
        visible={editDateVisible}
        onClose={() => setEditDateVisible(false)}
        value={dateValue}
        onChangeValue={(text) => {
          setDateValue(text);
          setDateError(false);
        }}
        error={dateError}
        onSave={saveDate}
      />
    </SafeAreaView>
  );
}
