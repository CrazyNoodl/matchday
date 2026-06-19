import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { NavHeader } from '@/components/NavHeader';
import { Avatar } from '@/components/Avatar';
import { SectionLabel } from '@/components/SectionLabel';
import { MatchCard } from '@/components/MatchCard';
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
      {/* Left: diamond + label stack + avatar + name */}
      <View style={styles.winnerLeft}>
        <Text style={styles.winnerDiamond}>♦</Text>
        <View style={styles.winnerLabelBlock}>
          <Text style={styles.winnerLabel}>{t('archive.dayWinner')}</Text>
          <View style={styles.winnerNameRow}>
            <Avatar playerId={winnerId} size="sm" />
            <Text style={styles.winnerName} numberOfLines={1}>
              {name}
            </Text>
          </View>
        </View>
      </View>

      {/* Right: match count */}
      <View style={styles.winnerRight}>
        <Text style={styles.winnerMatchCount}>{t('archive.matchCount', { count: matchCount })}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ArchiveDayScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const viewingRound = useStore((s) => s.viewingRound);

  if (!viewingRound) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.glow} pointerEvents="none" />
        <NavHeader title="" onBack={() => router.back()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('archive.noRoundData')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { winner, matches } = viewingRound;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.glow} pointerEvents="none" />

      {/* Header: back button only, no visible title */}
      <NavHeader title="" onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Day Winner Banner */}
        {winner ? (
          <DayWinnerBanner winnerId={winner} matchCount={matches.length} />
        ) : null}

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
            {matches.map((m: Match) => (
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: 40,
  },

  // ---- Day Winner Banner ----
  winnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1a0e',
    borderWidth: 1,
    borderColor: 'rgba(255,212,94,0.3)',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  winnerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  winnerDiamond: {
    fontSize: 16,
    color: Colors.accent.gold,
    lineHeight: 20,
  },
  winnerLabelBlock: {
    flex: 1,
    gap: 5,
  },
  winnerLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  winnerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  winnerName: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.lg,
    color: Colors.text.primary,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  winnerRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  winnerMatchCount: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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
