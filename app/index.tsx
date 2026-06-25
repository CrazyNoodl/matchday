import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { calculateStandings, isTopTied } from '@/utils/standings';
import { useColors } from '@/theme';
import { Avatar, NewRoundModal, GlowBackground } from '@/components';
import { makeStyles } from '@/screens/index/index.styles';

export default function HomeScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { t } = useTranslation();
  const store = useStore();

  const {
    hasTournament,
    tournamentName,
    round,
    roundOpen,
    matches,
    players,
    tournamentPlayers,
    tournamentRanked,
    tournamentRounds,
    archivedRounds,
    closedTournaments,
  } = store;

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
      router.push('/round');
    } else {
      store.setModal('newRound');
    }
  }, [hasTournament, roundOpen, router, store]);

  const matchDayDisabled = !hasTournament;

  const totalGames = archivedRounds.reduce((acc, r) => acc + r.matches.length, 0) + matches.length;
  const closedGames = closedTournaments.reduce(
    (acc, t) => acc + t.rounds.reduce((ra, r) => ra + r.matches.length, 0),
    0,
  );

  // Total rounds = archived + current open round (if any)
  const totalRounds = archivedRounds.length + (roundOpen ? 1 : 0);
  const displayTotalRounds = archivedRounds.length + 1;

  const rankedCompleted = archivedRounds.filter((r) => r.ranked).length;
  const progressFraction = tournamentRounds > 0
    ? Math.min(rankedCompleted / tournamentRounds, 1)
    : 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Green glow */}
      <GlowBackground />

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

            {/* Progress bar (only when tournamentRounds is set) */}
            {tournamentRounds > 0 && (
              <View style={styles.progressBlock}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.round(progressFraction * 100)}%` }]} />
                </View>
                <Text style={styles.progressLabel}>
                  {t('home.progressRounds', { done: rankedCompleted, total: tournamentRounds })}
                </Text>
              </View>
            )}

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
      <NewRoundModal />
    </SafeAreaView>
  );
}
