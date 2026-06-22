import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '@/store';
import { calculateStandings, isTopTied } from '@/utils/standings';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { Avatar } from '@/components/Avatar';
import { TeamBadge } from '@/components/TeamBadge';
import { MatchCard } from '@/components/MatchCard';
import { StandingCard } from '@/components/StandingCard';
import { ScoreCounter } from '@/components/ScoreCounter';
import { SectionLabel } from '@/components/SectionLabel';
import { EmptyState } from '@/components/EmptyState';
import { MediaThumbnail } from '@/components/MediaThumbnail';
import { Match, MediaItem } from '@/store/types';
import { useTranslation } from 'react-i18next';
import { uploadMediaItems } from '@/supabase/storage';
import { extractStatsFromPhoto } from '@/utils/extractStats';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type StandingsView = 'table' | 'cards';

const TABLE_COLS = [
  { key: 'И', tKey: 'table.played', perGame: false, pts: false },
  { key: 'В', tKey: 'table.wins', perGame: false, pts: false },
  { key: 'Н', tKey: 'table.draws', perGame: false, pts: false },
  { key: 'П', tKey: 'table.losses', perGame: false, pts: false },
  { key: 'ГЗ', tKey: 'table.gf', perGame: false, pts: false },
  { key: 'ГП', tKey: 'table.ga', perGame: false, pts: false },
  { key: 'РГ', tKey: 'table.gd', perGame: false, pts: false },
  { key: 'О', tKey: 'table.pts', perGame: false, pts: true },
  { key: 'ГЗ/і', tKey: 'table.gfPerGame', perGame: true, pts: false },
  { key: 'ГП/і', tKey: 'table.gaPerGame', perGame: true, pts: false },
] as const;

// ---- Add Match sheet step state ----
interface AddMatchState {
  step: number; // 1-5 (step 2 skipped when ranked)
  homeId: string | null;
  awayId: string | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  media: MediaItem[];
  note: string;
  pendingStats: Record<string, { a: number; b: number }> | null;
  ocrScanning: boolean;
}

function initAddMatch(): AddMatchState {
  return {
    step: 1,
    homeId: null,
    awayId: null,
    homeTeam: '',
    awayTeam: '',
    homeScore: 0,
    awayScore: 0,
    media: [],
    note: '',
    pendingStats: null,
    ocrScanning: false,
  };
}

// ---- Confetti Piece ----
function ConfettiPiece({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const x = useRef(Math.random() * SCREEN_WIDTH).current;
  const COLORS = [
    Colors.accent.green,
    Colors.accent.yellow,
    Colors.accent.blue,
    '#c98bff',
    '#ff8f6b',
  ];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const size = 8 + Math.random() * 10;

  React.useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 2500 + Math.random() * 1500,
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(t);
  }, [anim, delay]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 900],
  });
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${Math.random() > 0.5 ? '' : '-'}${360 + Math.random() * 360}deg`],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        width: size,
        height: size,
        borderRadius: size / 4,
        backgroundColor: color,
        transform: [{ translateY }, { rotate }],
        opacity: anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
      }}
    />
  );
}

export default function MatchdayScreen() {
  const router = useRouter();
  const store = useStore();
  const { t } = useTranslation();

  const {
    tournamentName,
    round,
    roundOpen,
    tournamentRanked,
    roundPlayers,
    matches,
    modal,
    players,
    selectedMatchId,
    teams,
  } = store;

  const [standingsView, setStandingsView] = useState<StandingsView>('table');
  const [addMatch, setAddMatch] = useState<AddMatchState>(initAddMatch());
  const [localWinnerId, setLocalWinnerId] = useState<string | null>(null);

  const standings = calculateStandings(matches, roundPlayers);

  const tournamentPlayerList = players.filter((p) =>
    roundPlayers.includes(p.id),
  );

  // ---- Match validation ----
  const allPlayedEqual = (() => {
    if (standings.length === 0) return true;
    const counts = standings.map((s) => s.played);
    return counts.every((c) => c === counts[0]);
  })();

  const handleFinishPress = useCallback(() => {
    if (matches.length === 0) {
      store.setModal('needEqual');
      return;
    }
    if (!allPlayedEqual) {
      store.setModal('needEqual');
      return;
    }
    store.setModal('end');
  }, [allPlayedEqual, matches.length, store]);

  const handleConfirmFinish = useCallback(() => {
    const s = calculateStandings(matches, roundPlayers);
    const isTrueDraw = isTopTied(s, matches);
    const winnerId = isTrueDraw || !s[0] ? null : s[0].playerId;
    setLocalWinnerId(winnerId);
    store.finishRound();
    store.setModal('winner');
  }, [matches, roundPlayers, store]);

  const handleWinnerDone = useCallback(() => {
    store.setModal(null);
    router.push('/tournament');
  }, [store, router]);

  // ---- Add match ----
  const totalSteps = tournamentRanked ? 4 : 5;

  const effectiveStep = (step: number) => {
    // When ranked, step numbering: 1=players,2=score,3=media,4=commentary
    // When not ranked: 1=players,2=teams,3=score,4=media,5=commentary
    return step;
  };

  const getStepLabel = (step: number) => {
    if (tournamentRanked) {
      return [
        t('matchday.steps.whoIsPlaying'),
        t('matchday.steps.finalScore'),
        t('matchday.steps.addPhotos'),
        t('matchday.steps.commentary'),
      ][step - 1] ?? '';
    }
    return [
      t('matchday.steps.whoIsPlaying'),
      t('matchday.steps.pickTeams'),
      t('matchday.steps.finalScore'),
      t('matchday.steps.addPhotos'),
      t('matchday.steps.commentary'),
    ][step - 1] ?? '';
  };

  const canGoNext = useCallback((state: AddMatchState): boolean => {
    const { step } = state;
    if (tournamentRanked) {
      if (step === 1) return !!state.homeId && !!state.awayId;
      return true;
    } else {
      if (step === 1) return !!state.homeId && !!state.awayId;
      if (step === 2) return !!state.homeTeam && !!state.awayTeam;
      return true;
    }
  }, [tournamentRanked]);

  const handleNext = useCallback(() => {
    setAddMatch((prev) => ({ ...prev, step: Math.min(prev.step + 1, totalSteps) }));
  }, [totalSteps]);

  const handleBack = useCallback(() => {
    setAddMatch((prev) => {
      if (prev.step <= 1) {
        store.setModal(null);
        return initAddMatch();
      }
      return { ...prev, step: prev.step - 1 };
    });
  }, [store]);

  const handleSaveMatch = useCallback(async () => {
    if (!addMatch.homeId || !addMatch.awayId) return;
    const homePlayer = players.find((p) => p.id === addMatch.homeId);
    const awayPlayer = players.find((p) => p.id === addMatch.awayId);
    const hTeam = addMatch.homeTeam || homePlayer?.teamCode || 'UNK';
    const aTeam = addMatch.awayTeam || awayPlayer?.teamCode || 'UNK';

    // Upload local media to Supabase Storage before saving
    const uploadedMedia = addMatch.media.length > 0
      ? await uploadMediaItems(addMatch.media)
      : [];

    const match: Match = {
      id: `match-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      aId: addMatch.homeId,
      bId: addMatch.awayId,
      aTeam: hTeam,
      bTeam: aTeam,
      aScore: addMatch.homeScore,
      bScore: addMatch.awayScore,
      media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
      note: addMatch.note.trim() || undefined,
      statsOverride: addMatch.pendingStats ?? undefined,
    };
    store.addMatch(match);
    store.setModal(null);
    setAddMatch(initAddMatch());
  }, [addMatch, players, store]);

  const handlePickMedia = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.85,
      base64: true,
    });
    if (result.canceled) return;

    const newItems: MediaItem[] = result.assets.map((a) => ({
      uri: a.uri,
      type: a.type === 'video' ? 'video' : 'image',
    }));

    setAddMatch((prev) => ({
      ...prev,
      media: [...prev.media, ...newItems].slice(0, 7),
      ocrScanning: true,
    }));

    // Run OCR in background on all image assets
    const imageAssets = result.assets.filter((a) => a.type !== 'video' && a.base64);
    if (imageAssets.length === 0) {
      setAddMatch((prev) => ({ ...prev, ocrScanning: false }));
      return;
    }

    (async () => {
      try {
        const rank = (c: string) => (c === 'high' ? 3 : c === 'medium' ? 2 : 1);
        const map = new Map<string, { a: number; b: number }>();

        for (const asset of imageAssets) {
          const stats = await extractStatsFromPhoto(
            asset.base64!,
            asset.mimeType ?? 'image/jpeg',
          );
          for (const s of stats) {
            const existing = map.get(s.key);
            if (!existing || rank(s.confidence) > rank((existing as any).__conf ?? 'low')) {
              map.set(s.key, { a: s.home, b: s.away, __conf: s.confidence } as any);
            }
          }
        }

        // Strip internal __conf field
        const pendingStats: Record<string, { a: number; b: number }> = {};
        map.forEach((v, k) => { pendingStats[k] = { a: v.a, b: v.b }; });

        setAddMatch((prev) => ({
          ...prev,
          ocrScanning: false,
          pendingStats: Object.keys(pendingStats).length > 0 ? pendingStats : null,
        }));
      } catch {
        setAddMatch((prev) => ({ ...prev, ocrScanning: false }));
      }
    })();
  }, []);

  const handleRemoveMedia = useCallback((idx: number) => {
    setAddMatch((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== idx),
    }));
  }, []);

  // ---- Render step content ----
  const renderStepContent = () => {
    const step = addMatch.step;

    if (tournamentRanked) {
      switch (step) {
        case 1: return renderStepPlayers();
        case 2: return renderStepScore();
        case 3: return renderStepMedia();
        case 4: return renderStepCommentary();
        default: return null;
      }
    } else {
      switch (step) {
        case 1: return renderStepPlayers();
        case 2: return renderStepTeams();
        case 3: return renderStepScore();
        case 4: return renderStepMedia();
        case 5: return renderStepCommentary();
        default: return null;
      }
    }
  };

  const renderStepPlayers = () => (
    <View style={sheetStyles.stepContent}>
      <Text style={sheetStyles.stepHint}>{t('matchday.selectHomePlayer')}</Text>
      <View style={sheetStyles.playerChips}>
        {tournamentPlayerList.map((p) => {
          const isHome = addMatch.homeId === p.id;
          const isAway = addMatch.awayId === p.id;
          const isUsed = isHome || isAway;
          return (
            <TouchableOpacity
              key={p.id}
              style={[
                sheetStyles.playerChip,
                isHome && sheetStyles.playerChipHome,
                isAway && sheetStyles.playerChipAway,
              ]}
              onPress={() => {
                setAddMatch((prev) => {
                  if (prev.homeId === p.id) return { ...prev, homeId: null };
                  if (prev.awayId === p.id) return { ...prev, awayId: null };
                  if (!prev.homeId) return { ...prev, homeId: p.id };
                  return { ...prev, awayId: p.id };
                });
              }}
              activeOpacity={0.75}
            >
              <Avatar playerId={p.id} size="md" />
              <Text
                style={[
                  sheetStyles.playerChipName,
                  isUsed && { color: Colors.text.primary },
                ]}
                numberOfLines={1}
              >
                {p.nick ?? p.name}
              </Text>
              {isHome && (
                <View style={sheetStyles.homeLabel}>
                  <Text style={sheetStyles.homeLabelText}>{t('matchday.home')}</Text>
                </View>
              )}
              {isAway && (
                <View style={sheetStyles.awayLabel}>
                  <Text style={sheetStyles.awayLabelText}>{t('matchday.away')}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStepTeams = () => {
    const homePl = players.find((p) => p.id === addMatch.homeId);
    const awayPl = players.find((p) => p.id === addMatch.awayId);
    return (
      <View style={sheetStyles.stepContent}>
        {/* Home team picker */}
        <Text style={sheetStyles.stepHint}>
          {t('matchday.pickTeam', { name: homePl?.name ?? 'Home' })}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sheetStyles.teamPicker}>
          {teams.map((t) => (
            <TouchableOpacity
              key={t.code}
              style={[
                sheetStyles.teamPickItem,
                addMatch.homeTeam === t.code && {
                  borderColor: t.color + '88',
                  backgroundColor: t.color + '22',
                },
              ]}
              onPress={() => setAddMatch((p) => ({ ...p, homeTeam: t.code }))}
              activeOpacity={0.8}
            >
              <TeamBadge teamCode={t.code} size="md" />
              <Text style={sheetStyles.teamPickName} numberOfLines={1}>{t.short}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[sheetStyles.stepHint, { marginTop: Spacing.lg }]}>
          {t('matchday.pickTeam', { name: awayPl?.name ?? 'Away' })}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sheetStyles.teamPicker}>
          {teams.map((t) => (
            <TouchableOpacity
              key={t.code}
              style={[
                sheetStyles.teamPickItem,
                addMatch.awayTeam === t.code && {
                  borderColor: t.color + '88',
                  backgroundColor: t.color + '22',
                },
              ]}
              onPress={() => setAddMatch((p) => ({ ...p, awayTeam: t.code }))}
              activeOpacity={0.8}
            >
              <TeamBadge teamCode={t.code} size="md" />
              <Text style={sheetStyles.teamPickName} numberOfLines={1}>{t.short}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderStepScore = () => {
    const hTeam = addMatch.homeTeam ||
      players.find((p) => p.id === addMatch.homeId)?.teamCode || 'UNK';
    const aTeam = addMatch.awayTeam ||
      players.find((p) => p.id === addMatch.awayId)?.teamCode || 'UNK';

    const hScore = addMatch.homeScore;
    const aScore = addMatch.awayScore;
    const resultLabel =
      hScore > aScore ? t('matchday.homeWin')
      : aScore > hScore ? t('matchday.awayWin')
      : t('matchday.draw');
    const resultColor =
      hScore === aScore ? Colors.text.muted : Colors.accent.green;

    return (
      <View style={sheetStyles.stepContent}>
        <View style={sheetStyles.scoreRow}>
          <ScoreCounter
            playerId={addMatch.homeId ?? ''}
            teamCode={hTeam}
            score={hScore}
            onIncrement={() => setAddMatch((p) => ({ ...p, homeScore: p.homeScore + 1 }))}
            onDecrement={() => setAddMatch((p) => ({ ...p, homeScore: Math.max(0, p.homeScore - 1) }))}
          />
          <View style={sheetStyles.scoreDivider}>
            <Text style={sheetStyles.scoreDividerText}>VS</Text>
            <View style={sheetStyles.resultPill}>
              <Text style={[sheetStyles.resultLabel, { color: resultColor }]}>
                {resultLabel}
              </Text>
            </View>
          </View>
          <ScoreCounter
            playerId={addMatch.awayId ?? ''}
            teamCode={aTeam}
            score={aScore}
            onIncrement={() => setAddMatch((p) => ({ ...p, awayScore: p.awayScore + 1 }))}
            onDecrement={() => setAddMatch((p) => ({ ...p, awayScore: Math.max(0, p.awayScore - 1) }))}
          />
        </View>
      </View>
    );
  };

  const renderStepMedia = () => (
    <View style={sheetStyles.stepContent}>
      <Text style={sheetStyles.stepHint}>{t('matchday.addMedia')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sheetStyles.mediaScroll}>
        <View style={sheetStyles.mediaRow}>
          {addMatch.media.map((item, idx) => (
            <MediaThumbnail
              key={idx}
              uri={item.uri}
              onRemove={() => handleRemoveMedia(idx)}
            />
          ))}
          {addMatch.media.length < 7 && (
            <TouchableOpacity
              style={sheetStyles.addMediaBtn}
              onPress={handlePickMedia}
              activeOpacity={0.75}
            >
              <Text style={sheetStyles.addMediaIcon}>+</Text>
              <Text style={sheetStyles.addMediaText}>{t('matchday.addMediaBtn')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      {addMatch.ocrScanning && (
        <View style={sheetStyles.ocrStatus}>
          <ActivityIndicator size="small" color={Colors.accent.blue} />
          <Text style={sheetStyles.ocrStatusText}>Reading stats...</Text>
        </View>
      )}
      {!addMatch.ocrScanning && addMatch.pendingStats && (
        <View style={sheetStyles.ocrStatus}>
          <Text style={sheetStyles.ocrFoundText}>
            📊 {Object.keys(addMatch.pendingStats).length} stats found
          </Text>
        </View>
      )}
    </View>
  );

  const renderStepCommentary = () => (
    <View style={sheetStyles.stepContent}>
      <Text style={sheetStyles.stepHint}>{t('matchday.commentaryHint')}</Text>
      <TextInput
        style={sheetStyles.commentInput}
        value={addMatch.note}
        onChangeText={(v) => setAddMatch((p) => ({ ...p, note: v }))}
        placeholder={t('matchday.commentaryPlaceholder')}
        placeholderTextColor={Colors.text.placeholder}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        returnKeyType="default"
      />
    </View>
  );

  // ---- Winner info ----
  const winner = localWinnerId ? players.find((p) => p.id === localWinnerId) : null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.glow} pointerEvents="none" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push('/')}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backChevron}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{tournamentName}</Text>
          <Text style={styles.headerSubtitle}>{t('matchday.round', { n: round })}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.statsBtn}
            onPress={() => router.push('/stats')}
            activeOpacity={0.75}
          >
            <Text style={styles.statsBtnIcon}>📊</Text>
          </TouchableOpacity>
          {roundOpen && (
            <TouchableOpacity
              style={styles.finishBtn}
              onPress={handleFinishPress}
              activeOpacity={0.8}
            >
              <Text style={styles.finishBtnText}>{t('matchday.finish')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Standings toggle */}
      <View style={styles.toggleContainer}>
        <View style={styles.segmented}>
          <TouchableOpacity
            style={[styles.seg, standingsView === 'table' && styles.segActive]}
            onPress={() => setStandingsView('table')}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.segText, standingsView === 'table' && styles.segTextActive]}
            >
              {t('matchday.table')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.seg, standingsView === 'cards' && styles.segActive]}
            onPress={() => setStandingsView('cards')}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.segText, standingsView === 'cards' && styles.segTextActive]}
            >
              {t('matchday.cards')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Standings */}
        {standingsView === 'table' ? (
          <View style={styles.tableCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                {/* Table header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.tableCellPlayer]}>{t('table.player')}</Text>
                  {TABLE_COLS.map((col) => (
                    <Text
                      key={col.key}
                      style={[
                        styles.tableCell,
                        col.perGame ? styles.tableCellPerGame : styles.tableCellNum,
                        col.pts && styles.tableCellPts,
                      ]}
                    >
                      {t(col.tKey)}
                    </Text>
                  ))}
                </View>
                {/* Table rows */}
                {standings.map((s, idx) => {
                  const player = players.find((p) => p.id === s.playerId);
                  const isLeader = idx === 0 && s.played > 0;
                  const gfPerGame = s.played > 0 ? (s.gf / s.played).toFixed(1) : '—';
                  const gaPerGame = s.played > 0 ? (s.ga / s.played).toFixed(1) : '—';
                  return (
                    <View
                      key={s.playerId}
                      style={[styles.tableRow, isLeader && styles.tableRowLeader]}
                    >
                      <View style={[styles.tableCellPlayer, styles.tableCellPlayerInner]}>
                        <Avatar playerId={s.playerId} size="sm" />
                        <Text style={styles.tablePlayerName} numberOfLines={1}>
                          {player?.nick ?? player?.name ?? t('common.unknown')}
                        </Text>
                      </View>
                      <Text style={[styles.tableCell, styles.tableCellNum]}>{s.played}</Text>
                      <Text style={[styles.tableCell, styles.tableCellNum]}>{s.wins}</Text>
                      <Text style={[styles.tableCell, styles.tableCellNum]}>{s.draws}</Text>
                      <Text style={[styles.tableCell, styles.tableCellNum]}>{s.losses}</Text>
                      <Text style={[styles.tableCell, styles.tableCellNum]}>{s.gf}</Text>
                      <Text style={[styles.tableCell, styles.tableCellNum]}>{s.ga}</Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.tableCellNum,
                          {
                            color:
                              s.gd > 0
                                ? Colors.accent.green
                                : s.gd < 0
                                ? Colors.accent.red
                                : Colors.text.muted,
                          },
                        ]}
                      >
                        {s.gd > 0 ? '+' : ''}{s.gd}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.tableCellNum,
                          styles.tableCellPts,
                          { color: Colors.accent.green },
                        ]}
                      >
                        {s.pts}
                      </Text>
                      <Text style={[styles.tableCell, styles.tableCellNum, styles.tableCellPerGame]}>
                        {gfPerGame}
                      </Text>
                      <Text style={[styles.tableCell, styles.tableCellNum, styles.tableCellPerGame]}>
                        {gaPerGame}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {standings.map((s, idx) => (
              <StandingCard
                key={s.playerId}
                standing={s}
                position={idx + 1}
                playerId={s.playerId}
              />
            ))}
          </View>
        )}

        {/* Matches */}
        <View style={styles.matchesSection}>
          <SectionLabel label={t('matchday.matchesSection', { count: matches.length })} />
          <View style={styles.matchesList}>
            {matches.length === 0 ? (
              <EmptyState
                message={t('matchday.noMatches')}
                ctaText={roundOpen ? t('matchday.noMatchesAction') : undefined}
                onPress={roundOpen ? () => store.setModal('add') : undefined}
              />
            ) : (
              [...matches].reverse().map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  onPress={() => {
                    store.setSelectedMatch(m.id);
                    router.push(`/match/${m.id}`);
                  }}
                />
              ))
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Match CTA */}
      {roundOpen && (
        <View style={styles.fab}>
          <TouchableOpacity
            style={styles.fabBtn}
            onPress={() => store.setModal('add')}
            activeOpacity={0.85}
          >
            <Text style={styles.fabText}>{t('matchday.addMatch')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ---- ADD MATCH SHEET ---- */}
      <Modal
        visible={modal === 'add'}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => { store.setModal(null); setAddMatch(initAddMatch()); }}
      >
        <View style={sheetStyles.container}>
          <Pressable
            style={sheetStyles.overlay}
            onPress={() => { store.setModal(null); setAddMatch(initAddMatch()); }}
          />
          <View style={sheetStyles.sheet}>
            <View style={sheetStyles.sheetHandle} />

            {/* Progress bar */}
            <View style={sheetStyles.progressBar}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    sheetStyles.progressSegment,
                    i < addMatch.step && sheetStyles.progressSegmentFilled,
                  ]}
                />
              ))}
            </View>

            <View style={sheetStyles.stepTitleRow}>
              <Text style={sheetStyles.stepTitle}>
                {getStepLabel(addMatch.step)}
              </Text>
              <Text style={sheetStyles.stepIndicator}>
                {t('matchday.step', { current: addMatch.step, total: totalSteps })}
              </Text>
            </View>

            <ScrollView
              style={sheetStyles.contentScroll}
              contentContainerStyle={sheetStyles.contentScrollPad}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderStepContent()}
            </ScrollView>

            {/* Actions */}
            <View style={sheetStyles.actions}>
              <TouchableOpacity
                style={sheetStyles.backActionBtn}
                onPress={handleBack}
                activeOpacity={0.75}
              >
                <Text style={sheetStyles.backActionText}>
                  {addMatch.step === 1 ? t('common.cancel') : t('common.back')}
                </Text>
              </TouchableOpacity>
              {addMatch.step < totalSteps ? (
                <TouchableOpacity
                  style={[
                    sheetStyles.nextBtn,
                    !canGoNext(addMatch) && sheetStyles.nextBtnDisabled,
                  ]}
                  onPress={handleNext}
                  disabled={!canGoNext(addMatch)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      sheetStyles.nextBtnText,
                      !canGoNext(addMatch) && sheetStyles.nextBtnTextDisabled,
                    ]}
                  >
                    {t('common.next')}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={sheetStyles.nextBtn}
                  onPress={handleSaveMatch}
                  activeOpacity={0.85}
                >
                  <Text style={sheetStyles.nextBtnText}>{t('matchday.saveMatch')}</Text>
                </TouchableOpacity>
              )}
            </View>
            {Platform.OS === 'ios' && <View style={{ height: 16 }} />}
          </View>
        </View>
      </Modal>

      {/* ---- END ROUND DIALOG ---- */}
      <Modal
        visible={modal === 'end'}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => store.setModal(null)}
      >
        <View style={dialogStyles.overlay}>
          <View style={dialogStyles.dialog}>
            <Text style={dialogStyles.dialogIcon}>🏁</Text>
            <Text style={dialogStyles.dialogTitle}>{t('matchday.dialogs.finishTitle')}</Text>
            <Text style={dialogStyles.dialogDesc}>
              {t('matchday.dialogs.finishDesc')}{'\n'}
              {standings[0] ? t('matchday.dialogs.leading', { name: players.find((p) => p.id === standings[0].playerId)?.name ?? '', pts: standings[0].pts }) : ''}
            </Text>
            <View style={dialogStyles.actions}>
              <TouchableOpacity
                style={dialogStyles.cancelBtn}
                onPress={() => store.setModal(null)}
                activeOpacity={0.75}
              >
                <Text style={dialogStyles.cancelText}>{t('matchday.dialogs.keepPlaying')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={dialogStyles.confirmBtn}
                onPress={handleConfirmFinish}
                activeOpacity={0.85}
              >
                <Text style={dialogStyles.confirmText}>{t('matchday.dialogs.crownWinner')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---- NEED EQUAL MODAL ---- */}
      <Modal
        visible={modal === 'needEqual'}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => store.setModal(null)}
      >
        <View style={dialogStyles.overlay}>
          <View style={dialogStyles.dialog}>
            <Text style={dialogStyles.dialogIcon}>⚖️</Text>
            <Text style={dialogStyles.dialogTitle}>{t('matchday.dialogs.evenGamesTitle')}</Text>
            <Text style={dialogStyles.dialogDesc}>
              {t('matchday.dialogs.evenGamesDesc')}
            </Text>
            {standings.map((s) => {
              const player = players.find((p) => p.id === s.playerId);
              return (
                <View key={s.playerId} style={dialogStyles.equalRow}>
                  <Avatar playerId={s.playerId} size="sm" />
                  <Text style={dialogStyles.equalName}>
                    {player?.nick ?? player?.name}
                  </Text>
                  <Text style={dialogStyles.equalCount}>{s.played} {t('common.games')}</Text>
                </View>
              );
            })}
            <TouchableOpacity
              style={dialogStyles.confirmBtn}
              onPress={() => store.setModal(null)}
              activeOpacity={0.85}
            >
              <Text style={dialogStyles.confirmText}>{t('matchday.dialogs.gotIt')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ---- DELETE MATCH DIALOG ---- */}
      <Modal
        visible={modal === 'del'}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => store.setModal(null)}
      >
        <View style={dialogStyles.overlay}>
          <View style={dialogStyles.dialog}>
            <Text style={[dialogStyles.dialogIcon, { color: Colors.accent.red }]}>🗑</Text>
            <Text style={dialogStyles.dialogTitle}>{t('matchday.dialogs.deleteTitle')}</Text>
            <Text style={dialogStyles.dialogDesc}>
              {t('matchday.dialogs.deleteDesc')}
            </Text>
            <View style={dialogStyles.actions}>
              <TouchableOpacity
                style={dialogStyles.cancelBtn}
                onPress={() => store.setModal(null)}
                activeOpacity={0.75}
              >
                <Text style={dialogStyles.cancelText}>{t('matchday.dialogs.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dialogStyles.confirmBtn, { backgroundColor: Colors.accent.red }]}
                onPress={() => {
                  if (selectedMatchId) {
                    store.deleteMatch(selectedMatchId);
                    store.setSelectedMatch(null);
                  }
                  store.setModal(null);
                }}
                activeOpacity={0.85}
              >
                <Text style={[dialogStyles.confirmText, { color: '#fff' }]}>{t('matchday.dialogs.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---- WINNER CELEBRATION ---- */}
      <Modal
        visible={modal === 'winner'}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleWinnerDone}
      >
        <View style={winnerStyles.overlay}>
          {/* Confetti only for winner, not draw */}
          {localWinnerId && Array.from({ length: 30 }).map((_, i) => (
            <ConfettiPiece key={i} delay={i * 80} />
          ))}

          <View style={winnerStyles.content}>
            {localWinnerId ? (
              <>
                <Text style={winnerStyles.matchDayLabel}>{t('matchday.winner.winnerLabel')}</Text>
                <Text style={winnerStyles.trophyEmoji}>🏆</Text>
                <Avatar playerId={localWinnerId} size="xl" />
                <Text style={winnerStyles.winnerName}>
                  {winner?.nick ?? winner?.name ?? 'Winner'}
                </Text>
              </>
            ) : (
              <>
                <Text style={winnerStyles.matchDayLabel}>{t('matchday.winner.drawLabel')}</Text>
                <Text style={winnerStyles.trophyEmoji}>🤝</Text>
                <Text style={winnerStyles.winnerName}>{t('matchday.winner.draw')}</Text>
              </>
            )}
            <TouchableOpacity
              style={winnerStyles.doneBtn}
              onPress={handleWinnerDone}
              activeOpacity={0.85}
            >
              <Text style={winnerStyles.doneBtnText}>{t('matchday.winner.done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ---- Main screen styles ----
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontFamily: FontFamily.display,
    fontSize: FontSize['2xl'],
    color: Colors.text.secondary,
    lineHeight: 28,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  headerTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    width: 80,
    justifyContent: 'flex-end',
  },
  statsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBtnIcon: {
    fontSize: 14,
  },
  finishBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.accent.yellow,
    backgroundColor: 'rgba(246,195,80,0.12)',
  },
  finishBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.sm,
    color: Colors.accent.yellow,
    letterSpacing: 0.5,
  },
  toggleContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.lg,
    padding: 3,
    alignSelf: 'flex-start',
  },
  seg: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm - 1,
    borderRadius: Radius.md,
  },
  segActive: {
    backgroundColor: Colors.bg.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  segText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  segTextActive: {
    color: Colors.text.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  tableCard: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  tableHeader: {
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
    paddingVertical: Spacing.sm,
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
  tableCellPlayer: {
    width: 100,
    textAlign: 'left',
  },
  tableCellPlayerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tableCellNum: {
    width: 32,
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
  },
  tableCellPts: {
    color: Colors.accent.green,
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
  },
  tableCellPerGame: {
    width: 38,
    color: Colors.text.ghost,
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
  },
  tablePlayerName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: Colors.text.primary,
    flex: 1,
  },
  cardsContainer: {
    marginBottom: Spacing.lg,
  },
  matchesSection: {
    gap: Spacing.md,
  },
  matchesList: {
    gap: 0,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 20,
    left: Spacing.xl,
    right: Spacing.xl,
  },
  fabBtn: {
    backgroundColor: Colors.accent.green,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    shadowColor: Colors.accent.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.lg,
    color: Colors.accent.greenDark,
    letterSpacing: 0.8,
  },
});

// ---- Sheet styles ----
const sheetStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.bg.sheet,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border.strong,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: Spacing.lg,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.bg.elevated,
  },
  progressSegmentFilled: {
    backgroundColor: Colors.accent.green,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  stepTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['2xl'],
    color: Colors.text.primary,
    letterSpacing: 0.4,
    flex: 1,
  },
  stepIndicator: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 0.8,
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollPad: {
    paddingBottom: Spacing.xl,
  },
  stepContent: {
    gap: Spacing.md,
  },
  stepHint: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    letterSpacing: 0.3,
  },
  playerChips: {
    gap: Spacing.sm,
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  playerChipHome: {
    backgroundColor: Colors.accent.greenSubtle,
    borderColor: Colors.accent.greenBorder,
  },
  playerChipAway: {
    backgroundColor: Colors.accent.blueSubtle,
    borderColor: Colors.accent.blue + '44',
  },
  playerChipName: {
    flex: 1,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.muted,
  },
  homeLabel: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    backgroundColor: Colors.accent.greenSubtle,
  },
  homeLabelText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.accent.green,
    letterSpacing: 0.5,
  },
  awayLabel: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    backgroundColor: Colors.accent.blueSubtle,
  },
  awayLabelText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.accent.blue,
    letterSpacing: 0.5,
  },
  teamPicker: {
    flexGrow: 0,
  },
  teamPickItem: {
    alignItems: 'center',
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    gap: Spacing.xs,
    width: 72,
  },
  teamPickName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  scoreDivider: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  scoreDividerText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    color: Colors.text.ghost,
  },
  resultPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.xs,
  },
  resultLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  mediaScroll: {
    flexGrow: 0,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  addMediaBtn: {
    width: 90,
    height: 118,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border.strong,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  addMediaIcon: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize['2xl'],
    color: Colors.text.muted,
    lineHeight: 28,
  },
  addMediaText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    letterSpacing: 0.5,
  },
  ocrStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  ocrStatusText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.accent.blue,
  },
  ocrFoundText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.accent.green,
  },
  commentInput: {
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.lg,
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: Colors.text.primary,
    minHeight: 120,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  backActionBtn: {
    flex: 1,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  backActionText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: Colors.text.muted,
    letterSpacing: 0.5,
  },
  nextBtn: {
    flex: 2,
    backgroundColor: Colors.accent.green,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  nextBtnDisabled: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  nextBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: Colors.accent.greenDark,
    letterSpacing: 0.5,
  },
  nextBtnTextDisabled: {
    color: Colors.text.ghost,
  },
});

// ---- Dialog styles ----
const dialogStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  dialog: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border.medium,
    padding: Spacing['2xl'],
    width: '100%',
    gap: Spacing.md,
    alignItems: 'center',
  },
  dialogIcon: {
    fontSize: 36,
  },
  dialogTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['2xl'],
    color: Colors.text.primary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  dialogDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  cancelText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.muted,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: Colors.accent.green,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.base,
    color: Colors.accent.greenDark,
    letterSpacing: 0.3,
  },
  equalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: '100%',
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  equalName: {
    flex: 1,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  equalCount: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
});

// ---- Winner styles ----
const winnerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing['3xl'],
  },
  matchDayLabel: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.sm,
    color: Colors.accent.gold,
    letterSpacing: 2,
  },
  trophyEmoji: {
    fontSize: 64,
  },
  winnerName: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['4xl'],
    color: Colors.accent.green,
    letterSpacing: 1,
    textAlign: 'center',
  },
  winnerRecord: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.muted,
    letterSpacing: 0.5,
  },
  doneBtn: {
    backgroundColor: Colors.accent.green,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing['3xl'],
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
  },
  doneBtnText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.lg,
    color: Colors.accent.greenDark,
    letterSpacing: 0.8,
  },
});
