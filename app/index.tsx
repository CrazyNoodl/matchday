import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { calculateStandings, isTopTied } from '@/utils/standings';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { Avatar } from '@/components/Avatar';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const store = useStore();

  const {
    hasTournament,
    tournamentName,
    round,
    roundOpen,
    matches,
    modal,
    players,
    tournamentPlayers,
    tournamentRanked,
    archivedRounds,
    closedTournaments,
  } = store;

  const [newRoundRanked, setNewRoundRanked] = React.useState(true);

  const SPORT_CHIPS = [
    { label: 'FC / FIFA', active: true, soon: false },
    { label: 'Football', active: false, soon: true },
    { label: 'Tennis', active: false, soon: true },
    { label: 'Basketball', active: false, soon: true },
  ];

  const standings = hasTournament
    ? calculateStandings(matches, tournamentPlayers)
    : [];
  const hasPlayedGames = standings.some((s) => s.played > 0);
  const leader =
    hasPlayedGames && !isTopTied(standings, matches)
      ? players.find((p) => p.id === standings[0].playerId)
      : null;

  const handleNewMatchDay = useCallback(() => {
    if (!hasTournament) return;
    if (roundOpen) {
      router.push('/matchday');
    } else {
      store.setModal('newRound');
    }
  }, [hasTournament, roundOpen, router, store]);

  const handleStartRound = useCallback(() => {
    store.startRound(newRoundRanked);
    store.setModal(null);
    router.push('/matchday');
  }, [newRoundRanked, store, router]);

  const matchDayDisabled = !hasTournament;

  const totalGames = archivedRounds.reduce((acc, r) => acc + r.matches.length, 0) + matches.length;
  const closedGames = closedTournaments.reduce(
    (acc, t) => acc + t.rounds.reduce((ra, r) => ra + r.matches.length, 0),
    0,
  );

  // Total rounds = archived + current open round (if any)
  const totalRounds = archivedRounds.length + (roundOpen ? 1 : 0);
  const displayTotalRounds = archivedRounds.length + 1;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Green glow */}
      <View style={styles.glow} pointerEvents="none" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.liveDot} />
          <Text style={styles.logoText}>MATCHDAY</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push('/settings')}
          activeOpacity={0.75}
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sport chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContainer}
        >
          {SPORT_CHIPS.map((chip) => (
            <View
              key={chip.label}
              style={[styles.chip, chip.active && styles.chipActive]}
            >
              <Text
                style={[styles.chipText, chip.active && styles.chipTextActive]}
              >
                {chip.label}
              </Text>
              {chip.soon && (
                <View style={styles.soonBadge}>
                  <Text style={styles.soonText}>{t('common.soon')}</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Tournament card */}
        {hasTournament ? (
          <TouchableOpacity
            style={styles.tournamentCard}
            onPress={() => router.push('/tournament')}
            activeOpacity={0.8}
          >
            {/* Card header: live pill + round info left, play button right */}
            <View style={styles.tournamentCardHeader}>
              <View style={styles.tournamentCardHeaderLeft}>
                <View style={styles.livePill}>
                  <View style={styles.livePillDot} />
                  <Text style={styles.livePillText}>{t('home.liveTournament')}</Text>
                </View>
                <Text style={styles.tournamentRoundText}>
                  {t('home.roundInfo', { round, total: displayTotalRounds })}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.playButton}
                onPress={handleNewMatchDay}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.playButtonIcon}>▶</Text>
              </TouchableOpacity>
            </View>

            {/* Tournament name */}
            <Text style={styles.tournamentName}>{tournamentName}</Text>

            {/* Current leader inset row */}
            {leader && (
              <View style={styles.leaderInset}>
                <Text style={styles.leaderLabel}>{t('home.currentLeader')}</Text>
                <View style={styles.leaderContent}>
                  <Avatar playerId={leader.id} size="sm" />
                  <Text style={styles.leaderName}>
                    {leader.nick ?? leader.name}
                  </Text>
                  {standings[0] && (
                    <Text style={styles.leaderPts}>
                      {standings[0].pts} {t('common.pts')}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.noTournamentCard}>
            <View style={styles.noTournamentPlus}>
              <Text style={styles.noTournamentPlusText}>+</Text>
            </View>
            <Text style={styles.noTournamentTitle}>{t('home.noActiveTournament')}</Text>
            <Text style={styles.noTournamentDesc}>
              {t('home.noActiveTournamentDesc')}
            </Text>
            <TouchableOpacity
              style={styles.startTournamentBtn}
              onPress={() => router.push('/setup')}
              activeOpacity={0.8}
            >
              <Text style={styles.startTournamentBtnText}>
                {t('home.startNewTournament')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* NEW MATCH DAY button */}
        <TouchableOpacity
          style={[styles.newMatchDayBtn, matchDayDisabled && styles.newMatchDayBtnDisabled]}
          onPress={handleNewMatchDay}
          activeOpacity={matchDayDisabled ? 1 : 0.8}
          disabled={matchDayDisabled}
        >
          {/* Left icon square */}
          <View style={[
            styles.newMatchDayIcon,
            matchDayDisabled ? styles.newMatchDayIconDisabled : styles.newMatchDayIconActive,
          ]}>
            <Text style={[
              styles.newMatchDayIconText,
              matchDayDisabled ? styles.newMatchDayIconTextDisabled : styles.newMatchDayIconTextActive,
            ]}>+</Text>
          </View>

          {/* Right: title + subtitle */}
          <View style={styles.newMatchDayTextBlock}>
            <Text
              style={[
                styles.newMatchDayBtnText,
                matchDayDisabled && styles.newMatchDayBtnTextDisabled,
              ]}
            >
              {roundOpen ? t('home.continueMatchDay') : t('home.newMatchDay')}
            </Text>
            {hasTournament && (
              <Text style={styles.newMatchDaySubtitle}>
                {t('home.roundSubtitle', { round: round + (roundOpen ? 0 : 1), name: tournamentName })}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Stats + Archive row */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/stats')}
            activeOpacity={0.8}
          >
            <Text style={styles.quickIcon}>📊</Text>
            <View>
              <Text style={styles.quickCardTitle}>{t('home.stats')}</Text>
              <Text style={styles.quickCardSub}>{t('home.gamesCount', { count: totalGames })}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/archive')}
            activeOpacity={0.8}
          >
            <Text style={styles.quickIcon}>🗂</Text>
            <View>
              <Text style={styles.quickCardTitle}>{t('home.archive')}</Text>
              <Text style={styles.quickCardSub}>
                {t('home.archiveCount', { tournaments: closedTournaments.length, games: closedGames })}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* New Round Sheet */}
      <Modal
        visible={modal === 'newRound'}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => store.setModal(null)}
      >
        <Pressable
          style={styles.sheetOverlay}
          onPress={() => store.setModal(null)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{t('home.sheet.title')}</Text>
          <Text style={styles.sheetSubtitle}>
            {t('home.sheet.subtitle', { name: tournamentName, round: round + 1 })}
          </Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>{t('home.sheet.countTowardStandings')}</Text>
              <Text style={styles.toggleDesc}>
                {newRoundRanked
                  ? t('home.sheet.ranked')
                  : t('home.sheet.friendly')}
              </Text>
            </View>
            <Switch
              value={newRoundRanked}
              onValueChange={setNewRoundRanked}
              trackColor={{
                false: Colors.bg.elevated,
                true: Colors.accent.green,
              }}
              thumbColor={Colors.text.primary}
            />
          </View>

          <View style={styles.sheetActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => store.setModal(null)}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.startRoundBtn}
              onPress={handleStartRound}
              activeOpacity={0.8}
            >
              <Text style={styles.startRoundBtnText}>{t('home.sheet.startRound')}</Text>
            </TouchableOpacity>
          </View>

          {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },
  glow: {
    position: 'absolute',
    width: 340,
    height: 340,
    top: -80,
    left: -40,
    borderRadius: 170,
    backgroundColor: Colors.accent.green,
    opacity: 0.06,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  liveDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: Colors.accent.green,
    shadowColor: Colors.accent.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  logoText: {
    fontFamily: FontFamily.displayBold,
    fontSize: 23,
    color: Colors.text.primary,
    letterSpacing: 1.5,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1d20',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 18,
    color: Colors.text.secondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    gap: Spacing.lg,
  },
  chipsScroll: {
    marginHorizontal: -Spacing.xl,
  },
  chipsContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  chipActive: {
    backgroundColor: Colors.accent.greenSubtle,
    borderColor: Colors.accent.greenBorder,
  },
  chipText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  chipTextActive: {
    color: Colors.accent.green,
  },
  soonBadge: {
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.xs,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  soonText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 8,
    color: Colors.text.ghost,
    letterSpacing: 0.5,
  },
  // Tournament card (active)
  tournamentCard: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.accent.greenBorder,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  tournamentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tournamentCardHeaderLeft: {
    flex: 1,
    gap: Spacing.xs,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accent.greenSubtle,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  livePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.green,
  },
  livePillText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.accent.green,
    letterSpacing: 0.8,
  },
  tournamentRoundText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    marginTop: 2,
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.accent.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  playButtonIcon: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 13,
    color: Colors.accent.greenDark,
    marginLeft: 2,
  },
  tournamentName: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['2xl'],
    color: Colors.text.primary,
    letterSpacing: 0.3,
    marginTop: Spacing.xs,
  },
  // Leader inset (dark row at bottom of tournament card)
  leaderInset: {
    backgroundColor: Colors.bg.archive,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  leaderLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  leaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  leaderName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
    flex: 1,
  },
  leaderPts: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.lg,
    color: Colors.accent.green,
  },
  // No tournament card
  noTournamentCard: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderStyle: 'dashed',
    padding: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.md,
  },
  noTournamentPlus: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.greenSubtle,
    borderWidth: 1,
    borderColor: Colors.accent.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noTournamentPlusText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xl,
    color: Colors.accent.green,
    lineHeight: 26,
  },
  noTournamentTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.lg,
    color: Colors.text.secondary,
    letterSpacing: 0.8,
  },
  noTournamentDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  startTournamentBtn: {
    backgroundColor: Colors.accent.green,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  startTournamentBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.md,
    color: Colors.accent.greenDark,
    letterSpacing: 0.8,
  },
  // NEW MATCH DAY button
  newMatchDayBtn: {
    backgroundColor: Colors.accent.green,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  newMatchDayBtnDisabled: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  newMatchDayIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newMatchDayIconActive: {
    backgroundColor: Colors.accent.greenDark,
  },
  newMatchDayIconDisabled: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  newMatchDayIconText: {
    fontSize: FontSize.xl,
    lineHeight: 28,
  },
  newMatchDayIconTextActive: {
    color: Colors.accent.green,
    fontFamily: FontFamily.bodyBold,
  },
  newMatchDayIconTextDisabled: {
    color: Colors.text.muted,
    fontFamily: FontFamily.bodyBold,
  },
  newMatchDayTextBlock: {
    flex: 1,
    gap: 2,
  },
  newMatchDayBtnText: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.lg,
    color: Colors.accent.greenDark,
    letterSpacing: 1,
  },
  newMatchDayBtnTextDisabled: {
    color: Colors.text.ghost,
  },
  newMatchDaySubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  // Quick row (Stats + Archive)
  quickRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  quickIcon: {
    fontSize: 20,
  },
  quickCardTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    letterSpacing: 0.5,
  },
  quickCardSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    marginTop: 2,
  },
  // Sheet
  sheetOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing['2xl'],
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border.strong,
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  sheetTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['2xl'],
    color: Colors.text.primary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  toggleInfo: {
    flex: 1,
    gap: 3,
  },
  toggleLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  toggleDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  sheetActions: {
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
  cancelBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: Colors.text.muted,
    letterSpacing: 0.5,
  },
  startRoundBtn: {
    flex: 2,
    backgroundColor: Colors.accent.green,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  startRoundBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: Colors.accent.greenDark,
    letterSpacing: 0.5,
  },
});
