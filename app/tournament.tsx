import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { calculateStandings } from '@/utils/standings';
import { formatShortDate } from '@/utils/dateFormat';
import { useColors } from '@/theme';
import { SectionLabel, GlowBackground, RoundCard, ShareStandingsModal, NewRoundModal, Sheet, StandingsTable, getStandingsTableColumns } from '@/components';
import { useTranslation } from 'react-i18next';
import { makeStyles, makeSheetStyles, makeInputStyles, makeDialogStyles } from '@/screens/tournament/tournament.styles';

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
  const sheetStyles = makeSheetStyles(colors);
  const inputStyles = makeInputStyles(colors);
  const dialogStyles = makeDialogStyles(colors);

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
            {tournamentName || 'TOURNAMENT'}
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
        <SectionLabel label={t('tournament.standings')} style={styles.sectionLabel} />

        <StandingsTable
          standings={standings}
          players={players}
          playerLabel={t('table.player')}
          emptyLabel={t('tournament.noMatches')}
          columns={getStandingsTableColumns(t)}
        />

        {/* ---- CURRENT MATCH DAY (only if roundOpen) ---- */}
        {roundOpen && (
          <>
            <SectionLabel label={t('tournament.currentMatchDay')} style={styles.sectionLabel} />

            <View style={styles.matchDayCard}>
              <View style={styles.matchDayLeft}>
                {/* Round badge */}
                <View style={styles.roundBadge}>
                  <Text style={styles.roundBadgeText}>{t('tournament.roundBadge', { n: round })}</Text>
                </View>

                {/* In progress label */}
                <View style={styles.inProgressRow}>
                  <View style={styles.inProgressDot} />
                  <Text style={styles.inProgressText}>{t('tournament.inProgress')}</Text>
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
          label={t('tournament.playedRounds', { count: archivedRounds.length })}
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
                n={r.n}
                dateText={formatShortDate(r.date)}
                matchCountText={t('tournament.roundMatches', { count: r.games })}
                winnerId={roundWinner?.id}
                winnerName={roundWinner ? (roundWinner.nick ?? roundWinner.name) : '—'}
                friendlyLabel={!r.ranked ? t('common.friendly') : undefined}
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

      {/* ---- Tour Settings Sheet ---- */}
      <Sheet visible={modal === 'tourSettings'} onClose={() => store.setModal(null)}>
          <View style={sheetStyles.sheet}>
            {/* Header row */}
            <View style={sheetStyles.sheetHeaderRow}>
              <View style={sheetStyles.sheetTitleBlock}>
                <Text style={sheetStyles.sheetTitle}>{t('tournament.sheet.title')}</Text>
                <Text style={sheetStyles.sheetSubtitle} numberOfLines={1}>
                  {tournamentName}
                </Text>
              </View>
              <TouchableOpacity
                style={sheetStyles.doneBtn}
                onPress={() => store.setModal(null)}
                activeOpacity={0.75}
              >
                <Text style={sheetStyles.doneBtnText}>{t('tournament.sheet.done')}</Text>
              </TouchableOpacity>
            </View>

            <View style={sheetStyles.rows}>
              {/* Rename */}
              <TouchableOpacity
                style={sheetStyles.row}
                onPress={() => {
                  setRenameValue(tournamentName);
                  store.setModal('editTourName');
                }}
                activeOpacity={0.8}
              >
                <View style={[sheetStyles.rowIcon, { backgroundColor: colors.accent.blueSubtle }]}>
                  <Text style={sheetStyles.rowIconText}>✎</Text>
                </View>
                <Text style={sheetStyles.rowLabel}>{t('tournament.sheet.rename')}</Text>
                <Text style={sheetStyles.rowChevron}>›</Text>
              </TouchableOpacity>

              {/* Share standings */}
              <TouchableOpacity
                style={sheetStyles.row}
                onPress={() => {
                  store.setModal(null);
                  setShareStandingsVisible(true);
                }}
                activeOpacity={0.8}
              >
                <View style={[sheetStyles.rowIcon, { backgroundColor: colors.accent.greenSubtle }]}>
                  <Text style={[sheetStyles.rowIconText, { color: colors.accent.green }]}>↗</Text>
                </View>
                <View style={sheetStyles.rowLabelBlock}>
                  <Text style={sheetStyles.rowLabel}>{t('tournament.sheet.shareStandings')}</Text>
                  <Text style={sheetStyles.rowSubtitle}>{t('tournament.sheet.shareStandingsSubtitle')}</Text>
                </View>
                <Text style={sheetStyles.rowChevron}>›</Text>
              </TouchableOpacity>

              {/* Close & archive */}
              <TouchableOpacity
                style={sheetStyles.row}
                onPress={() => store.setModal('closeTour')}
                activeOpacity={0.8}
              >
                <View style={[sheetStyles.rowIcon, { backgroundColor: colors.accent.redSubtle }]}>
                  <Text style={[sheetStyles.rowIconText, { color: colors.accent.red }]}>🔒</Text>
                </View>
                <View style={sheetStyles.rowLabelBlock}>
                  <Text style={sheetStyles.rowLabel}>{t('tournament.sheet.closeAndArchive')}</Text>
                  <Text style={sheetStyles.rowSubtitle}>{t('tournament.sheet.closeSubtitle')}</Text>
                </View>
                <Text style={sheetStyles.rowChevron}>›</Text>
              </TouchableOpacity>
            </View>

            {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
          </View>
      </Sheet>

      {/* ---- Edit Tournament Name Sheet ---- */}
      <Sheet visible={modal === 'editTourName'} onClose={() => store.setModal('tourSettings')}>
          <View style={sheetStyles.sheet}>
            <Text style={sheetStyles.sheetTitle}>{t('tournament.rename.title')}</Text>
            <TextInput
              style={inputStyles.input}
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder={t('tournament.rename.placeholder')}
              placeholderTextColor={colors.text.placeholder}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => {
                const trimmed = renameValue.trim();
                if (trimmed) {
                  store.renameTournament(trimmed);
                }
                store.setModal(null);
              }}
            />
            <View style={inputStyles.actions}>
              <TouchableOpacity
                style={inputStyles.cancelBtn}
                onPress={() => store.setModal('tourSettings')}
                activeOpacity={0.75}
              >
                <Text style={inputStyles.cancelText}>{t('tournament.rename.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  inputStyles.saveBtn,
                  !renameValue.trim() && inputStyles.saveBtnDisabled,
                ]}
                onPress={() => {
                  const trimmed = renameValue.trim();
                  if (trimmed) {
                    store.renameTournament(trimmed);
                  }
                  store.setModal(null);
                }}
                disabled={!renameValue.trim()}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    inputStyles.saveText,
                    !renameValue.trim() && inputStyles.saveTextDisabled,
                  ]}
                >
                  {t('tournament.rename.save')}
                </Text>
              </TouchableOpacity>
            </View>
            {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
          </View>
      </Sheet>

      {/* ---- Close Tournament Confirmation ---- */}
      <Modal
        visible={modal === 'closeTour'}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => store.setModal('tourSettings')}
      >
        <View style={dialogStyles.overlay}>
          <View style={dialogStyles.dialog}>
            <Text style={dialogStyles.dialogIcon}>🏆</Text>
            <Text style={dialogStyles.dialogTitle}>{t('tournament.close.title')}</Text>
            <Text style={dialogStyles.dialogDesc}>
              {t('tournament.close.desc')}
            </Text>
            <View style={dialogStyles.actions}>
              <TouchableOpacity
                style={dialogStyles.cancelBtn}
                onPress={() => store.setModal('tourSettings')}
                activeOpacity={0.75}
              >
                <Text style={dialogStyles.cancelText}>{t('tournament.close.keepGoing')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={dialogStyles.archiveBtn}
                onPress={() => {
                  store.closeTournament();
                  store.setModal(null);
                  router.push('/');
                }}
                activeOpacity={0.85}
              >
                <Text style={dialogStyles.archiveBtnText}>{t('tournament.close.archive')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---- New Round Sheet ---- */}
      <NewRoundModal />

      <ShareStandingsModal
        visible={shareStandingsVisible}
        onClose={() => setShareStandingsVisible(false)}
        tournamentName={tournamentName || 'TOURNAMENT'}
        subtitle={shareRoundLabel}
        standings={standings}
      />
    </SafeAreaView>
  );
}

