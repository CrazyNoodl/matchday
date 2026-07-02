import React, { useMemo, useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable, Dimensions, StyleSheet } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { calculateStandings } from '@/utils/standings';
import { formatShortDate, formatEditableDate, parseEditableDate } from '@/utils/dateFormat';
import { useColors } from '@/theme';
import { NavHeader, SectionLabel, MatchCard, ShareRoundModal, CardAvatar, StandingsTable, getStandingsTableColumns, GlowBackground, Sheet } from '@/components';
import { groupMatchesByTour } from '@/utils/matchTours';
import { getRankedRoundOrdinals } from '@/utils/roundOrdinals';
import { Match } from '@/store/types';
import { makeStyles, makeMenuStyles } from '@/screens/archive-day/archive-day.styles';
import { makeInputStyles } from '@/screens/tournament/tournament.styles';
import { makeDialogStyles } from '@/screens/round/RoundDialogs.styles';

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
      <Text style={styles.winnerLabel}>♦ {t('archive.dayWinner')} ♦</Text>
      <Text style={styles.winnerMatchCount}>{t('archive.matchCount', { count: matchCount })}</Text>
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
  const styles = makeStyles(colors);
  const router = useRouter();
  const goBack = useGoBack();
  const { t } = useTranslation();
  const viewingRound = useStore((s) => s.viewingRound);
  // Re-derive from live archivedRounds so edits (swap, stats) reflect immediately.
  // Falls back to the snapshot for closed-tournament rounds (not in archivedRounds).
  const liveRound = useStore((s) =>
    viewingRound ? s.archivedRounds.find((r) => r.id === viewingRound.id) ?? viewingRound : null,
  );
  const tournamentName = useStore((s) => s.viewingTournament?.name ?? s.tournamentName ?? '');
  const players = useStore((s) => s.players);
  const hasTournament = useStore((s) => s.hasTournament);
  const updateRoundDate = useStore((s) => s.updateRoundDate);
  // Editable only while the round still lives in the open tournament's
  // archivedRounds — once closeTournament() runs it moves to closedTournaments
  // and becomes read-only, same rule as match editing (see CLAUDE.md).
  const isEditableRound = useStore((s) =>
    hasTournament && !!viewingRound && s.archivedRounds.some((r) => r.id === viewingRound.id),
  );
  const deleteArchivedRound = useStore((s) => s.deleteArchivedRound);
  const roundsForOrdinal = useStore((s) =>
    viewingRound && s.archivedRounds.some((r) => r.id === viewingRound.id)
      ? s.archivedRounds
      : (s.viewingTournament?.rounds ?? []),
  );
  const roundNumber = useMemo(
    () => getRankedRoundOrdinals(roundsForOrdinal)[liveRound?.id ?? ''] ?? 0,
    [roundsForOrdinal, liveRound],
  );

  const [shareVisible, setShareVisible] = useState(false);
  const [editDateVisible, setEditDateVisible] = useState(false);
  const [dateValue, setDateValue] = useState('');
  const [dateError, setDateError] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [deleteVisible, setDeleteVisible] = useState(false);
  const dotsBtnRef = useRef<View>(null);
  const inputStyles = makeInputStyles(colors);
  const menuStyles = makeMenuStyles(colors);
  const dialogStyles = makeDialogStyles(colors);

  const openMenu = useCallback(() => {
    dotsBtnRef.current?.measureInWindow((x, y, w, h) => {
      const screenWidth = Dimensions.get('window').width;
      setMenuPos({ top: y + h + 6, right: screenWidth - x - w });
      setMenuVisible(true);
    });
  }, []);

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
              ref={dotsBtnRef}
              style={styles.dotsBtn}
              onPress={openMenu}
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
            <TouchableOpacity
              style={styles.datePill}
              onPress={openDateEditor}
              activeOpacity={0.7}
            >
              <Text style={styles.datePillText}>{formatShortDate(date)}</Text>
              <Text style={styles.datePillIcon}>✎</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.dateStatic}>{formatShortDate(date)}</Text>
          )}
        </View>

        {/* Day Winner Banner */}
        {winner ? (
          <DayWinnerBanner winnerId={winner} matchCount={matches.length} />
        ) : null}

        {/* Round standings table */}
        {standings.length > 0 && (
          <>
            <View style={styles.sectionLabelRow}>
              <SectionLabel label={t('tournament.standings')} />
            </View>

            <StandingsTable
              standings={standings}
              players={players}
              playerLabel={t('table.player')}
              columns={getStandingsTableColumns(t)}
            />
          </>
        )}

        {/* Section label */}
        <View style={[styles.sectionLabelRow, standings.length > 0 && styles.sectionLabelRowTop]}>
          <SectionLabel label={t('archive.allMatches')} />
        </View>

        {/* Match list */}
        {matches.length === 0 ? (
          <View style={styles.emptyMatches}>
            <Text style={styles.emptyMatchesText}>{t('archive.noMatchesRecorded')}</Text>
          </View>
        ) : (() => {
          const tours = groupMatchesByTour(matches, playerIds.length).reverse();
          const tourSize = playerIds.length > 1 ? (playerIds.length * (playerIds.length - 1)) / 2 : 0;
          const showTourLabel = tours.length > 1 || matches.length >= tourSize;
          return tours.map((tour) => {
            const reversed = [...tour.matches].reverse();
            return (
              <View key={tour.tourNumber} style={styles.tourGroup}>
                {showTourLabel && (
                  <Text style={styles.tourLabel}>{t('matchday.tour', { n: tour.tourNumber })}</Text>
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
                        style={idx < reversed.length - 1 ? styles.matchCardInBlock : styles.matchCardInBlockLast}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          });
        })()}

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

      {/* ── ROUND OPTIONS DROPDOWN ── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={() => setMenuVisible(false)}
        statusBarTranslucent
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuVisible(false)} />
        <View style={[menuStyles.dropdown, { top: menuPos.top, right: menuPos.right }]}>
          <TouchableOpacity
            style={menuStyles.item}
            onPress={() => { setMenuVisible(false); setShareVisible(true); }}
          >
            <Text style={menuStyles.itemText}>{t('common.share')}</Text>
          </TouchableOpacity>
          <View style={menuStyles.sep} />
          <TouchableOpacity
            style={menuStyles.item}
            onPress={() => { setMenuVisible(false); setDeleteVisible(true); }}
          >
            <Text style={[menuStyles.itemText, { color: colors.accent.red }]}>{t('archive.deleteRoundConfirm')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── DELETE ROUND CONFIRMATION ── */}
      <Modal
        visible={deleteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteVisible(false)}
        statusBarTranslucent
      >
        <View style={dialogStyles.overlay}>
          <View style={dialogStyles.dialog}>
            <Text style={[dialogStyles.dialogIcon, { color: colors.accent.red }]}>🗑</Text>
            <Text style={dialogStyles.dialogTitle}>{t('archive.deleteRoundTitle')}</Text>
            <Text style={dialogStyles.dialogDesc}>{t('archive.deleteRoundDesc')}</Text>
            <View style={dialogStyles.actions}>
              <TouchableOpacity style={dialogStyles.cancelBtn} onPress={() => setDeleteVisible(false)} activeOpacity={0.75}>
                <Text style={dialogStyles.cancelText}>{t('matchday.dialogs.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dialogStyles.confirmBtn, { backgroundColor: colors.accent.red }]}
                onPress={handleConfirmDelete}
                activeOpacity={0.85}
              >
                <Text style={[dialogStyles.confirmText, { color: '#fff' }]}>{t('archive.deleteRoundConfirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit round date sheet */}
      <Sheet visible={editDateVisible} onClose={() => setEditDateVisible(false)} avoidKeyboard>
        <View style={styles.dateSheet}>
          <Text style={styles.dateSheetTitle}>{t('archive.editDate.title')}</Text>
          <BottomSheetTextInput
            style={[inputStyles.input, dateError && styles.dateInputError]}
            value={dateValue}
            onChangeText={(text) => {
              setDateValue(text);
              setDateError(false);
            }}
            placeholder={t('archive.editDate.placeholder')}
            placeholderTextColor={colors.text.placeholder}
            autoFocus
            keyboardType="numbers-and-punctuation"
            returnKeyType="done"
            onSubmitEditing={saveDate}
          />
          {dateError ? (
            <Text style={styles.dateErrorText}>{t('archive.editDate.invalid')}</Text>
          ) : null}
          <View style={inputStyles.actions}>
            <TouchableOpacity
              style={inputStyles.cancelBtn}
              onPress={() => setEditDateVisible(false)}
              activeOpacity={0.75}
            >
              <Text style={inputStyles.cancelText}>{t('archive.editDate.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={inputStyles.saveBtn}
              onPress={saveDate}
              activeOpacity={0.85}
            >
              <Text style={inputStyles.saveText}>{t('archive.editDate.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

