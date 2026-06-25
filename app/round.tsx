import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '@/store';
import { calculateStandings, isTopTied } from '@/utils/standings';
import { Colors } from '@/theme/colors';
import { Spacing } from '@/theme/spacing';
import { Avatar, MatchCard, StandingCard, StandingsTable, ScoreCounter, SectionLabel, Sheet, EmptyState, MediaThumbnail, GlowBackground, SegmentedControl, TeamPickerRow, ConfettiPiece } from '@/components';
import { Match, MediaItem } from '@/store/types';
import { useTranslation } from 'react-i18next';
import { uploadMediaItems } from '@/supabase/storage';
import { extractStatsFromPhoto } from '@/utils/extractStats';
import {
  AddMatchState,
  initAddMatch,
  getAddMatchStepLabel,
  canAddMatchGoNext,
} from '@/utils/addMatchState';
import { styles, sheetStyles, dialogStyles, winnerStyles } from '@/screens/round/round.styles';

type StandingsView = 'table' | 'cards';

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
  const [isSavingMatch, setIsSavingMatch] = useState(false);
  const [localWinnerId, setLocalWinnerId] = useState<string | null>(null);

  const standings = useMemo(
    () => calculateStandings(matches, roundPlayers),
    [matches, roundPlayers],
  );

  const tournamentPlayerList = useMemo(
    () => players.filter((p) => roundPlayers.includes(p.id)),
    [players, roundPlayers],
  );

  // ---- Match validation ----
  const allPlayedEqual = useMemo(() => {
    if (standings.length === 0) return true;
    const counts = standings.map((s) => s.played);
    return counts.every((c) => c === counts[0]);
  }, [standings]);

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

  const handleNext = useCallback(() => {
    setAddMatch((prev) => ({ ...prev, step: Math.min(prev.step + 1, totalSteps) }));
  }, [totalSteps]);

  const handleBack = useCallback(() => {
    setAddMatch((prev) => {
      if (prev.ocrStatus === 'scanning') return prev;
      if (prev.step <= 1) {
        store.setModal(null);
        return initAddMatch();
      }
      return { ...prev, step: prev.step - 1 };
    });
  }, [store]);

  const handleSaveMatch = useCallback(async () => {
    if (!addMatch.homeId || !addMatch.awayId) return;
    setIsSavingMatch(true);
    try {
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
    } finally {
      setIsSavingMatch(false);
    }
  }, [addMatch, players, store]);

  const runOcr = useCallback(
    async (assets: Array<{ base64: string; mimeType: string }>, isRetry = false) => {
      setAddMatch((prev) => ({
        ...prev,
        ocrScanning: true,
        ocrStatus: 'scanning',
        ...(isRetry ? {} : { ocrAssets: assets }),
      }));
      try {
        const rank = (c: string) => (c === 'high' ? 3 : c === 'medium' ? 2 : 1);
        const map = new Map<string, { a: number; b: number; __conf: string }>();

        for (const asset of assets) {
          const stats = await extractStatsFromPhoto(asset.base64, asset.mimeType);
          for (const s of stats) {
            const existing = map.get(s.key);
            if (!existing || rank(s.confidence) > rank(existing.__conf)) {
              map.set(s.key, { a: s.home, b: s.away, __conf: s.confidence });
            }
          }
        }

        const pendingStats: Record<string, { a: number; b: number }> = {};
        map.forEach((v, k) => { pendingStats[k] = { a: v.a, b: v.b }; });

        setAddMatch((prev) => ({
          ...prev,
          ocrScanning: false,
          ocrStatus: 'done',
          pendingStats: Object.keys(pendingStats).length > 0 ? pendingStats : null,
        }));
      } catch {
        if (isRetry) {
          // Second failure — skip stats, unblock Next
          setAddMatch((prev) => ({
            ...prev,
            ocrScanning: false,
            ocrStatus: 'skipped',
            pendingStats: null,
          }));
        } else {
          setAddMatch((prev) => ({
            ...prev,
            ocrScanning: false,
            ocrStatus: 'error',
          }));
        }
      }
    },
    [],
  );

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

    const imageAssets = result.assets
      .filter((a) => a.type !== 'video' && a.base64)
      .map((a) => ({ base64: a.base64!, mimeType: a.mimeType ?? 'image/jpeg' }));

    setAddMatch((prev) => ({
      ...prev,
      media: [...prev.media, ...newItems].slice(0, 7),
      ocrStatus: imageAssets.length > 0 ? 'scanning' : 'idle',
    }));

    if (imageAssets.length > 0) {
      runOcr(imageAssets);
    }
  }, [runOcr]);

  const handleRetryOcr = useCallback(() => {
    setAddMatch((prev) => {
      if (prev.ocrAssets.length > 0) {
        runOcr(prev.ocrAssets, true);
      }
      return prev;
    });
  }, [runOcr]);

  const handleRemoveMedia = useCallback((idx: number) => {
    setAddMatch((prev) => {
      if (prev.ocrStatus === 'scanning') return prev;
      return { ...prev, media: prev.media.filter((_, i) => i !== idx) };
    });
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
        <TeamPickerRow
          teams={teams}
          selectedCode={addMatch.homeTeam}
          onSelect={(code) => setAddMatch((p) => ({ ...p, homeTeam: code }))}
        />

        <Text style={[sheetStyles.stepHint, { marginTop: Spacing.lg }]}>
          {t('matchday.pickTeam', { name: awayPl?.name ?? 'Away' })}
        </Text>
        <TeamPickerRow
          teams={teams}
          selectedCode={addMatch.awayTeam}
          onSelect={(code) => setAddMatch((p) => ({ ...p, awayTeam: code }))}
        />
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
              onRemove={addMatch.ocrStatus === 'scanning' ? undefined : () => handleRemoveMedia(idx)}
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
      {addMatch.ocrStatus === 'scanning' && (
        <View style={sheetStyles.ocrStatus}>
          <ActivityIndicator size="small" color={Colors.accent.blue} />
          <Text style={sheetStyles.ocrStatusText}>{t('matchday.ocr.reading')}</Text>
        </View>
      )}
      {addMatch.ocrStatus === 'done' && addMatch.pendingStats && (
        <View style={sheetStyles.ocrStatus}>
          <Text style={sheetStyles.ocrFoundText}>
            {t('matchday.ocr.detected', { count: Object.keys(addMatch.pendingStats).length })}
          </Text>
        </View>
      )}
      {addMatch.ocrStatus === 'error' && (
        <View style={sheetStyles.ocrError}>
          <Text style={sheetStyles.ocrErrorText}>{t('matchday.ocr.failed')}</Text>
          <TouchableOpacity
            style={sheetStyles.ocrRetryBtn}
            onPress={handleRetryOcr}
            activeOpacity={0.75}
          >
            <Text style={sheetStyles.ocrRetryText}>{t('matchday.ocr.retry')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setAddMatch((p) => ({ ...p, ocrStatus: 'skipped' }))}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={sheetStyles.ocrSkipText}>{t('matchday.ocr.skip')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {addMatch.ocrStatus === 'skipped' && (
        <View style={sheetStyles.ocrStatus}>
          <Text style={sheetStyles.ocrSkippedText}>{t('matchday.ocr.skipped')}</Text>
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
      <GlowBackground />

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
        <SegmentedControl
          value={standingsView}
          onChange={setStandingsView}
          options={[
            { value: 'table', label: t('matchday.table') },
            { value: 'cards', label: t('matchday.cards') },
          ]}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Standings */}
        {standingsView === 'table' ? (
          <StandingsTable
            style={{ marginBottom: Spacing.lg }}
            standings={standings}
            players={players}
            playerLabel={t('table.player')}
            compact
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
      <Sheet
        visible={modal === 'add'}
        onClose={() => { store.setModal(null); setAddMatch(initAddMatch()); }}
      >
          <View style={sheetStyles.sheet}>
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
                {getAddMatchStepLabel(addMatch.step, tournamentRanked, t)}
              </Text>
              <Text style={sheetStyles.stepIndicator}>
                {t('matchday.step', { current: addMatch.step, total: totalSteps })}
              </Text>
            </View>

            <BottomSheetScrollView
              style={sheetStyles.contentScroll}
              contentContainerStyle={sheetStyles.contentScrollPad}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderStepContent()}
            </BottomSheetScrollView>

            {/* Actions */}
            <View style={sheetStyles.actions}>
              <TouchableOpacity
                style={[
                  sheetStyles.backActionBtn,
                  addMatch.ocrStatus === 'scanning' && sheetStyles.nextBtnDisabled,
                ]}
                onPress={handleBack}
                disabled={addMatch.ocrStatus === 'scanning'}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    sheetStyles.backActionText,
                    addMatch.ocrStatus === 'scanning' && sheetStyles.nextBtnTextDisabled,
                  ]}
                >
                  {addMatch.step === 1 ? t('common.cancel') : t('common.back')}
                </Text>
              </TouchableOpacity>
              {addMatch.step < totalSteps ? (
                <TouchableOpacity
                  style={[
                    sheetStyles.nextBtn,
                    !canAddMatchGoNext(addMatch, tournamentRanked) && sheetStyles.nextBtnDisabled,
                  ]}
                  onPress={handleNext}
                  disabled={!canAddMatchGoNext(addMatch, tournamentRanked)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      sheetStyles.nextBtnText,
                      !canAddMatchGoNext(addMatch, tournamentRanked) && sheetStyles.nextBtnTextDisabled,
                    ]}
                  >
                    {t('common.next')}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[sheetStyles.nextBtn, isSavingMatch && sheetStyles.nextBtnDisabled]}
                  onPress={handleSaveMatch}
                  disabled={isSavingMatch}
                  activeOpacity={0.85}
                >
                  {isSavingMatch ? (
                    <ActivityIndicator size="small" color={Colors.accent.greenDark} />
                  ) : (
                    <Text style={sheetStyles.nextBtnText}>{t('matchday.saveMatch')}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
            <View style={{ height: Platform.OS === 'ios' ? 32 : 20 }} />
          </View>
      </Sheet>

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

