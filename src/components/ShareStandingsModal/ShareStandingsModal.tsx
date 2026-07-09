import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { type ArchivedRound, type Match } from '@/store/types';
import { calculateStandings, type Standing } from '@/utils/standings';
import { useColors } from '@/theme';
import { CardAvatar } from '@/components/ShareRoundModal';
import { Toggle } from '@/components/Toggle';
import { formatShortDate } from '@/utils/dateFormat';
import { getRankedRoundOrdinals } from '@/utils/roundOrdinals';
import { STANDINGS_NUM_COLS, formatShareCardDate } from '@/utils/shareCard';
import { makeCardStyles, makeModalStyles } from './ShareStandingsModal.styles';
// Native-only modules loaded dynamically so web build doesn't crash
type CaptureRef = (typeof import('react-native-view-shot'))['captureRef'];
type MediaLibraryModule = typeof import('expo-media-library/legacy');
type SharingModule = typeof import('expo-sharing');
type Html2Canvas = typeof import('html2canvas').default;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShareStandingsModalProps {
  visible: boolean;
  onClose: () => void;
  tournamentName: string;
  subtitle: string;
  /** All ranked-round matches (archived + current open round, if ranked) — combined with friendlyMatches per this modal's own include toggles. */
  rankedMatches: Match[];
  /** All friendly-round matches (archived + current open round, if not ranked). */
  friendlyMatches: Match[];
  tournamentPlayers: string[];
  /** Finished rounds — rendered as a "PLAYED ROUNDS" list on the share card itself, filtered by the same include toggles. */
  archivedRounds: ArchivedRound[];
}

// ---------------------------------------------------------------------------
// Standings Card
// ---------------------------------------------------------------------------

function StandingsRow({
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
  const cardStyles = makeCardStyles(colors);
  const { t } = useTranslation();

  const gdColor =
    standing.gd > 0 ? colors.accent.green : standing.gd < 0 ? colors.accent.red : colors.text.muted;

  return (
    <View
      style={[cardStyles.row, !isLast && cardStyles.rowBorder, isLeader && cardStyles.rowLeader]}
    >
      <View style={cardStyles.playerCol}>
        <CardAvatar teamCode={player?.teamCode} size={26} />
        <View style={cardStyles.playerNames}>
          <Text style={cardStyles.playerName} numberOfLines={1}>
            {player?.name ?? t('common.unknown')}
          </Text>
          {player?.nick ? (
            <Text style={cardStyles.playerNick} numberOfLines={1}>
              @{player.nick}
            </Text>
          ) : null}
        </View>
      </View>
      {STANDINGS_NUM_COLS.map((col) => (
        <Text key={col.key} style={[cardStyles.numCol, cardStyles.cell]}>
          {standing[col.key]}
        </Text>
      ))}
      <Text style={[cardStyles.numCol, cardStyles.cell, { color: gdColor }]}>
        {standing.gd > 0 ? `+${standing.gd}` : standing.gd}
      </Text>
      <Text style={[cardStyles.numCol, cardStyles.pts]}>{standing.pts}</Text>
    </View>
  );
}

function RoundSummaryRow({
  round,
  n,
  isLast,
}: {
  round: ArchivedRound;
  n: number;
  isLast: boolean;
}) {
  const winner = useStore((s) => s.players.find((p) => p.id === round.winner));
  const colors = useColors();
  const cardStyles = makeCardStyles(colors);
  const { t } = useTranslation();

  return (
    <View style={[cardStyles.roundRow, !isLast && cardStyles.rowBorder]}>
      <View style={cardStyles.roundLeft}>
        <View style={cardStyles.roundBadge}>
          <Text style={cardStyles.roundBadgeText}>{round.ranked ? n : '–'}</Text>
        </View>
        <View style={cardStyles.roundInfo}>
          <Text style={cardStyles.roundDate}>{formatShortDate(round.date)}</Text>
          <Text style={cardStyles.roundMatchCount}>
            {t('tournament.roundMatches', { count: round.games })}
          </Text>
        </View>
      </View>

      <View style={cardStyles.roundCenter}>
        {!round.ranked && (
          <View style={cardStyles.friendlyBadge}>
            <Text style={cardStyles.friendlyBadgeText}>{t('common.friendly').toUpperCase()}</Text>
          </View>
        )}
      </View>

      <View style={cardStyles.roundRight}>
        <CardAvatar teamCode={winner?.teamCode} size={20} />
        <Text style={cardStyles.roundWinnerName} numberOfLines={1}>
          {winner ? (winner.nick ?? winner.name) : '—'}
        </Text>
      </View>
    </View>
  );
}

interface StandingsCardProps {
  tournamentName: string;
  subtitle: string;
  standings: Standing[];
  rounds: ArchivedRound[];
  roundOrdinals: Record<string, number>;
}

function StandingsCard({
  tournamentName,
  subtitle,
  standings,
  rounds,
  roundOrdinals,
}: StandingsCardProps) {
  const colors = useColors();
  const cardStyles = makeCardStyles(colors);
  const dateStr = formatShareCardDate();
  const { t } = useTranslation();

  return (
    <View style={cardStyles.card} collapsable={false}>
      {/* Glow */}
      <View
        style={[cardStyles.glow, { backgroundColor: colors.accent.green }]}
        pointerEvents="none"
      />

      {/* Top bar */}
      <View style={cardStyles.topBar}>
        <Text style={cardStyles.appName}>MATCHDAY</Text>
        <Text style={cardStyles.topDate}>{dateStr}</Text>
      </View>

      <View style={cardStyles.divider} />

      {/* Header */}
      <View style={cardStyles.header}>
        <Text style={cardStyles.tourName} numberOfLines={2}>
          {tournamentName.toUpperCase()}
        </Text>
        <Text style={cardStyles.tourSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <View style={cardStyles.divider} />

      {/* Standings table */}
      <View style={cardStyles.section}>
        <View style={cardStyles.headerRow}>
          <Text style={[cardStyles.headerCell, cardStyles.playerCol]}>
            {t('table.player').toUpperCase()}
          </Text>
          {STANDINGS_NUM_COLS.map((col) => (
            <Text key={col.key} style={[cardStyles.headerCell, cardStyles.numCol]}>
              {col.label}
            </Text>
          ))}
          <Text style={[cardStyles.headerCell, cardStyles.numCol]}>{t('table.gd')}</Text>
          <Text style={[cardStyles.headerCell, cardStyles.numCol]}>{t('common.pts')}</Text>
        </View>
        {standings.map((s, idx) => (
          <StandingsRow
            key={s.playerId}
            standing={s}
            isLeader={idx === 0}
            isLast={idx === standings.length - 1}
          />
        ))}
      </View>

      {/* Played rounds */}
      {rounds.length > 0 && (
        <>
          <View style={cardStyles.divider} />
          <View style={cardStyles.section}>
            <Text style={cardStyles.roundsTitle}>
              {t('tournament.playedRounds', { count: rounds.length }).toUpperCase()}
            </Text>
            {rounds.map((r, idx) => (
              <RoundSummaryRow
                key={r.id}
                round={r}
                n={roundOrdinals[r.id] ?? 0}
                isLast={idx === rounds.length - 1}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Modal
// ---------------------------------------------------------------------------

export function ShareStandingsModal({
  visible,
  onClose,
  tournamentName,
  subtitle,
  rankedMatches,
  friendlyMatches,
  tournamentPlayers,
  archivedRounds,
}: ShareStandingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [includeRanked, setIncludeRanked] = useState(true);
  const [includeFriendly, setIncludeFriendly] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const cardRef = useRef<View>(null);
  const colors = useColors();
  const modalStyles = makeModalStyles(colors);
  const { t } = useTranslation();

  const standings = useMemo(
    () =>
      calculateStandings(
        [...(includeRanked ? rankedMatches : []), ...(includeFriendly ? friendlyMatches : [])],
        tournamentPlayers,
      ),
    [includeRanked, includeFriendly, rankedMatches, friendlyMatches, tournamentPlayers],
  );

  const roundOrdinals = useMemo(() => getRankedRoundOrdinals(archivedRounds), [archivedRounds]);

  // Newest first, same set of rounds the toggles above already apply to the standings.
  const includedRounds = useMemo(
    () =>
      archivedRounds
        .filter((r) => (r.ranked && includeRanked) || (!r.ranked && includeFriendly))
        .reverse(),
    [archivedRounds, includeRanked, includeFriendly],
  );

  useEffect(() => {
    if (!visible) {
      setLoading(false);
      setSaveMessage(null);
    }
  }, [visible]);

  const captureNative = async (): Promise<string | null> => {
    try {
      const { captureRef } = (await import('react-native-view-shot')) as { captureRef: CaptureRef };
      return await captureRef(cardRef, { format: 'png', quality: 1.0, result: 'tmpfile' });
    } catch {
      setSaveMessage({ ok: false, text: t('share.captureError') });
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
      setSaveMessage({ ok: false, text: t('share.captureError') });
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
        a.download = 'matchday-standings.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const MediaLibrary = (await import('expo-media-library/legacy')) as MediaLibraryModule;
        const { status } = await MediaLibrary.requestPermissionsAsync(true);
        if (status !== 'granted') {
          setSaveMessage({ ok: false, text: t('share.photosPermission') });
          return;
        }
        const uri = await captureNative();
        if (!uri) return;
        await MediaLibrary.saveToLibraryAsync(uri);
        setSaveMessage({ ok: true, text: t('share.saved') });
      }
    } catch {
      setSaveMessage({ ok: false, text: t('share.saveError') });
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
        const file = new File([blob], 'matchday-standings.png', { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: tournamentName });
        } else if (navigator.share) {
          await navigator.share({
            title: tournamentName,
            text: t('tournament.shareStandings.nativeShareText'),
          });
        }
      } else {
        const uri = await captureNative();
        if (!uri) return;
        const Sharing = (await import('expo-sharing')) as SharingModule;
        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) {
          setSaveMessage({ ok: false, text: t('share.notAvailable') });
          return;
        }
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: t('tournament.shareStandings.dialogTitle'),
        });
      }
    } catch {
      // user cancelled share dialog
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView style={modalStyles.root} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>
            {t('tournament.shareStandings.title').toUpperCase()}
          </Text>
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
              <StandingsCard
                tournamentName={tournamentName}
                subtitle={subtitle}
                standings={standings}
                rounds={includedRounds}
                roundOrdinals={roundOrdinals}
              />
            </View>
          </View>
        </ScrollView>

        {/* Options */}
        <View style={modalStyles.optionsWrap}>
          <Toggle
            label={t('share.includeRankedMatches')}
            value={includeRanked}
            onValueChange={setIncludeRanked}
          />
          <Toggle
            label={t('share.includeFriendlyMatches')}
            value={includeFriendly}
            onValueChange={setIncludeFriendly}
          />
        </View>

        {/* Action buttons */}
        {saveMessage && (
          <Text
            style={[
              modalStyles.saveMsg,
              saveMessage.ok ? modalStyles.saveMsgOk : modalStyles.saveMsgErr,
            ]}
          >
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
                {Platform.OS === 'web' ? t('share.download') : t('share.saveToPhotos')}
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
              <Text style={[modalStyles.actionText, { color: colors.bg.base }]}>
                {t('share.share')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
