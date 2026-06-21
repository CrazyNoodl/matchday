import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
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
// Winner Card
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
// Main Modal
// ---------------------------------------------------------------------------

export function ShareRoundModal({ visible, onClose, round, tournamentName }: ShareRoundModalProps) {
  const [loading, setLoading] = useState(false);

  const cardRef = useRef<View>(null);

  useEffect(() => {
    if (!visible) setLoading(false);
  }, [visible]);

  const capture = async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      Alert.alert('Not available', 'Image capture is only available on mobile.');
      return null;
    }
    try {
      const { captureRef } = await import('react-native-view-shot') as { captureRef: CaptureRef };
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });
      return uri;
    } catch (e) {
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
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
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

        {/* Card preview */}
        <ScrollView
          contentContainerStyle={modalStyles.previewScroll}
          showsVerticalScrollIndicator={false}
        >
          <View collapsable={false} style={modalStyles.cardWrap}>
            <View ref={cardRef} collapsable={false}>
              <WinnerCard round={round} tournamentName={tournamentName} />
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
