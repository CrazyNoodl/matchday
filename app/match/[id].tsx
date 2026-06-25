import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import type { MediaItem, Match } from '@/store/types';
import { useColors } from '@/theme';
import { NavHeader, Avatar, SectionLabel, StatsRow, GlowBackground, Sheet, MediaSlider } from '@/components';
import { extractStatsFromPhoto, type ExtractedStat } from '@/utils/extractStats';
import { useTranslation } from 'react-i18next';
import { fetchMatchById } from '@/supabase/sync';
import { uploadMediaItem, deleteMediaItem } from '@/supabase/storage';
import { buildMergedStats } from '@/utils/mergedStats';
import { makeStyles } from '@/screens/match/match.styles';

export default function MatchDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const goBack = useGoBack();
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const colors = useColors();
  const styles = makeStyles(colors);

  const { matches, archivedRounds, closedTournaments, players, modal, syncStatus } = store;
  const isCurrentRoundMatch = matches.some((m) => m.id === id);
  const isEditableMatch =
    isCurrentRoundMatch ||
    (store.hasTournament && archivedRounds.flatMap((r) => r.matches).some((m) => m.id === id));
  const localMatch = useMemo<Match | undefined>(
    () =>
      matches.find((m) => m.id === id) ??
      archivedRounds.flatMap((r) => r.matches).find((m) => m.id === id) ??
      closedTournaments
        .flatMap((t) => t.rounds.flatMap((r) => r.matches))
        .find((m) => m.id === id),
    [id, matches, archivedRounds, closedTournaments],
  );

  const [remoteMatch, setRemoteMatch] = useState<Match | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  // Track if local store ever had this match — if yes, going undefined means it was
  // deleted locally, so we must NOT re-fetch it from Supabase.
  const hadLocalMatchRef = React.useRef(false);
  if (localMatch) hadLocalMatchRef.current = true;

  // When local store doesn't have the match (direct link from another device),
  // try fetching it from Supabase once sync is done.
  useEffect(() => {
    if (hadLocalMatchRef.current || localMatch || syncStatus === 'syncing') return;
    setRemoteLoading(true);
    fetchMatchById(id)
      .then((m) => {
        setRemoteMatch(m);
        setRemoteLoading(false);
      })
      .catch(() => setRemoteLoading(false));
  }, [id, localMatch, syncStatus]);

  const match = localMatch ?? remoteMatch ?? undefined;

  // Local state for the edit stats modal values
  const [editValues, setEditValues] = useState<Record<string, { a: number; b: number }>>({});

  // Local state for the edit score modal
  const [editAScore, setEditAScore] = useState(0);
  const [editBScore, setEditBScore] = useState(0);

  // Local state for the media viewer
  const [viewingMediaIndex, setViewingMediaIndex] = useState<number | null>(null);

  // Local state for note editing
  const [editingNote, setEditingNote] = useState(false);
  const [editNoteValue, setEditNoteValue] = useState('');

  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [importingStats, setImportingStats] = useState(false);
  const [importedStats, setImportedStats] = useState<ExtractedStat[] | null>(null);
  const [showClearStats, setShowClearStats] = useState(false);
  const [showSwapSides, setShowSwapSides] = useState(false);
  const [showStatsMenu, setShowStatsMenu] = useState(false);
  const [statsMenuPos, setStatsMenuPos] = useState({ top: 0, right: 0 });
  const statsMenuBtnRef = useRef<View>(null);

  const hasStatsOverride = !!(match?.statsOverride && Object.keys(match.statsOverride).length > 0);

  const mergedStats = useMemo(
    () => (match ? buildMergedStats(match, hasStatsOverride) : []),
    [match, hasStatsOverride],
  );

  if (!match) {
    const isLoading = syncStatus === 'syncing' || remoteLoading;
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <GlowBackground />
        <NavHeader title={t('matchDetail.title')} onBack={() => goBack()} />
        <View style={styles.center}>
          {isLoading
            ? <ActivityIndicator color={colors.accent.green} size="large" />
            : <Text style={styles.emptyText}>{t('matchDetail.noData')}</Text>
          }
        </View>
      </SafeAreaView>
    );
  }

  const playerA = players.find((p) => p.id === match.aId);
  const playerB = players.find((p) => p.id === match.bId);

  const aWins = match.aScore > match.bScore;
  const bWins = match.bScore > match.aScore;
  const isDraw = match.aScore === match.bScore;

  const winnerName = aWins
    ? (playerA?.nick ?? playerA?.name ?? 'Player A')
    : bWins
    ? (playerB?.nick ?? playerB?.name ?? 'Player B')
    : null;

  const hasMediaFiles = match.media && match.media.length > 0;

  // Open edit score modal — pre-populate with current scores
  const openEditScore = () => {
    setEditAScore(match.aScore);
    setEditBScore(match.bScore);
    store.setModal('editScore');
  };

  // Open edit stats modal — pre-populate with current merged values
  const openEditStats = () => {
    const initial: Record<string, { a: number; b: number }> = {};
    mergedStats.forEach((s) => {
      initial[s.key] = { a: s.aVal, b: s.bVal };
    });
    setEditValues(initial);
    store.setModal('editStats');
  };

  const handleSaveScore = () => {
    store.updateMatchScore(match.id, editAScore, editBScore);
    store.setModal(null);
  };

  const handleSaveStats = () => {
    store.updateMatchStats(match.id, editValues);
    store.setModal(null);
  };

  const handleDeleteMatch = () => {
    store.setModal(null);
    store.deleteMatch(match.id);
    router.replace('/round');
  };

  const handleAddMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const type: 'image' | 'video' = asset.type === 'video' ? 'video' : 'image';
      setUploadingMedia(true);
      const remoteUrl = await uploadMediaItem(asset.uri, type);
      setUploadingMedia(false);
      const newItem: MediaItem = { uri: remoteUrl ?? asset.uri, type };
      store.updateMatchMedia(match.id, [...(match.media ?? []), newItem]);
    }
  };

  const handleImportStats = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsMultipleSelection: true,
      selectionLimit: 4,
      quality: 0.85,
      base64: true,
    });
    if (result.canceled || !result.assets.length) return;

    const noExistingMedia = !match.media?.length;

    setImportingStats(true);
    try {
      const allResults: ExtractedStat[][] = [];
      for (const asset of result.assets) {
        if (!asset.base64) continue;
        const stats = await extractStatsFromPhoto(
          asset.base64,
          asset.mimeType ?? 'image/jpeg',
        );
        allResults.push(stats);
      }
      // Merge: prefer higher confidence when same key appears in multiple photos
      const map = new Map<string, ExtractedStat>();
      const rank = (c: ExtractedStat['confidence']) => (c === 'high' ? 3 : c === 'medium' ? 2 : 1);
      for (const stats of allResults) {
        for (const stat of stats) {
          const existing = map.get(stat.key);
          if (!existing || rank(stat.confidence) > rank(existing.confidence)) {
            map.set(stat.key, stat);
          }
        }
      }
      setImportedStats(Array.from(map.values()));
      store.setModal('importStats');

      // If match had no media, save the stat photos there automatically
      if (noExistingMedia) {
        Promise.all(
          result.assets.map(async (asset) => {
            const remoteUrl = await uploadMediaItem(asset.uri, 'image');
            return { uri: remoteUrl ?? asset.uri, type: 'image' as const };
          }),
        ).then((items) => {
          store.updateMatchMedia(match.id, items);
        }).catch((e) => {
          console.warn('[match] background stat-photo upload failed:', e);
        });
      }
    } catch (e: any) {
      store.setModal('importStats');
      setImportedStats(null);
    } finally {
      setImportingStats(false);
    }
  };

  const handleClearStats = () => setShowClearStats(true);

  const handleSwapSides = () => setShowSwapSides(true);

  const openStatsMenu = () => {
    statsMenuBtnRef.current?.measureInWindow((x, y, _w, h) => {
      const screenWidth = Dimensions.get('window').width;
      setStatsMenuPos({ top: y + h + 6, right: screenWidth - x - _w });
      setShowStatsMenu(true);
    });
  };

  const handleApplyImportedStats = () => {
    if (!importedStats) return;
    const override: Record<string, { a: number; b: number }> = {};
    for (const stat of importedStats) {
      override[stat.key] = { a: stat.home, b: stat.away };
    }
    store.updateMatchStats(match.id, override);
    store.setModal(null);
    setImportedStats(null);
  };

  const handleDeleteMedia = async (idx: number) => {
    const item = match.media?.[idx];
    if (item) await deleteMediaItem(item.uri);
    const updated = (match.media ?? []).filter((_, i) => i !== idx);
    store.updateMatchMedia(match.id, updated);
  };

  const openEditNote = () => {
    setEditNoteValue(match.note ?? '');
    setEditingNote(true);
  };

  const handleSaveNote = () => {
    store.updateMatchNote(match.id, editNoteValue.trim());
    setEditingNote(false);
  };

  const adjustStat = (key: string, side: 'a' | 'b', delta: number) => {
    setEditValues((prev) => {
      const current = prev[key] ?? { a: 0, b: 0 };
      return {
        ...prev,
        [key]: {
          ...current,
          [side]: Math.max(0, current[side] + delta),
        },
      };
    });
  };

  const headerRight = isEditableMatch ? (
    <View style={styles.headerActions}>
      <TouchableOpacity
        style={styles.editBtn}
        onPress={openEditScore}
        activeOpacity={0.75}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.editBtnText}>Edit</Text>
      </TouchableOpacity>
      {isCurrentRoundMatch && (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => store.setModal('delMatch')}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.deleteBtnIcon}>🗑</Text>
        </TouchableOpacity>
      )}
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <GlowBackground />

      <NavHeader
        title={t('matchDetail.title')}
        onBack={() => goBack()}
        rightElement={headerRight}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── SCORELINE HERO ── */}
        <View style={styles.scoreHero}>
          {/* Side A */}
          <View style={styles.heroSide}>
            <Avatar playerId={match.aId} size="xl" />
            <Text
              style={[
                styles.heroName,
                (!aWins && !isDraw) && styles.heroNameLoser,
              ]}
              numberOfLines={1}
            >
              {playerA?.nick ?? playerA?.name ?? 'Unknown'}
            </Text>
          </View>

          {/* Center score */}
          <View style={styles.heroCenter}>
            <View style={styles.heroScoreRow}>
              <Text
                style={[
                  styles.heroScoreNum,
                  aWins && { color: colors.accent.green },
                  (!aWins && !isDraw) && { color: '#7c8388' },
                ]}
              >
                {match.aScore}
              </Text>
              <Text style={styles.heroColon}>:</Text>
              <Text
                style={[
                  styles.heroScoreNum,
                  bWins && { color: colors.accent.green },
                  (!bWins && !isDraw) && { color: '#7c8388' },
                ]}
              >
                {match.bScore}
              </Text>
            </View>
            <Text style={styles.heroResult}>
              {isDraw ? t('matchday.draw') : `${winnerName} won`}
            </Text>
            {isEditableMatch && (
              <TouchableOpacity
                onPress={handleSwapSides}
                hitSlop={{ top: 6, bottom: 6, left: 12, right: 12 }}
              >
                <Text style={styles.swapBtnText}>⇄ swap sides</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Side B */}
          <View style={styles.heroSide}>
            <Avatar playerId={match.bId} size="xl" />
            <Text
              style={[
                styles.heroName,
                (!bWins && !isDraw) && styles.heroNameLoser,
              ]}
              numberOfLines={1}
            >
              {playerB?.nick ?? playerB?.name ?? 'Unknown'}
            </Text>
          </View>
        </View>

        {/* ── MATCH STATS — shown only after OCR import or manual edit ── */}
        {hasStatsOverride && (
          <>
            <View style={styles.sectionHeader}>
              <SectionLabel label="MATCH STATS" />
              <View style={styles.sectionHeaderRight}>
                <View style={styles.sourceBadgeBlue}>
                  <Text style={styles.sourceBadgeBlueText}>AI-read</Text>
                </View>
                {isEditableMatch && (
                  <TouchableOpacity
                    ref={statsMenuBtnRef}
                    onPress={openStatsMenu}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.statsMenuDots}>···</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.statsCard}>
              {mergedStats.map((stat) => {
                const aLeads = stat.aVal >= stat.bVal;
                const label = stat.labelKey ? t(stat.labelKey) : stat.label;
                return (
                  <StatsRow
                    key={stat.key}
                    label={stat.isPercent ? `${label} %` : label}
                    aValue={stat.aVal}
                    bValue={stat.bVal}
                    aWins={aLeads}
                  />
                );
              })}
            </View>
          </>
        )}

        {/* ── MEDIA ── */}
        <View style={styles.sectionHeader}>
          <SectionLabel label="MEDIA" />
          {isEditableMatch && (
            <View style={styles.mediaActions}>
              {!hasStatsOverride && (
                <TouchableOpacity
                  style={styles.importStatsBtn}
                  onPress={handleImportStats}
                  activeOpacity={0.75}
                  disabled={importingStats}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  {importingStats
                    ? <ActivityIndicator size="small" color={colors.accent.blue} />
                    : <Text style={styles.importStatsBtnText}>📊 Import stats</Text>
                  }
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.addMediaBtn}
                onPress={handleAddMedia}
                activeOpacity={0.75}
                disabled={uploadingMedia}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                {uploadingMedia
                  ? <ActivityIndicator size="small" color={colors.accent.green} />
                  : <Text style={styles.addMediaBtnText}>+ Add</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        {hasMediaFiles ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mediaScroll}
          >
            {match.media!.map((item, idx) => (
              <View key={idx} style={styles.mediaThumbnail}>
                <TouchableOpacity onPress={() => setViewingMediaIndex(idx)} activeOpacity={0.85}>
                  <Image source={{ uri: item.uri }} style={styles.mediaImage} resizeMode="cover" />
                  {item.type === 'video' && (
                    <View style={styles.videoOverlay}>
                      <Text style={styles.videoPlayIcon}>▶</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {isEditableMatch && (
                  <TouchableOpacity
                    style={styles.mediaDeleteBtn}
                    onPress={() => handleDeleteMedia(idx)}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.mediaDeleteBtnText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <TouchableOpacity
            style={styles.mediaEmpty}
            onPress={isEditableMatch ? handleAddMedia : undefined}
            activeOpacity={isEditableMatch ? 0.7 : 1}
          >
            <Text style={styles.mediaEmptyText}>
              {isEditableMatch ? 'Tap to add media' : 'No media attached'}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── COMMENTARY ── */}
        <View style={styles.sectionHeader}>
          <SectionLabel label={t('matchDetail.commentary')} />
          {isEditableMatch && (
            <TouchableOpacity
              onPress={openEditNote}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {match.note ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>{match.note}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.noNoteRow}
            onPress={isEditableMatch ? openEditNote : undefined}
            activeOpacity={isEditableMatch ? 0.7 : 1}
          >
            <Text style={styles.noNoteText}>
              {isEditableMatch ? 'Add commentary...' : 'No commentary'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* ── EDIT SCORE MODAL ── */}
      <Sheet visible={modal === 'editScore'} onClose={() => store.setModal(null)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>EDIT SCORE</Text>
              <Text style={styles.sheetSubtitle}>Correct the result</Text>
            </View>

            <View style={styles.scoreEditRow}>
              {/* Side A */}
              <View style={styles.scoreEditSide}>
                <Text style={styles.scoreEditName} numberOfLines={1}>
                  {playerA?.nick ?? playerA?.name ?? 'Home'}
                </Text>
                <View style={styles.scoreEditControls}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setEditAScore((v) => Math.max(0, v - 1))}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.scoreEditVal}>{editAScore}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setEditAScore((v) => v + 1)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.scoreEditColon}>:</Text>

              {/* Side B */}
              <View style={styles.scoreEditSide}>
                <Text style={styles.scoreEditName} numberOfLines={1}>
                  {playerB?.nick ?? playerB?.name ?? 'Away'}
                </Text>
                <View style={styles.scoreEditControls}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setEditBScore((v) => Math.max(0, v - 1))}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.scoreEditVal}>{editBScore}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setEditBScore((v) => v + 1)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.sheetButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => store.setModal(null)}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelBtnText}>{t('matchday.dialogs.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveScore}
                activeOpacity={0.75}
              >
                <Text style={styles.saveBtnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
      </Sheet>

      {/* ── MEDIA VIEWER ── */}
      <Modal
        visible={viewingMediaIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingMediaIndex(null)}
        statusBarTranslucent
      >
        {viewingMediaIndex !== null && match.media && match.media.length > 0 && (
          <MediaSlider
            items={match.media}
            initialIndex={viewingMediaIndex}
            onClose={() => setViewingMediaIndex(null)}
          />
        )}
      </Modal>

      {/* ── EDIT STATS MODAL ── */}
      <Sheet visible={modal === 'editStats'} onClose={() => store.setModal(null)} snapToMax>
          <View style={styles.sheetFlex}>
            {/* Sheet header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>EDIT STATS</Text>
              <Text style={styles.sheetSubtitle}>Correct AI-read values</Text>
            </View>

            <BottomSheetScrollView
              style={styles.sheetScrollFlex}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {mergedStats.map((stat) => {
                const current = editValues[stat.key] ?? { a: stat.aVal, b: stat.bVal };
                const label = stat.labelKey ? t(stat.labelKey) : stat.label;
                return (
                  <View key={stat.key} style={styles.editStatRow}>
                    {/* Side A controls */}
                    <View style={styles.editSideControls}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => adjustStat(stat.key, 'a', -1)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.stepBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.editStatVal}>{current.a}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => adjustStat(stat.key, 'a', 1)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Label */}
                    <Text style={styles.editStatLabel}>{label}</Text>

                    {/* Side B controls */}
                    <View style={styles.editSideControls}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => adjustStat(stat.key, 'b', -1)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.stepBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.editStatVal}>{current.b}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => adjustStat(stat.key, 'b', 1)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
              <View style={{ height: 16 }} />
            </BottomSheetScrollView>

            {/* Sheet buttons */}
            <View style={styles.sheetButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => store.setModal(null)}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelBtnText}>{t('matchday.dialogs.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveStats}
                activeOpacity={0.75}
              >
                <Text style={styles.saveBtnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
      </Sheet>

      {/* ── EDIT NOTE MODAL ── */}
      <Sheet visible={editingNote} onClose={() => setEditingNote(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>COMMENTARY</Text>
              <Text style={styles.sheetSubtitle}>Add match notes</Text>
            </View>
            <View style={styles.noteEditBody}>
              <TextInput
                style={styles.noteInput}
                value={editNoteValue}
                onChangeText={setEditNoteValue}
                placeholder="Write something about this match..."
                placeholderTextColor={colors.text.placeholder}
                multiline
                autoFocus
                maxLength={500}
              />
              <Text style={styles.noteCharCount}>{editNoteValue.length}/500</Text>
            </View>
            <View style={styles.sheetButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditingNote(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelBtnText}>{t('matchday.dialogs.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveNote}
                activeOpacity={0.75}
              >
                <Text style={styles.saveBtnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
      </Sheet>

      {/* ── IMPORT STATS MODAL ── */}
      <Sheet
        visible={modal === 'importStats'}
        onClose={() => { store.setModal(null); setImportedStats(null); }}
        snapToMax
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>IMPORT STATS</Text>
          <Text style={styles.sheetSubtitle}>
            {importedStats ? `${importedStats.length} stats found` : 'Scan failed'}
          </Text>
        </View>

        {importedStats && importedStats.length > 0 ? (
          <BottomSheetScrollView style={styles.sheetScrollFlex} showsVerticalScrollIndicator={false}>
            {importedStats.map((stat, i) => {
              const aLeads = stat.home >= stat.away;
              const isLow = stat.confidence === 'low';
              const isMed = stat.confidence === 'medium';
              return (
                <View
                  key={`${stat.key}-${i}`}
                  style={[
                    styles.importStatRow,
                    isLow && styles.importStatRowLow,
                    isMed && styles.importStatRowMed,
                  ]}
                >
                  {(isLow || isMed) && (
                    <View style={[styles.importConfStripe, { backgroundColor: isLow ? '#ffa032' : colors.accent.yellow }]} />
                  )}
                  <View style={styles.importStatContent}>
                    <StatsRow
                      label={stat.label}
                      aValue={stat.home}
                      bValue={stat.away}
                      aWins={aLeads}
                    />
                  </View>
                </View>
              );
            })}
            <View style={{ height: 8 }} />
          </BottomSheetScrollView>
        ) : (
          <View style={styles.importErrorBody}>
            <Text style={styles.importErrorText}>
              Could not extract stats from the selected photo. Try a clearer screenshot.
            </Text>
          </View>
        )}

        <View style={styles.sheetButtons}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => { store.setModal(null); setImportedStats(null); }}
            activeOpacity={0.75}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          {importedStats && importedStats.length > 0 && (
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleApplyImportedStats}
              activeOpacity={0.75}
            >
              <Text style={styles.saveBtnText}>Apply</Text>
            </TouchableOpacity>
          )}
        </View>
      </Sheet>

      {/* ── STATS CONTEXT MENU ── */}
      <Modal
        visible={showStatsMenu}
        transparent
        animationType="none"
        onRequestClose={() => setShowStatsMenu(false)}
        statusBarTranslucent
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowStatsMenu(false)} />
        <View style={[styles.statsMenuDropdown, { top: statsMenuPos.top, right: statsMenuPos.right }]}>
          <TouchableOpacity
            style={styles.statsMenuItem}
            disabled={importingStats}
            onPress={() => { setShowStatsMenu(false); handleImportStats(); }}
          >
            {importingStats
              ? <ActivityIndicator size="small" color={colors.text.muted} />
              : <Text style={styles.statsMenuItemText}>Re-scan</Text>
            }
          </TouchableOpacity>
          <View style={styles.statsMenuSep} />
          <TouchableOpacity
            style={styles.statsMenuItem}
            onPress={() => { setShowStatsMenu(false); openEditStats(); }}
          >
            <Text style={styles.statsMenuItemText}>Edit</Text>
          </TouchableOpacity>
          <View style={styles.statsMenuSep} />
          <TouchableOpacity
            style={styles.statsMenuItem}
            onPress={() => { setShowStatsMenu(false); handleClearStats(); }}
          >
            <Text style={[styles.statsMenuItemText, { color: colors.accent.red }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── CLEAR STATS DIALOG ── */}
      <Modal
        visible={showClearStats}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearStats(false)}
        statusBarTranslucent
      >
        <View style={styles.dialogOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowClearStats(false)} />
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>CLEAR STATS</Text>
            <Text style={styles.dialogDesc}>Remove all match statistics?</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogCancel} onPress={() => setShowClearStats(false)} activeOpacity={0.75}>
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogConfirm}
                onPress={() => { store.updateMatchStats(match.id, undefined); setShowClearStats(false); }}
                activeOpacity={0.85}
              >
                <Text style={styles.dialogConfirmText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── SWAP SIDES DIALOG ── */}
      <Modal
        visible={showSwapSides}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSwapSides(false)}
        statusBarTranslucent
      >
        <View style={styles.dialogOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSwapSides(false)} />
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>SWAP SIDES</Text>
            <Text style={styles.dialogDesc}>Switch who played home and away? Stats will be mirrored.</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogCancel} onPress={() => setShowSwapSides(false)} activeOpacity={0.75}>
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogConfirm}
                onPress={() => { store.swapMatchSides(match.id); setShowSwapSides(false); }}
                activeOpacity={0.85}
              >
                <Text style={styles.dialogConfirmText}>Swap</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── DELETE MATCH MODAL ── */}
      <Modal
        visible={modal === 'delMatch'}
        transparent
        animationType="fade"
        onRequestClose={() => store.setModal(null)}
        statusBarTranslucent
      >
        <View style={styles.delOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => store.setModal(null)} />
          <View style={styles.delDialog}>
            <View style={styles.delIconCircle}>
              <Text style={styles.delIconEmoji}>🗑</Text>
            </View>
            <Text style={styles.delTitle}>{t('matchday.dialogs.deleteTitle')}</Text>
            <Text style={styles.delDesc}>
              {t('matchday.dialogs.deleteDesc')}
            </Text>
            <View style={styles.delButtons}>
              <TouchableOpacity
                style={styles.delCancelBtn}
                onPress={() => store.setModal(null)}
                activeOpacity={0.75}
              >
                <Text style={styles.delCancelText}>{t('matchday.dialogs.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.delConfirmBtn}
                onPress={handleDeleteMatch}
                activeOpacity={0.75}
              >
                <Text style={styles.delConfirmText}>{t('matchday.dialogs.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
