import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { useColors, AppColors } from '@/theme';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { SectionLabel } from '@/components/SectionLabel';
import { GlowBackground } from '@/components/GlowBackground';
import { RoundCard } from '@/components/RoundCard';
import { ShareStandingsModal } from '@/components/ShareStandingsModal';
import { NewRoundModal } from '@/components/NewRoundModal';
import { Sheet } from '@/components/Sheet/Sheet';
import { StandingsTable } from '@/components/StandingsTable';
import { useTranslation } from 'react-i18next';

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
          columns={[
            { key: 'played', label: t('table.played') },
            { key: 'wins', label: t('table.wins') },
            { key: 'draws', label: t('table.draws') },
            { key: 'losses', label: t('table.losses') },
            { key: 'gf', label: t('table.gf') },
            { key: 'ga', label: t('table.ga') },
            { key: 'gd', label: t('table.gd') },
            { key: 'pts', label: t('table.pts') },
            { key: 'gfPerGame', label: t('table.gfPerGame') },
            { key: 'gaPerGame', label: t('table.gaPerGame') },
          ]}
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const makeStyles = (colors: AppColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  // ---- Header ----
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.bg.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontFamily: FontFamily.display,
    fontSize: FontSize['2xl'],
    color: colors.text.secondary,
    lineHeight: 28,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.sm,
  },
  headerTitle: {
    fontFamily: FontFamily.display,
    fontSize: 21,
    color: colors.text.primary,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
  },
  dotsBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  dotsIcon: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.base,
    color: colors.text.secondary,
    letterSpacing: 2,
    lineHeight: 18,
  },

  // ---- Scroll ----
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: 40,
  },

  sectionLabel: {
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },

  // ---- Current Match Day Card ----
  matchDayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.accent.greenBorder,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  matchDayLeft: {
    flex: 1,
    gap: Spacing.xs,
  },
  roundBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent.greenSubtle,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: colors.accent.greenBorder,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginBottom: Spacing.xs,
  },
  roundBadgeText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xs,
    color: colors.accent.green,
    letterSpacing: 0.5,
  },
  inProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  inProgressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.green,
  },
  inProgressText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: colors.accent.green,
    letterSpacing: 0.8,
  },
  matchDayCount: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.md,
    color: colors.text.primary,
  },
  matchDayLeader: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.muted,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  playBtnIcon: {
    fontSize: 16,
    color: colors.accent.greenDark,
    marginLeft: 2,
  },

  // ---- Played Rounds ----
  emptyRounds: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyRoundsText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: colors.text.muted,
  },
  // ---- Bottom CTA ----
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg.base,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  ctaBtn: {
    backgroundColor: colors.accent.green,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    shadowColor: colors.accent.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.lg,
    color: colors.accent.greenDark,
    letterSpacing: 0.6,
  },
});

// ---------------------------------------------------------------------------
// Sheet styles
// ---------------------------------------------------------------------------

const makeSheetStyles = (colors: AppColors) => StyleSheet.create({
  sheet: {
    backgroundColor: colors.bg.sheet,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  sheetTitleBlock: {
    gap: 3,
    flex: 1,
  },
  sheetTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['2xl'],
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  sheetSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: colors.text.muted,
  },
  doneBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    backgroundColor: colors.accent.greenSubtle,
    borderWidth: 1,
    borderColor: colors.accent.greenBorder,
  },
  doneBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: colors.accent.green,
  },
  rows: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowIconText: {
    fontSize: 16,
    color: colors.accent.blue,
  },
  rowLabelBlock: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.text.primary,
    flex: 1,
  },
  rowSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: colors.text.muted,
  },
  rowChevron: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    color: colors.text.muted,
    lineHeight: 24,
  },
});

// ---------------------------------------------------------------------------
// Input sheet styles (rename modal)
// ---------------------------------------------------------------------------

const makeInputStyles = (colors: AppColors) => StyleSheet.create({
  input: {
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  cancelText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: colors.text.muted,
    letterSpacing: 0.4,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: colors.accent.green,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  saveText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: colors.accent.greenDark,
    letterSpacing: 0.4,
  },
  saveTextDisabled: {
    color: colors.text.ghost,
  },
});

// ---------------------------------------------------------------------------
// Dialog styles (close tournament)
// ---------------------------------------------------------------------------

const makeDialogStyles = (colors: AppColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  dialog: {
    backgroundColor: colors.bg.surface,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: colors.accent.goldBorder,
    padding: Spacing['2xl'],
    width: '100%',
    gap: Spacing.md,
    alignItems: 'center',
  },
  dialogIcon: {
    fontSize: 40,
  },
  dialogTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['2xl'],
    color: colors.text.primary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  dialogDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.bg.elevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  cancelText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: colors.text.muted,
  },
  archiveBtn: {
    flex: 1,
    backgroundColor: colors.accent.gold,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  archiveBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: '#1a1200',
    letterSpacing: 0.3,
  },
});

