import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import { calculateStandings } from '@/utils/standings';
import { formatShortDate } from '@/utils/dateFormat';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { Avatar } from '@/components/Avatar';
import { SectionLabel } from '@/components/SectionLabel';
import { GlowBackground } from '@/components/GlowBackground';
import { RoundCard } from '@/components/RoundCard';
import { ShareStandingsModal } from '@/components/ShareStandingsModal';
import { NewRoundModal } from '@/components/NewRoundModal';
import { useTranslation } from 'react-i18next';

// ---------------------------------------------------------------------------
// Column definitions (outside component to avoid recreation on every render)
// ---------------------------------------------------------------------------

const TOUR_TABLE_COLS = [
  { key: 'И', tKey: 'table.played' },
  { key: 'В', tKey: 'table.wins' },
  { key: 'Н', tKey: 'table.draws' },
  { key: 'П', tKey: 'table.losses' },
  { key: 'ГЗ', tKey: 'table.gf' },
  { key: 'ГП', tKey: 'table.ga' },
  { key: 'РГ', tKey: 'table.gd' },
  { key: 'О', tKey: 'table.pts' },
];

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

        <View style={styles.tableContainer}>
          {/* Table header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.tablePlayerCol]}>
              {t('table.player')}
            </Text>
            {TOUR_TABLE_COLS.map((col) => (
              <Text key={col.key} style={[styles.tableHeaderCell, styles.tableNumCol]}>
                {t(col.tKey)}
              </Text>
            ))}
          </View>

          {/* Rows */}
          {standings.length === 0 ? (
            <View style={styles.tableEmpty}>
              <Text style={styles.tableEmptyText}>{t('tournament.noMatches')}</Text>
            </View>
          ) : (
            standings.map((s, idx) => {
              const player = players.find((p) => p.id === s.playerId);
              const isLeader = idx === 0 && s.played > 0;
              const gdColor =
                s.gd > 0
                  ? Colors.accent.green
                  : s.gd < 0
                  ? Colors.accent.red
                  : Colors.text.muted;

              return (
                <View
                  key={s.playerId}
                  style={[styles.tableRow, isLeader && styles.tableRowLeader]}
                >
                  <View style={[styles.tablePlayerCol, styles.tablePlayerInner]}>
                    <Avatar playerId={s.playerId} size="sm" style={styles.tableAvatar} />
                    <View style={styles.tablePlayerNames}>
                      <Text style={styles.tablePlayerName} numberOfLines={1}>
                        {player?.name ?? 'Unknown'}
                      </Text>
                      {player?.nick ? (
                        <Text style={styles.tablePlayerNick} numberOfLines={1}>
                          @{player.nick}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <Text style={[styles.tableNumCol, styles.tableCell]}>{s.played}</Text>
                  <Text style={[styles.tableNumCol, styles.tableCell]}>{s.wins}</Text>
                  <Text style={[styles.tableNumCol, styles.tableCell]}>{s.draws}</Text>
                  <Text style={[styles.tableNumCol, styles.tableCell]}>{s.losses}</Text>
                  <Text style={[styles.tableNumCol, styles.tableCell]}>{s.gf}</Text>
                  <Text style={[styles.tableNumCol, styles.tableCell]}>{s.ga}</Text>
                  <Text style={[styles.tableNumCol, styles.tableCell, { color: gdColor }]}>
                    {s.gd > 0 ? `+${s.gd}` : s.gd}
                  </Text>
                  <Text style={[styles.tableNumCol, styles.tableCell, styles.tablePtsCell]}>
                    {s.pts}
                  </Text>
                </View>
              );
            })
          )}
        </View>

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
      <Modal
        visible={modal === 'tourSettings'}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => store.setModal(null)}
      >
        <View style={sheetStyles.container}>
          <Pressable style={sheetStyles.overlay} onPress={() => store.setModal(null)} />
          <View style={sheetStyles.sheet}>
            <View style={sheetStyles.handle} />

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
                <View style={[sheetStyles.rowIcon, { backgroundColor: Colors.accent.blueSubtle }]}>
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
                <View style={[sheetStyles.rowIcon, { backgroundColor: Colors.accent.greenSubtle }]}>
                  <Text style={[sheetStyles.rowIconText, { color: Colors.accent.green }]}>↗</Text>
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
                <View style={[sheetStyles.rowIcon, { backgroundColor: Colors.accent.redSubtle }]}>
                  <Text style={[sheetStyles.rowIconText, { color: Colors.accent.red }]}>🔒</Text>
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
        </View>
      </Modal>

      {/* ---- Edit Tournament Name Sheet ---- */}
      <Modal
        visible={modal === 'editTourName'}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => store.setModal('tourSettings')}
      >
        <View style={sheetStyles.container}>
          <Pressable
            style={sheetStyles.overlay}
            onPress={() => store.setModal('tourSettings')}
          />
          <View style={sheetStyles.sheet}>
            <View style={sheetStyles.handle} />
            <Text style={sheetStyles.sheetTitle}>{t('tournament.rename.title')}</Text>
            <TextInput
              style={inputStyles.input}
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder={t('tournament.rename.placeholder')}
              placeholderTextColor={Colors.text.placeholder}
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
        </View>
      </Modal>

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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },
  // ---- Header ----
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    backgroundColor: Colors.bg.surface,
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
    color: Colors.text.secondary,
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
    color: Colors.text.primary,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  dotsBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  dotsIcon: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.base,
    color: Colors.text.secondary,
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

  // ---- Standings Table ----
  tableContainer: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bg.elevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  tableHeaderCell: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  tablePlayerCol: {
    width: 110,
    textAlign: 'left',
  },
  tableNumCol: {
    width: 28,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  tableRowLeader: {
    backgroundColor: Colors.accent.greenSubtle,
  },
  tablePlayerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tableAvatar: {
    width: 22,
    height: 22,
    borderRadius: 7,
  },
  tablePlayerNames: {
    flex: 1,
    gap: 1,
  },
  tablePlayerName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: Colors.text.primary,
  },
  tablePlayerNick: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  tableCell: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  tablePtsCell: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: Colors.accent.green,
  },
  tableEmpty: {
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
  },
  tableEmptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },

  // ---- Current Match Day Card ----
  matchDayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.accent.greenBorder,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  matchDayLeft: {
    flex: 1,
    gap: Spacing.xs,
  },
  roundBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent.greenSubtle,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.accent.greenBorder,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginBottom: Spacing.xs,
  },
  roundBadgeText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xs,
    color: Colors.accent.green,
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
    backgroundColor: Colors.accent.green,
  },
  inProgressText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.accent.green,
    letterSpacing: 0.8,
  },
  matchDayCount: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  matchDayLeader: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  playBtnIcon: {
    fontSize: 16,
    color: Colors.accent.greenDark,
    marginLeft: 2,
  },

  // ---- Played Rounds ----
  emptyRounds: {
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyRoundsText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: Colors.text.muted,
  },
  // ---- Bottom CTA ----
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.bg.base,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  ctaBtn: {
    backgroundColor: Colors.accent.green,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    shadowColor: Colors.accent.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.lg,
    color: Colors.accent.greenDark,
    letterSpacing: 0.6,
  },
});

// ---------------------------------------------------------------------------
// Sheet styles
// ---------------------------------------------------------------------------

const sheetStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.bg.sheet,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border.strong,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
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
    color: Colors.text.primary,
    letterSpacing: 0.5,
  },
  sheetSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  doneBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accent.greenSubtle,
    borderWidth: 1,
    borderColor: Colors.accent.greenBorder,
  },
  doneBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.accent.green,
  },
  rows: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
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
    color: Colors.accent.blue,
  },
  rowLabelBlock: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
    flex: 1,
  },
  rowSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  rowChevron: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    color: Colors.text.muted,
    lineHeight: 24,
  },
});

// ---------------------------------------------------------------------------
// Input sheet styles (rename modal)
// ---------------------------------------------------------------------------

const inputStyles = StyleSheet.create({
  input: {
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  cancelText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: Colors.text.muted,
    letterSpacing: 0.4,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: Colors.accent.green,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  saveText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: Colors.accent.greenDark,
    letterSpacing: 0.4,
  },
  saveTextDisabled: {
    color: Colors.text.ghost,
  },
});

// ---------------------------------------------------------------------------
// Dialog styles (close tournament)
// ---------------------------------------------------------------------------

const dialogStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  dialog: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.accent.goldBorder,
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
    color: Colors.text.primary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  dialogDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: Colors.text.muted,
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
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  cancelText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.muted,
  },
  archiveBtn: {
    flex: 1,
    backgroundColor: Colors.accent.gold,
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

