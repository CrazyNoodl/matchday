import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Native-only modules loaded dynamically so web build doesn't crash
type CaptureRef = typeof import('react-native-view-shot')['captureRef'];
type MediaLibraryModule = typeof import('expo-media-library/legacy');
type SharingModule = typeof import('expo-sharing');
type Html2Canvas = typeof import('html2canvas').default;
import { useStore } from '@/store';
import { ArchivedRound } from '@/store/types';
import { calculateStandings, Standing } from '@/utils/standings';
import { useColors } from '@/theme';
import { FontFamily } from '@/theme/typography';
import { STANDINGS_NUM_COLS, formatShareCardDate } from '@/utils/shareCard';
import { makeWinnerStyles, makeModalStyles } from './ShareRoundModal.styles';

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
// Inline Avatar — mirrors src/components/Avatar.tsx (team logo, square,
// 3-letter fallback) for use inside the share cards
// ---------------------------------------------------------------------------

export function CardAvatar({ teamCode, size }: { teamCode?: string; size: number }) {
  const team = useStore((s) => s.teams.find((t) => t.code === teamCode));
  const colors = useColors();
  const radius = Math.round(size * 0.3);
  const baseStyle = { width: size, height: size, borderRadius: radius, overflow: 'hidden' as const };

  if (!team) {
    return <View style={[baseStyle, { backgroundColor: colors.bg.elevated }]} />;
  }

  if (team.logo?.startsWith('http')) {
    return (
      <View style={baseStyle}>
        <Image source={{ uri: team.logo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </View>
    );
  }

  const label = team.short.slice(0, 3).toUpperCase();
  return (
    <View style={[baseStyle, { backgroundColor: team.color + '28', alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ fontFamily: FontFamily.bodySemiBold, fontSize: size * 0.28, color: team.color, textAlign: 'center', lineHeight: size - 4 }}>
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Winner Card
// ---------------------------------------------------------------------------

interface WinnerCardProps {
  round: ArchivedRound;
  tournamentName: string;
  includeMatches?: boolean;
  includeStandings?: boolean;
}

function StandingsTableRow({
  standing,
  isLeader,
  isLast,
}: {
  standing: Standing;
  isLeader: boolean;
  isLast: boolean;
}) {
  const player = useStore((s) => s.players.find((p) => p.id === standing.playerId));
  const colors = useColors();
  const winnerStyles = makeWinnerStyles(colors);

  const gdColor =
    standing.gd > 0 ? colors.accent.green : standing.gd < 0 ? colors.accent.red : colors.text.muted;

  return (
    <View
      style={[
        winnerStyles.standingsRow,
        !isLast && winnerStyles.matchRowBorder,
        isLeader && winnerStyles.standingsRowLeader,
      ]}
    >
      <View style={winnerStyles.standingsPlayerCol}>
        <CardAvatar teamCode={player?.teamCode} size={20} />
        <Text style={winnerStyles.standingsName} numberOfLines={1}>
          {player?.name ?? 'Unknown'}
        </Text>
      </View>
      {STANDINGS_NUM_COLS.map((col) => (
        <Text key={col.key} style={[winnerStyles.standingsNumCol, winnerStyles.standingsCell]}>
          {standing[col.key]}
        </Text>
      ))}
      <Text style={[winnerStyles.standingsNumCol, winnerStyles.standingsCell, { color: gdColor }]}>
        {standing.gd > 0 ? `+${standing.gd}` : standing.gd}
      </Text>
      <Text style={[winnerStyles.standingsNumCol, winnerStyles.standingsPts]}>{standing.pts}</Text>
    </View>
  );
}

function MatchRow({ match, isLast }: { match: ArchivedRound['matches'][number]; isLast: boolean }) {
  const players = useStore((s) => s.players);
  const colors = useColors();
  const winnerStyles = makeWinnerStyles(colors);
  const playerA = players.find((p) => p.id === match.aId);
  const playerB = players.find((p) => p.id === match.bId);

  const aWins = match.aScore > match.bScore;
  const bWins = match.bScore > match.aScore;

  return (
    <View style={[winnerStyles.matchRow, !isLast && winnerStyles.matchRowBorder]}>
      <View style={winnerStyles.matchSide}>
        <CardAvatar teamCode={playerA?.teamCode} size={22} />
        <Text style={[winnerStyles.matchName, aWins && winnerStyles.matchNameWin]} numberOfLines={1}>
          {playerA?.name ?? 'Unknown'}
        </Text>
      </View>
      <Text style={winnerStyles.matchScore}>
        <Text style={aWins && winnerStyles.matchScoreWin}>{match.aScore}</Text>
        {' : '}
        <Text style={bWins && winnerStyles.matchScoreWin}>{match.bScore}</Text>
      </Text>
      <View style={[winnerStyles.matchSide, winnerStyles.matchSideRight]}>
        <Text style={[winnerStyles.matchName, winnerStyles.matchNameRight, bWins && winnerStyles.matchNameWin]} numberOfLines={1}>
          {playerB?.name ?? 'Unknown'}
        </Text>
        <CardAvatar teamCode={playerB?.teamCode} size={22} />
      </View>
    </View>
  );
}

function WinnerCard({ round, tournamentName, includeMatches = false, includeStandings = false }: WinnerCardProps) {
  const players = useStore((s) => s.players);
  const colors = useColors();
  const winnerStyles = makeWinnerStyles(colors);

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

  const glowColor = winner?.color ?? colors.accent.green;
  const dateStr = formatShareCardDate(round.date);

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
        <Text style={winnerStyles.heroMatchCount}>
          {round.matches.length} {round.matches.length === 1 ? 'MATCH' : 'MATCHES'}
        </Text>

        {/* Avatar with glow ring */}
        <View style={winnerStyles.avatarRing}>
          {winner ? (
            <CardAvatar teamCode={winner.teamCode} size={80} />
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
              <Text style={[winnerStyles.statValue, { color: colors.accent.green }]}>{winnerStats.wins}</Text>
              <Text style={winnerStyles.statLabel}>W</Text>
            </View>
            <View style={winnerStyles.statDot} />
            <View style={winnerStyles.statItem}>
              <Text style={winnerStyles.statValue}>{winnerStats.draws}</Text>
              <Text style={winnerStyles.statLabel}>D</Text>
            </View>
            <View style={winnerStyles.statDot} />
            <View style={winnerStyles.statItem}>
              <Text style={[winnerStyles.statValue, { color: colors.accent.red }]}>{winnerStats.losses}</Text>
              <Text style={winnerStyles.statLabel}>L</Text>
            </View>
            <View style={winnerStyles.statSep} />
            <View style={winnerStyles.statItem}>
              <Text style={winnerStyles.statValue}>{winnerStats.gf}<Text style={winnerStyles.statGA}>:{winnerStats.ga}</Text></Text>
              <Text style={winnerStyles.statLabel}>Goals</Text>
            </View>
            <View style={winnerStyles.statDot} />
            <View style={winnerStyles.statItem}>
              <Text style={[winnerStyles.statValue, { color: colors.accent.gold }]}>{winnerStats.pts}</Text>
              <Text style={winnerStyles.statLabel}>PTS</Text>
            </View>
          </View>
        )}
      </View>

      {/* Standings table */}
      {includeStandings && standings.length > 0 && (
        <>
          <View style={winnerStyles.divider} />
          <View style={winnerStyles.standingsSection}>
            <View style={winnerStyles.standingsHeaderRow}>
              <Text style={[winnerStyles.standingsHeaderCell, winnerStyles.standingsPlayerCol]}>
                PLAYER
              </Text>
              {STANDINGS_NUM_COLS.map((col) => (
                <Text key={col.key} style={[winnerStyles.standingsHeaderCell, winnerStyles.standingsNumCol]}>
                  {col.label}
                </Text>
              ))}
              <Text style={[winnerStyles.standingsHeaderCell, winnerStyles.standingsNumCol]}>GD</Text>
              <Text style={[winnerStyles.standingsHeaderCell, winnerStyles.standingsNumCol]}>PTS</Text>
            </View>
            {standings.map((s, idx) => (
              <StandingsTableRow
                key={s.playerId}
                standing={s}
                isLeader={idx === 0}
                isLast={idx === standings.length - 1}
              />
            ))}
          </View>
        </>
      )}

      {/* All matches */}
      {includeMatches && round.matches.length > 0 && (
        <>
          <View style={winnerStyles.divider} />
          <View style={winnerStyles.matchesSection}>
            <Text style={winnerStyles.matchesTitle}>ALL MATCHES</Text>
            {round.matches.map((m, idx) => (
              <MatchRow key={m.id} match={m} isLast={idx === round.matches.length - 1} />
            ))}
          </View>
        </>
      )}

      {/* Footer */}
      <View style={winnerStyles.divider} />
      <View style={winnerStyles.footer}>
        <Text style={winnerStyles.footerTour} numberOfLines={1}>{tournamentName.toUpperCase()}</Text>
        <Text style={winnerStyles.footerRound}>Round {round.n} · {round.matches.length} matches</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Modal
// ---------------------------------------------------------------------------

export function ShareRoundModal({ visible, onClose, round, tournamentName }: ShareRoundModalProps) {
  const [loading, setLoading] = useState(false);
  const [includeMatches, setIncludeMatches] = useState(false);
  const [includeStandings, setIncludeStandings] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const colors = useColors();
  const modalStyles = makeModalStyles(colors);

  const cardRef = useRef<View>(null);

  useEffect(() => {
    if (!visible) { setLoading(false); setSaveMessage(null); }
  }, [visible]);

  const captureNative = async (): Promise<string | null> => {
    try {
      const { captureRef } = await import('react-native-view-shot') as { captureRef: CaptureRef };
      return await captureRef(cardRef, { format: 'png', quality: 1.0, result: 'tmpfile' });
    } catch {
      setSaveMessage({ ok: false, text: 'Could not capture image. Please try again.' });
      return null;
    }
  };

  const captureWeb = async (): Promise<Blob | null> => {
    try {
      const html2canvas = (await import('html2canvas')).default as Html2Canvas;
      const element = cardRef.current as unknown as HTMLElement;
      if (!element) return null;
      const canvas = await html2canvas(element, {
        backgroundColor: colors.bg.base,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    } catch {
      setSaveMessage({ ok: false, text: 'Could not capture image. Please try again.' });
      return null;
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        const blob = await captureWeb();
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `matchday-round-${round.n}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const MediaLibrary = await import('expo-media-library/legacy') as MediaLibraryModule;
        const { status } = await MediaLibrary.requestPermissionsAsync(true);
        if (status !== 'granted') {
          setSaveMessage({ ok: false, text: 'Photos permission required. Allow access in Settings.' });
          return;
        }
        const uri = await captureNative();
        if (!uri) return;
        await MediaLibrary.saveToLibraryAsync(uri);
        setSaveMessage({ ok: true, text: 'Saved to Photos!' });
      }
    } catch {
      setSaveMessage({ ok: false, text: 'Could not save. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        const blob = await captureWeb();
        if (!blob) return;
        const file = new File([blob], `matchday-round-${round.n}.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: `Round ${round.n} · ${tournamentName}` });
        } else if (navigator.share) {
          await navigator.share({ title: `Round ${round.n} · ${tournamentName}`, text: 'Matchday results' });
        }
      } else {
        const uri = await captureNative();
        if (!uri) return;
        const Sharing = await import('expo-sharing') as SharingModule;
        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) {
          setSaveMessage({ ok: false, text: 'Sharing is not available on this device.' });
          return;
        }
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share Round Results' });
      }
    } catch {
      // user cancelled share dialog
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      presentationStyle="pageSheet"
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
              <WinnerCard
                round={round}
                tournamentName={tournamentName}
                includeMatches={includeMatches}
                includeStandings={includeStandings}
              />
            </View>
          </View>
        </ScrollView>

        {/* Options */}
        <View style={modalStyles.optionRow}>
          <Text style={modalStyles.optionLabel}>Include standings</Text>
          <Switch
            value={includeStandings}
            onValueChange={setIncludeStandings}
            trackColor={{ false: colors.bg.elevated, true: colors.accent.green }}
            thumbColor="#ffffff"
          />
        </View>
        <View style={modalStyles.optionRow}>
          <Text style={modalStyles.optionLabel}>Include all matches</Text>
          <Switch
            value={includeMatches}
            onValueChange={setIncludeMatches}
            trackColor={{ false: colors.bg.elevated, true: colors.accent.green }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Action buttons */}
        {saveMessage && (
          <Text style={[modalStyles.saveMsg, saveMessage.ok ? modalStyles.saveMsgOk : modalStyles.saveMsgErr]}>
            {saveMessage.text}
          </Text>
        )}
        <View style={modalStyles.actions}>
          <TouchableOpacity
            style={[modalStyles.actionBtn, modalStyles.saveBtn]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text.primary} size="small" />
            ) : (
              <Text style={modalStyles.actionText}>
              {Platform.OS === 'web' ? '⬇  Download' : '💾  Save to Photos'}
            </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalStyles.actionBtn, modalStyles.shareBtn]}
            onPress={handleShare}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.bg.base} size="small" />
            ) : (
              <Text style={[modalStyles.actionText, { color: colors.bg.base }]}>↗  Share</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
