import React, { useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/theme';
import {
  GlowBackground,
  SectionLabel,
  EmptyState,
  DropdownMenu,
  NavHeader,
  MatchCard,
  StandingsTable,
  getStandingsTableColumns,
  Avatar,
} from '@/components';
import { useDropdownMenu } from '@/hooks/useDropdownMenu';
import { calculateStandings } from '@/utils/standings';
import { formatShortDate } from '@/utils/dateFormat';
import { groupMatchesByTour } from '@/utils/matchTours';
import { useSharedRound } from './useSharedRound';
import { makeStyles } from './shared.styles';

export function SharedRoundScreen({ shareId }: { shareId: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  const router = useRouter();
  const state = useSharedRound(shareId);
  const roundMenu = useDropdownMenu();

  if (state.status === 'loading') {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent.green} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (state.status === 'notFound') {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <GlowBackground />
        <View style={styles.center}>
          <EmptyState message={t('sharedRound.notFound')} />
        </View>
      </SafeAreaView>
    );
  }

  const { round, matches, players, teams } = state.data;
  const playerIds = Array.from(new Set(matches.flatMap((m) => [m.aId, m.bId])));
  const standings = calculateStandings(matches, playerIds);
  const winner = players.find((p) => p.id === round.winner);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />

      <NavHeader
        title="MATCHDAY"
        subtitle={formatShortDate(round.date)}
        rightElement={
          <TouchableOpacity
            testID="shared-round-menu-button"
            ref={roundMenu.anchorRef}
            style={styles.dotsBtn}
            onPress={roundMenu.open}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.dotsIcon}>···</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {winner && (
          <View style={styles.winnerCard}>
            <Text style={styles.winnerLabel}>{t('sharedRound.dayWinner').toUpperCase()}</Text>
            <Avatar
              playerId={winner.id}
              size="xl"
              playerOverride={winner}
              teamOverride={teams.find((tm) => tm.code === winner.teamCode)}
            />
            <Text style={styles.winnerName}>{winner.name}</Text>
          </View>
        )}

        {standings.length > 0 && (
          <>
            <View style={styles.sectionLabelRow}>
              <SectionLabel label={t('tournament.standings').toUpperCase()} />
            </View>
            <StandingsTable
              standings={standings}
              players={players}
              teamsOverride={teams}
              playerLabel={t('table.player').toUpperCase()}
              columns={getStandingsTableColumns(t)}
            />
          </>
        )}

        <View style={styles.sectionLabelRow}>
          <SectionLabel label={t('archive.allMatches').toUpperCase()} />
        </View>
        {(playerIds.length > 2 ? groupMatchesByTour(matches, playerIds.length) : [{ tourNumber: 1, matches }]).map(
          (tour) => (
            <View key={tour.tourNumber} style={styles.tourGroup}>
              {playerIds.length > 2 && (
                <Text style={styles.tourLabel}>
                  {t('matchday.tour', { n: tour.tourNumber }).toUpperCase()}
                </Text>
              )}
              {tour.matches.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  testID={`shared-round-match-row-${m.id}`}
                  activeOpacity={0.75}
                  onPress={() => router.push(`/shared/${shareId}/match/${m.id}`)}
                >
                  <MatchCard
                    match={m}
                    readonly
                    playersOverride={players}
                    teamsOverride={teams}
                    style={styles.matchRowCard}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      <DropdownMenu
        visible={roundMenu.visible}
        onClose={roundMenu.close}
        position={roundMenu.position}
        items={[
          {
            key: 'stats',
            testID: 'shared-round-menu-stats-item',
            label: t('home.stats').toUpperCase(),
            onPress: () => {
              roundMenu.close();
              router.push(`/shared/${shareId}/stats`);
            },
          },
        ]}
      />
    </SafeAreaView>
  );
}
