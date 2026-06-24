import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { calculateStandings } from '@/utils/standings';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { NavHeader } from '@/components/NavHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { MatchCard } from '@/components/MatchCard';
import { ShareRoundModal, CardAvatar } from '@/components/ShareRoundModal';
import { StandingsTable } from '@/components/StandingsTable';
import { GlowBackground } from '@/components/GlowBackground';
import { Match } from '@/store/types';

// ---------------------------------------------------------------------------
// Day Winner Banner
// ---------------------------------------------------------------------------

interface DayWinnerBannerProps {
  winnerId: string;
  matchCount: number;
}

function DayWinnerBanner({ winnerId, matchCount }: DayWinnerBannerProps) {
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
  const [shareVisible, setShareVisible] = useState(false);

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

  const { winner, matches } = liveRound;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />

      {/* Header */}
      <NavHeader
        title=""
        onBack={() => goBack()}
        rightElement={
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => setShareVisible(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.shareBtnText}>{t('common.share')}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
          </>
        )}

        {/* Section label */}
        <View style={styles.sectionLabelRow}>
          <SectionLabel label={t('archive.allMatches')} />
        </View>

        {/* Match list */}
        {matches.length === 0 ? (
          <View style={styles.emptyMatches}>
            <Text style={styles.emptyMatchesText}>{t('archive.noMatchesRecorded')}</Text>
          </View>
        ) : (
          <View style={styles.matchList}>
            {[...matches].reverse().map((m: Match) => (
              <TouchableOpacity
                key={m.id}
                activeOpacity={0.75}
                onPress={() => router.push(`/match/${m.id}`)}
              >
                <MatchCard match={m} readonly />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      {liveRound && (
        <ShareRoundModal
          visible={shareVisible}
          onClose={() => setShareVisible(false)}
          round={liveRound}
          tournamentName={tournamentName}
        />
      )}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: 40,
  },

  // ---- Share button ----
  shareBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent.greenSubtle,
    borderWidth: 1,
    borderColor: Colors.accent.greenBorder,
  },
  shareBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: Colors.accent.green,
    letterSpacing: 0.5,
  },

  // ---- Day Winner Banner ----
  winnerCard: {
    alignItems: 'center',
    backgroundColor: '#0c0e10',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  winnerLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.accent.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  winnerMatchCount: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  winnerLogoWrap: {
    marginVertical: Spacing.sm,
  },
  winnerName: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.lg,
    color: Colors.text.primary,
    letterSpacing: 0.2,
  },

  // ---- Section label ----
  sectionLabelRow: {
    marginBottom: Spacing.md,
  },

  // ---- Match list ----
  matchList: {
    gap: 0,
  },

  // ---- Empty matches ----
  emptyMatches: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
  },
  emptyMatchesText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },

  // ---- Error fallback ----
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: Colors.text.muted,
  },
});
