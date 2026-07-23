import React, { useRef, useState, useMemo, useEffect } from 'react';
import * as Sentry from '@sentry/react-native';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { type ArchivedRound } from '@/store/types';
import { calculateStandings, type Standing } from '@/utils/standings';
import { useColors } from '@/theme';
import { Toggle } from '@/components/Toggle';
import { FontFamily } from '@/theme/typography';
import { STANDINGS_NUM_COLS, formatShareCardDate } from '@/utils/shareCard';
import { SHARE_BASE_URL } from '@/utils/shareBaseUrl';
import { buildSharedRoundUrl } from '@/utils/sharedRoundUrl';
import { makeWinnerStyles, makeModalStyles } from './ShareRoundModal.styles';
// Native-only modules loaded dynamically so web build doesn't crash
type CaptureRef = (typeof import('react-native-view-shot'))['captureRef'];
type MediaLibraryModule = typeof import('expo-media-library/legacy');
type SharingModule = typeof import('expo-sharing');
type Html2Canvas = typeof import('html2canvas').default;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShareRoundModalProps {
  visible: boolean;
  onClose: () => void;
  round: ArchivedRound;
  /** Ordinal among ranked rounds only — computed by the caller via getRankedRoundOrdinals, since `round.n` may be a stale value from before that fix. */
  roundNumber: number;
  tournamentName: string;
}

// ---------------------------------------------------------------------------
// Inline Avatar — mirrors src/components/Avatar.tsx (team logo, square,
// 3-letter fallback) for use inside the share cards
// ---------------------------------------------------------------------------

export function CardAvatar({ teamCode, size }: { teamCode?: string; size: number }) {
  const team = useStore((s) => s.teams.find((t) => t.code === teamCode));
  const colors = useColors();
  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = team?.logo?.startsWith('http') ? team.logo : undefined;

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  const radius = Math.round(size * 0.3);
  const baseStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    overflow: 'hidden' as const,
  };

  if (!team) {
    return <View style={[baseStyle, { backgroundColor: colors.bg.elevated }]} />;
  }

  if (logoUrl && !logoFailed) {
    return (
      <View style={baseStyle}>
        <Image
          source={{ uri: logoUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          cachePolicy="memory-disk"
          onError={() => setLogoFailed(true)}
        />
      </View>
    );
  }

  const label = team.short.slice(0, 3).toUpperCase();
  return (
    <View
      style={[
        baseStyle,
        { backgroundColor: team.color + '28', alignItems: 'center', justifyContent: 'center' },
      ]}
    >
      <Text
        style={{
          fontFamily: FontFamily.bodySemiBold,
          fontSize: size * 0.28,
          color: team.color,
          textAlign: 'center',
          lineHeight: size - 4,
        }}
      >
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
  roundNumber: number;
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
  const { t } = useTranslation();

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
          {player?.name ?? t('common.unknown')}
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
  const { t } = useTranslation();
  const playerA = players.find((p) => p.id === match.aId);
  const playerB = players.find((p) => p.id === match.bId);

  const aWins = match.aScore > match.bScore;
  const bWins = match.bScore > match.aScore;

  return (
    <View style={[winnerStyles.matchRow, !isLast && winnerStyles.matchRowBorder]}>
      <View style={winnerStyles.matchSide}>
        <CardAvatar teamCode={playerA?.teamCode} size={22} />
        <Text
          style={[winnerStyles.matchName, aWins && winnerStyles.matchNameWin]}
          numberOfLines={1}
        >
          {playerA?.name ?? t('common.unknown')}
        </Text>
      </View>
      <Text style={winnerStyles.matchScore}>
        <Text style={aWins && winnerStyles.matchScoreWin}>{match.aScore}</Text>
        {' : '}
        <Text style={bWins && winnerStyles.matchScoreWin}>{match.bScore}</Text>
      </Text>
      <View style={[winnerStyles.matchSide, winnerStyles.matchSideRight]}>
        <Text
          style={[
            winnerStyles.matchName,
            winnerStyles.matchNameRight,
            bWins && winnerStyles.matchNameWin,
          ]}
          numberOfLines={1}
        >
          {playerB?.name ?? t('common.unknown')}
        </Text>
        <CardAvatar teamCode={playerB?.teamCode} size={22} />
      </View>
    </View>
  );
}

function WinnerCard({
  round,
  roundNumber,
  tournamentName,
  includeMatches = false,
  includeStandings = false,
}: WinnerCardProps) {
  const players = useStore((s) => s.players);
  const teams = useStore((s) => s.teams);
  const colors = useColors();
  const winnerStyles = makeWinnerStyles(colors);
  const { t } = useTranslation();

  const playerIds = useMemo(() => {
    const ids = new Set<string>();
    round.matches.forEach((m) => {
      ids.add(m.aId);
      ids.add(m.bId);
    });
    return Array.from(ids);
  }, [round.matches]);

  const standings = useMemo(
    () => calculateStandings(round.matches, playerIds),
    [round.matches, playerIds],
  );

  const winner = players.find((p) => p.id === round.winner);
  const winnerTeam = teams.find((team) => team.code === winner?.teamCode);
  const winnerStats = standings.find((s) => s.playerId === round.winner);
  const isDraw = !round.winner;

  const glowColor = winnerTeam?.color ?? colors.accent.green;
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
          {isDraw
            ? t('shareRound.matchDayResult').toUpperCase()
            : t('shareRound.roundWinner').toUpperCase()}
        </Text>
        <Text style={winnerStyles.heroMatchCount}>
          {(round.matches.length === 1
            ? t('shareRound.matchCount', { count: round.matches.length })
            : t('shareRound.matchCountPlural', { count: round.matches.length })
          ).toUpperCase()}
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
          {isDraw ? t('shareRound.drawResult').toUpperCase() : (winner?.name ?? '—').toUpperCase()}
        </Text>

        {/* Stats row */}
        {winnerStats && (
          <View style={winnerStyles.statsRow}>
            <View style={winnerStyles.statItem}>
              <Text style={[winnerStyles.statValue, { color: colors.accent.green }]}>
                {winnerStats.wins}
              </Text>
              <Text style={winnerStyles.statLabel}>{t('table.wins')}</Text>
            </View>
            <View style={winnerStyles.statDot} />
            <View style={winnerStyles.statItem}>
              <Text style={winnerStyles.statValue}>{winnerStats.draws}</Text>
              <Text style={winnerStyles.statLabel}>{t('table.draws')}</Text>
            </View>
            <View style={winnerStyles.statDot} />
            <View style={winnerStyles.statItem}>
              <Text style={[winnerStyles.statValue, { color: colors.accent.red }]}>
                {winnerStats.losses}
              </Text>
              <Text style={winnerStyles.statLabel}>{t('table.losses')}</Text>
            </View>
            <View style={winnerStyles.statSep} />
            <View style={winnerStyles.statItem}>
              <Text style={winnerStyles.statValue}>
                {winnerStats.gf}
                <Text style={winnerStyles.statGA}>:{winnerStats.ga}</Text>
              </Text>
              <Text style={winnerStyles.statLabel}>{t('shareRound.goals')}</Text>
            </View>
            <View style={winnerStyles.statDot} />
            <View style={winnerStyles.statItem}>
              <Text style={[winnerStyles.statValue, { color: colors.accent.gold }]}>
                {winnerStats.pts}
              </Text>
              <Text style={winnerStyles.statLabel}>{t('common.pts')}</Text>
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
                {t('table.player').toUpperCase()}
              </Text>
              {STANDINGS_NUM_COLS.map((col) => (
                <Text
                  key={col.key}
                  style={[winnerStyles.standingsHeaderCell, winnerStyles.standingsNumCol]}
                >
                  {col.label}
                </Text>
              ))}
              <Text style={[winnerStyles.standingsHeaderCell, winnerStyles.standingsNumCol]}>
                {t('table.gd')}
              </Text>
              <Text style={[winnerStyles.standingsHeaderCell, winnerStyles.standingsNumCol]}>
                {t('common.pts')}
              </Text>
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
            <Text style={winnerStyles.matchesTitle}>
              {t('shareRound.allMatches').toUpperCase()}
            </Text>
            {round.matches.map((m, idx) => (
              <MatchRow key={m.id} match={m} isLast={idx === round.matches.length - 1} />
            ))}
          </View>
        </>
      )}

      {/* Footer */}
      <View style={winnerStyles.divider} />
      <View style={winnerStyles.footer}>
        <Text style={winnerStyles.footerTour} numberOfLines={1}>
          {tournamentName.toUpperCase()}
        </Text>
        <Text style={winnerStyles.footerRound}>
          {t('shareRound.footer', { round: roundNumber, count: round.matches.length })}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Modal
// ---------------------------------------------------------------------------

export function ShareRoundModal({
  visible,
  onClose,
  round,
  roundNumber,
  tournamentName,
}: ShareRoundModalProps) {
  const [loading, setLoading] = useState(false);
  const [includeMatches, setIncludeMatches] = useState(false);
  const [includeStandings, setIncludeStandings] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const colors = useColors();
  const modalStyles = makeModalStyles(colors);
  const { t } = useTranslation();

  const cardRef = useRef<View>(null);

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
    } catch (e) {
      console.warn('[ShareRoundModal] captureNative failed:', e);
      Sentry.captureException(e, { tags: { shareOp: 'captureNative' } });
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
    } catch (e) {
      console.warn('[ShareRoundModal] captureWeb failed:', e);
      Sentry.captureException(e, { tags: { shareOp: 'captureWeb' } });
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
        a.download = `matchday-round-${roundNumber}.png`;
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
    } catch (e) {
      console.warn('[ShareRoundModal] handleSave failed:', e);
      Sentry.captureException(e, { tags: { shareOp: 'handleSave' } });
      setSaveMessage({ ok: false, text: t('share.saveError') });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!round.shareId) return;
    try {
      await Clipboard.setStringAsync(buildSharedRoundUrl(SHARE_BASE_URL, round.shareId));
      setSaveMessage({ ok: true, text: t('share.linkCopied') });
    } catch (e) {
      console.warn('[ShareRoundModal] handleCopyLink failed:', e);
      Sentry.captureException(e, { tags: { shareOp: 'handleCopyLink' } });
      setSaveMessage({ ok: false, text: t('share.saveError') });
    }
  };

  const handleShare = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        const blob = await captureWeb();
        if (!blob) return;
        const file = new File([blob], `matchday-round-${roundNumber}.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: t('shareRound.nativeShareTitle', { round: roundNumber, name: tournamentName }),
          });
        } else if (navigator.share) {
          await navigator.share({
            title: t('shareRound.nativeShareTitle', { round: roundNumber, name: tournamentName }),
            text: t('shareRound.nativeShareText'),
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
          dialogTitle: t('shareRound.dialogTitle'),
        });
      }
    } catch (e) {
      // navigator.share/Sharing.shareAsync throw AbortError when the user
      // cancels the share sheet — not a real failure, don't report it.
      const isUserCancel = e instanceof Error && e.name === 'AbortError';
      if (!isUserCancel) {
        console.warn('[ShareRoundModal] handleShare failed:', e);
        Sentry.captureException(e, { tags: { shareOp: 'handleShare' } });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={modalStyles.root} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>{t('shareRound.title').toUpperCase()}</Text>
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
                roundNumber={roundNumber}
                tournamentName={tournamentName}
                includeMatches={includeMatches}
                includeStandings={includeStandings}
              />
            </View>
          </View>
        </ScrollView>

        {/* Options */}
        <View style={modalStyles.optionsWrap}>
          <Toggle
            label={t('share.includeStandings')}
            value={includeStandings}
            onValueChange={setIncludeStandings}
          />
          <Toggle
            label={t('share.includeAllMatches')}
            value={includeMatches}
            onValueChange={setIncludeMatches}
          />
        </View>

        {/* Copy public link */}
        {round.shareId && (
          <View style={modalStyles.copyLinkWrap}>
            <TouchableOpacity
              style={modalStyles.copyLinkBtn}
              onPress={handleCopyLink}
              activeOpacity={0.8}
            >
              <Text style={modalStyles.copyLinkText}>{t('share.copyLink')}</Text>
            </TouchableOpacity>
          </View>
        )}

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
