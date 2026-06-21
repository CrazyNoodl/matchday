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
import { Avatar } from '@/components/Avatar';
import { SectionLabel } from '@/components/SectionLabel';
import { MatchCard } from '@/components/MatchCard';
import { ShareRoundModal } from '@/components/ShareRoundModal';
import { Match } from '@/store/types';

const ROUND_TABLE_COLS = [
  { tKey: 'table.played' },
  { tKey: 'table.wins' },
  { tKey: 'table.draws' },
  { tKey: 'table.losses' },
  { tKey: 'table.gf' },
  { tKey: 'table.ga' },
  { tKey: 'table.gd' },
  { tKey: 'table.pts' },
] as const;

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
  const goBack = useGoBack();
  const { t } = useTranslation();
  const viewingRound = useStore((s) => s.viewingRound);
  const tournamentName = useStore((s) => s.viewingTournament?.name ?? s.tournamentName ?? '');
  const players = useStore((s) => s.players);
  const [shareVisible, setShareVisible] = useState(false);

  const playerIds = useMemo(() => {
    if (!viewingRound) return [];
    const ids = new Set<string>();
    for (const m of viewingRound.matches) {
      ids.add(m.aId);
      ids.add(m.bId);
    }
    return Array.from(ids);
  }, [viewingRound]);

  const standings = useMemo(
    () => (viewingRound ? calculateStandings(viewingRound.matches, playerIds) : []),
    [viewingRound, playerIds],
  );

  if (!viewingRound) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.glow} pointerEvents="none" />
        <NavHeader title="" onBack={() => goBack()} />
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

            <View style={styles.tableContainer}>
              {/* Header */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableCell, styles.tablePlayerCol]}>
                  {t('table.player')}
                </Text>
                {ROUND_TABLE_COLS.map((col) => (
                  <Text key={col.tKey} style={[styles.tableCell, styles.tableNumCol]}>
                    {t(col.tKey)}
                  </Text>
                ))}
              </View>

              {/* Rows */}
              {standings.map((s, idx) => {
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
                      <Avatar playerId={s.playerId} size="sm" />
                      <View style={styles.tablePlayerNames}>
                        <Text style={styles.tablePlayerName} numberOfLines={1}>
                          {player?.name ?? t('common.unknown')}
                        </Text>
                        {player?.nick ? (
                          <Text style={styles.tablePlayerNick} numberOfLines={1}>
                            @{player.nick}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <Text style={[styles.tableCell, styles.tableNumCol]}>{s.played}</Text>
                    <Text style={[styles.tableCell, styles.tableNumCol]}>{s.wins}</Text>
                    <Text style={[styles.tableCell, styles.tableNumCol]}>{s.draws}</Text>
                    <Text style={[styles.tableCell, styles.tableNumCol]}>{s.losses}</Text>
                    <Text style={[styles.tableCell, styles.tableNumCol]}>{s.gf}</Text>
                    <Text style={[styles.tableCell, styles.tableNumCol]}>{s.ga}</Text>
                    <Text style={[styles.tableCell, styles.tableNumCol, { color: gdColor }]}>
                      {s.gd > 0 ? `+${s.gd}` : s.gd}
                    </Text>
                    <Text style={[styles.tableCell, styles.tableNumCol, styles.tablePtsCell]}>
                      {s.pts}
                    </Text>
                  </View>
                );
              })}
            </View>
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

      {viewingRound && (
        <ShareRoundModal
          visible={shareVisible}
          onClose={() => setShareVisible(false)}
          round={viewingRound}
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

  // ---- Round standings table ----
  tableContainer: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    backgroundColor: Colors.bg.elevated,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  tableRowLeader: {
    backgroundColor: Colors.accent.greenSubtle,
  },
  tableCell: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  tablePlayerCol: {
    width: 110,
    textAlign: 'left',
  },
  tablePlayerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
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
    fontSize: 9,
    color: Colors.text.muted,
  },
  tableNumCol: {
    width: 30,
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  tablePtsCell: {
    color: Colors.accent.green,
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.sm,
  },
});
