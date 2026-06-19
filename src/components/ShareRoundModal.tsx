import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Native-only modules loaded dynamically so web build doesn't crash
type CaptureRef = typeof import('react-native-view-shot')['captureRef'];
type MediaLibraryModule = typeof import('expo-media-library');
type SharingModule = typeof import('expo-sharing');
import { useStore } from '@/store';
import { ArchivedRound } from '@/store/types';
import { calculateStandings } from '@/utils/standings';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Variant = 'winner' | 'standings';

interface ShareRoundModalProps {
  visible: boolean;
  onClose: () => void;
  round: ArchivedRound;
  tournamentName: string;
}

// ---------------------------------------------------------------------------
// Inline Avatar — pure (no store dep) for use inside the share cards
// ---------------------------------------------------------------------------

function CardAvatar({ color, name, size }: { color: string; name: string; size: number }) {
  const parts = name.trim().split(/\s+/);
  const init = parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: size * 0.32, color: '#0c0e10', textAlign: 'center', lineHeight: size }}>
        {init}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Card 1 — Winner Card
// ---------------------------------------------------------------------------

interface WinnerCardProps {
  round: ArchivedRound;
  tournamentName: string;
}

const CARD_W = 320;

function WinnerCard({ round, tournamentName }: WinnerCardProps) {
  const players = useStore((s) => s.players);

  const playerIds = useMemo(() => {
    const ids = new Set<string>();
    round.matches.forEach((m) => { ids.add(m.aId); ids.add(m.bId); });
    return Array.from(ids);
  }, [round.matches]);

  const standings = useMemo(
    () => calculateStandings(round.matches, playerIds),
    [round.matches, playerIds],
  );

  const winner = players.find((p) => p.id === round.winner);
  const winnerStats = standings.find((s) => s.playerId === round.winner);
  const isDraw = !round.winner;

  const glowColor = winner?.color ?? Colors.accent.green;
  const dateStr = fmtDate(round.date);

  return (
    <View style={winnerStyles.card} collapsable={false}>
      {/* Glow */}
      <View style={[winnerStyles.glow, { backgroundColor: glowColor }]} pointerEvents="none" />

      {/* Top bar */}
      <View style={winnerStyles.topBar}>
        <Text style={winnerStyles.appName}>MATCHDAY</Text>
        <Text style={winnerStyles.topDate}>{dateStr}</Text>
      </View>

      {/* Divider */}
      <View style={winnerStyles.divider} />

      {/* Hero section */}
      <View style={winnerStyles.hero}>
        {/* Diamond label */}
        <Text style={winnerStyles.heroLabel}>
          {isDraw ? '— MATCH DAY RESULT —' : '♦  ROUND WINNER  ♦'}
        </Text>

        {/* Avatar with glow ring */}
        <View style={[winnerStyles.avatarRing, { borderColor: glowColor + '66' }]}>
          {winner ? (
            <CardAvatar color={winner.color} name={winner.name} size={80} />
          ) : (
            <View style={[winnerStyles.drawCircle, { borderColor: glowColor + '44' }]}>
              <Text style={winnerStyles.drawCircleText}>—</Text>
            </View>
          )}
        </View>

        {/* Name */}
        <Text style={winnerStyles.heroName}>
          {isDraw ? 'IT\'S A DRAW' : (winner?.name ?? '—').toUpperCase()}
        </Text>

        {/* Stats row */}
        {winnerStats && (
          <View style={winnerStyles.statsRow}>
            <View style={winnerStyles.statItem}>
              <Text style={[winnerStyles.statValue, { color: Colors.accent.green }]}>{winnerStats.wins}</Text>
              <Text style={winnerStyles.statLabel}>W</Text>
            </View>
            <View style={winnerStyles.statDot} />
            <View style={winnerStyles.statItem}>
              <Text style={winnerStyles.statValue}>{winnerStats.draws}</Text>
              <Text style={winnerStyles.statLabel}>D</Text>
            </View>
            <View style={winnerStyles.statDot} />
            <View style={winnerStyles.statItem}>
              <Text style={[winnerStyles.statValue, { color: Colors.accent.red }]}>{winnerStats.losses}</Text>
              <Text style={winnerStyles.statLabel}>L</Text>
            </View>
            <View style={winnerStyles.statSep} />
            <View style={winnerStyles.statItem}>
              <Text style={winnerStyles.statValue}>{winnerStats.gf}<Text style={winnerStyles.statGA}>:{winnerStats.ga}</Text></Text>
              <Text style={winnerStyles.statLabel}>Goals</Text>
            </View>
            <View style={winnerStyles.statDot} />
            <View style={winnerStyles.statItem}>
              <Text style={[winnerStyles.statValue, { color: Colors.accent.gold }]}>{winnerStats.pts}</Text>
              <Text style={winnerStyles.statLabel}>PTS</Text>
            </View>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={winnerStyles.divider} />
      <View style={winnerStyles.footer}>
        <Text style={winnerStyles.footerTour} numberOfLines={1}>{tournamentName.toUpperCase()}</Text>
        <Text style={winnerStyles.footerRound}>Round {round.n} · {round.matches.length} matches</Text>
      </View>
    </View>
  );
}

const winnerStyles = StyleSheet.create({
  card: {
    width: CARD_W,
    backgroundColor: '#0c0e10',
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: 30,
    left: CARD_W / 2 - 130,
    opacity: 0.12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  appName: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.sm,
    color: Colors.text.placeholder,
    letterSpacing: 2.5,
  },
  topDate: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.placeholder,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 28,
    gap: Spacing.md,
  },
  heroLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.accent.gold,
    letterSpacing: 2,
  },
  avatarRing: {
    padding: 5,
    borderRadius: 999,
    borderWidth: 2,
    marginVertical: Spacing.sm,
  },
  drawCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawCircleText: {
    fontFamily: FontFamily.display,
    fontSize: FontSize['2xl'],
    color: Colors.text.muted,
  },
  heroName: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['3xl'],
    color: Colors.text.primary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 28,
  },
  statValue: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.lg,
    color: Colors.text.primary,
  },
  statGA: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.base,
    color: Colors.text.muted,
  },
  statLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 8,
    color: Colors.text.placeholder,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.text.placeholder,
    marginBottom: 10,
  },
  statSep: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 4,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: 3,
  },
  footerTour: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    letterSpacing: 1,
  },
  footerRound: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.placeholder,
  },
});

// ---------------------------------------------------------------------------
// Card 2 — Standings Card
// ---------------------------------------------------------------------------

const RANK_COLORS = [Colors.accent.gold, Colors.text.muted, '#8a6a3a'];
const RANK_LABELS = ['1', '2', '3', '4', '5'];

function StandingsCard({ round, tournamentName }: WinnerCardProps) {
  const players = useStore((s) => s.players);

  const playerIds = useMemo(() => {
    const ids = new Set<string>();
    round.matches.forEach((m) => { ids.add(m.aId); ids.add(m.bId); });
    return Array.from(ids);
  }, [round.matches]);

  const standings = useMemo(
    () => calculateStandings(round.matches, playerIds),
    [round.matches, playerIds],
  );

  const dateStr = fmtDate(round.date);

  return (
    <View style={standStyles.card} collapsable={false}>
      {/* Top bar */}
      <View style={standStyles.topBar}>
        <View>
          <Text style={standStyles.tourName} numberOfLines={1}>{tournamentName.toUpperCase()}</Text>
          <Text style={standStyles.roundLabel}>ROUND {round.n} · STANDINGS</Text>
        </View>
        <Text style={standStyles.appName}>MATCHDAY</Text>
      </View>

      {/* Divider */}
      <View style={standStyles.divider} />

      {/* Column headers */}
      <View style={standStyles.tableHeader}>
        <Text style={[standStyles.colLabel, standStyles.colPlayer]}>PLAYER</Text>
        <Text style={standStyles.colLabel}>W</Text>
        <Text style={standStyles.colLabel}>D</Text>
        <Text style={standStyles.colLabel}>L</Text>
        <Text style={standStyles.colLabel}>GF</Text>
        <Text style={standStyles.colLabel}>GA</Text>
        <Text style={standStyles.colLabel}>GD</Text>
        <Text style={[standStyles.colLabel, { color: Colors.accent.green }]}>PTS</Text>
      </View>

      {/* Rows */}
      {standings.map((s, idx) => {
        const player = players.find((p) => p.id === s.playerId);
        const isWinner = s.playerId === round.winner;
        const rankColor = idx < RANK_COLORS.length ? RANK_COLORS[idx] : Colors.text.ghost;
        const gdStr = s.gd > 0 ? `+${s.gd}` : `${s.gd}`;
        const gdColor = s.gd > 0 ? Colors.accent.green : s.gd < 0 ? Colors.accent.red : Colors.text.muted;
        return (
          <View key={s.playerId} style={[standStyles.row, isWinner && standStyles.rowWinner]}>
            {/* Rank dot */}
            <View style={[standStyles.rankDot, { backgroundColor: rankColor }]}>
              <Text style={standStyles.rankNum}>{RANK_LABELS[idx] ?? idx + 1}</Text>
            </View>
            {/* Avatar + name */}
            <View style={standStyles.colPlayer}>
              <View style={standStyles.playerInner}>
                {player && <CardAvatar color={player.color} name={player.name} size={24} />}
                <Text style={standStyles.playerName} numberOfLines={1}>{player?.name ?? '—'}</Text>
              </View>
            </View>
            <Text style={standStyles.cell}>{s.wins}</Text>
            <Text style={standStyles.cell}>{s.draws}</Text>
            <Text style={standStyles.cell}>{s.losses}</Text>
            <Text style={standStyles.cell}>{s.gf}</Text>
            <Text style={standStyles.cell}>{s.ga}</Text>
            <Text style={[standStyles.cell, { color: gdColor }]}>{gdStr}</Text>
            <Text style={[standStyles.cell, standStyles.ptsCell]}>{s.pts}</Text>
          </View>
        );
      })}

      {/* Divider */}
      <View style={standStyles.divider} />

      {/* Footer */}
      <View style={standStyles.footer}>
        <Text style={standStyles.footerDate}>{dateStr}</Text>
        <Text style={standStyles.footerApp}>matchday</Text>
      </View>
    </View>
  );
}

const CELL_W = 30;

const standStyles = StyleSheet.create({
  card: {
    width: CARD_W,
    backgroundColor: '#0c0e10',
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  tourName: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.lg,
    color: Colors.text.primary,
    letterSpacing: 0.5,
  },
  roundLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.placeholder,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  appName: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xs,
    color: Colors.text.placeholder,
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  colLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 8,
    color: Colors.text.placeholder,
    letterSpacing: 0.8,
    width: CELL_W,
    textAlign: 'center',
  },
  colPlayer: {
    flex: 1,
    textAlign: 'left',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  rowWinner: {
    backgroundColor: 'rgba(61,220,132,0.06)',
  },
  rankDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  rankNum: {
    fontFamily: FontFamily.displayBold,
    fontSize: 9,
    color: '#0c0e10',
    lineHeight: 14,
  },
  playerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  playerName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: Colors.text.primary,
    flexShrink: 1,
  },
  cell: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    width: CELL_W,
    textAlign: 'center',
  },
  ptsCell: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.sm,
    color: Colors.accent.green,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  footerDate: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.placeholder,
  },
  footerApp: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xs,
    color: Colors.text.placeholder,
    letterSpacing: 1.5,
  },
});

// ---------------------------------------------------------------------------
// Main Modal
// ---------------------------------------------------------------------------

export function ShareRoundModal({ visible, onClose, round, tournamentName }: ShareRoundModalProps) {
  const [variant, setVariant] = useState<Variant>('winner');
  const [loading, setLoading] = useState(false);

  const winnerRef = useRef<View>(null);
  const standingsRef = useRef<View>(null);

  useEffect(() => {
    if (!visible) setLoading(false);
  }, [visible]);

  const activeRef = variant === 'winner' ? winnerRef : standingsRef;

  const capture = async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      Alert.alert('Not available', 'Image capture is only available on mobile.');
      return null;
    }
    try {
      const { captureRef } = await import('react-native-view-shot') as { captureRef: CaptureRef };
      const uri = await captureRef(activeRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });
      return uri;
    } catch {
      Alert.alert('Error', 'Could not capture image. Please try again.');
      return null;
    }
  };

  const handleSave = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not available', 'Saving to Photos is only available on mobile.');
      return;
    }
    setLoading(true);
    try {
      const MediaLibrary = await import('expo-media-library') as MediaLibraryModule;
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow access to Photos to save the image.');
        return;
      }
      const uri = await capture();
      if (!uri) return;
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved!', 'Image saved to your Photos.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not available', 'Sharing is only available on mobile.');
      return;
    }
    setLoading(true);
    try {
      const uri = await capture();
      if (!uri) return;
      const Sharing = await import('expo-sharing') as SharingModule;
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Not available', 'Sharing is not available on this device.');
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share Round Results' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaView style={modalStyles.root} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>SHARE ROUND</Text>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn} activeOpacity={0.7}>
            <Text style={modalStyles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Variant pills */}
        <View style={modalStyles.pills}>
          <TouchableOpacity
            style={[modalStyles.pill, variant === 'winner' && modalStyles.pillActive]}
            onPress={() => setVariant('winner')}
            activeOpacity={0.8}
          >
            <Text style={[modalStyles.pillText, variant === 'winner' && modalStyles.pillTextActive]}>
              Winner Card
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalStyles.pill, variant === 'standings' && modalStyles.pillActive]}
            onPress={() => setVariant('standings')}
            activeOpacity={0.8}
          >
            <Text style={[modalStyles.pillText, variant === 'standings' && modalStyles.pillTextActive]}>
              Standings Card
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card preview — both rendered, only active visible for capture */}
        <ScrollView
          contentContainerStyle={modalStyles.previewScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={[modalStyles.cardWrap, variant !== 'winner' && modalStyles.hidden]}>
            <View ref={winnerRef} collapsable={false}>
              <WinnerCard round={round} tournamentName={tournamentName} />
            </View>
          </View>
          <View style={[modalStyles.cardWrap, variant !== 'standings' && modalStyles.hidden]}>
            <View ref={standingsRef} collapsable={false}>
              <StandingsCard round={round} tournamentName={tournamentName} />
            </View>
          </View>
        </ScrollView>

        {/* Action buttons */}
        <View style={modalStyles.actions}>
          <TouchableOpacity
            style={[modalStyles.actionBtn, modalStyles.saveBtn]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.text.primary} size="small" />
            ) : (
              <Text style={modalStyles.actionText}>💾  Save to Photos</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalStyles.actionBtn, modalStyles.shareBtn]}
            onPress={handleShare}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.bg.base} size="small" />
            ) : (
              <Text style={[modalStyles.actionText, { color: Colors.bg.base }]}>
                {Platform.OS === 'ios' ? '↑  Share' : '↗  Share'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  title: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    letterSpacing: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.lg,
    color: Colors.text.muted,
  },
  pills: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  pill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border.strong,
    backgroundColor: Colors.bg.elevated,
  },
  pillActive: {
    backgroundColor: Colors.accent.green,
    borderColor: Colors.accent.green,
  },
  pillText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  pillTextActive: {
    color: Colors.bg.base,
  },
  previewScroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  cardWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  hidden: {
    position: 'absolute',
    opacity: 0.001,
    pointerEvents: 'none',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveBtn: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.strong,
  },
  shareBtn: {
    backgroundColor: Colors.accent.green,
  },
  actionText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
});
