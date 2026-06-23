import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store';
import type { MediaItem } from '@/store/types';
import { Colors } from '@/theme/colors';
import { FontFamily, FontSize } from '@/theme/typography';
import { Radius, Spacing } from '@/theme/spacing';
import { NavHeader } from '@/components/NavHeader';
import { Avatar } from '@/components/Avatar';
import { SectionLabel } from '@/components/SectionLabel';
import { StatsRow } from '@/components/StatsRow';
import { generateMatchStats } from '@/utils/matchStats';
import { extractStatsFromPhoto, type ExtractedStat } from '@/utils/extractStats';
import { STAT_DEF_MAP, STAT_DEFINITIONS } from '@/utils/statDefinitions';
import { useTranslation } from 'react-i18next';
import { fetchMatchById } from '@/supabase/sync';
import { uploadMediaItem, deleteMediaItem } from '@/supabase/storage';
import type { Match } from '@/store/types';

export default function MatchDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const goBack = useGoBack();
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();

  const { matches, archivedRounds, closedTournaments, players, modal, syncStatus } = store;
  const isCurrentRoundMatch = matches.some((m) => m.id === id);
  const isEditableMatch =
    isCurrentRoundMatch ||
    (store.hasTournament && archivedRounds.flatMap((r) => r.matches).some((m) => m.id === id));
  const localMatch: Match | undefined =
    matches.find((m) => m.id === id) ??
    archivedRounds.flatMap((r) => r.matches).find((m) => m.id === id) ??
    closedTournaments
      .flatMap((t) => t.rounds.flatMap((r) => r.matches))
      .find((m) => m.id === id);

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

  if (!match) {
    const isLoading = syncStatus === 'syncing' || remoteLoading;
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.glow} pointerEvents="none" />
        <NavHeader title={t('matchDetail.title')} onBack={() => goBack()} />
        <View style={styles.center}>
          {isLoading
            ? <ActivityIndicator color={Colors.accent.green} size="large" />
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

  const hasStatsOverride = !!(match.statsOverride && Object.keys(match.statsOverride).length > 0);

  // When OCR stats exist: show exactly what was extracted (ordered by STAT_DEFINITIONS, unknowns appended)
  // When no OCR: show generated placeholder stats
  const mergedStats = (() => {
    if (hasStatsOverride && match.statsOverride) {
      const override = match.statsOverride;
      const ordered: { key: string; labelKey: string; label: string; aVal: number; bVal: number; isPercent: boolean }[] = [];
      // First: known stats in canonical order
      for (const def of STAT_DEFINITIONS) {
        if (override[def.key] !== undefined) {
          ordered.push({
            key: def.key,
            labelKey: def.labelKey,
            label: def.labelKey,
            aVal: override[def.key].a,
            bVal: override[def.key].b,
            isPercent: def.isPercent,
          });
        }
      }
      // Then: any unknown keys not in STAT_DEFINITIONS
      for (const key of Object.keys(override)) {
        if (!STAT_DEF_MAP[key]) {
          ordered.push({
            key,
            labelKey: '',
            label: key,
            aVal: override[key].a,
            bVal: override[key].b,
            isPercent: false,
          });
        }
      }
      return ordered;
    }
    return generateMatchStats(match.id, match.aScore, match.bScore).map((s) => ({
      ...s,
      labelKey: STAT_DEF_MAP[s.key]?.labelKey ?? '',
      label: s.label,
    }));
  })();

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
    router.replace('/matchday');
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
    } catch (e: any) {
      store.setModal('importStats');
      setImportedStats(null);
    } finally {
      setImportingStats(false);
    }
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
      <View style={styles.glow} pointerEvents="none" />

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
                  aWins && { color: Colors.accent.green },
                  (!aWins && !isDraw) && { color: '#7c8388' },
                ]}
              >
                {match.aScore}
              </Text>
              <Text style={styles.heroColon}>:</Text>
              <Text
                style={[
                  styles.heroScoreNum,
                  bWins && { color: Colors.accent.green },
                  (!bWins && !isDraw) && { color: '#7c8388' },
                ]}
              >
                {match.bScore}
              </Text>
            </View>
            <Text style={styles.heroResult}>
              {isDraw ? t('matchday.draw') : `${winnerName} won`}
            </Text>
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
                  <>
                    <TouchableOpacity
                      onPress={handleImportStats}
                      disabled={importingStats}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      {importingStats
                        ? <ActivityIndicator size="small" color={Colors.text.muted} />
                        : <Text style={styles.rescanLink}>Re-scan</Text>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openEditStats} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Text style={styles.editLink}>Edit</Text>
                    </TouchableOpacity>
                  </>
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
                    ? <ActivityIndicator size="small" color={Colors.accent.blue} />
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
                  ? <ActivityIndicator size="small" color={Colors.accent.green} />
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
            style={styles.mediaScroll}
            contentContainerStyle={styles.mediaContent}
          >
            {match.media!.map((item, idx) => (
              <View key={idx} style={styles.mediaThumbnail}>
                <TouchableOpacity
                  onPress={() => setViewingMediaIndex(idx)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
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
      <Modal
        visible={modal === 'editScore'}
        transparent
        animationType="slide"
        onRequestClose={() => store.setModal(null)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => store.setModal(null)} />
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
        </View>
      </Modal>

      {/* ── MEDIA VIEWER ── */}
      <Modal
        visible={viewingMediaIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingMediaIndex(null)}
        statusBarTranslucent
      >
        <Pressable
          style={styles.mediaViewerOverlay}
          onPress={() => setViewingMediaIndex(null)}
        >
          {viewingMediaIndex !== null && match.media?.[viewingMediaIndex] && (
            <Image
              source={{ uri: match.media[viewingMediaIndex].uri }}
              style={styles.mediaViewerImage}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>

      {/* ── EDIT STATS MODAL ── */}
      <Modal
        visible={modal === 'editStats'}
        transparent
        animationType="slide"
        onRequestClose={() => store.setModal(null)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => store.setModal(null)} />
          <View style={styles.sheet}>
            {/* Sheet header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>EDIT STATS</Text>
              <Text style={styles.sheetSubtitle}>Correct AI-read values</Text>
            </View>

            <ScrollView
              style={styles.sheetScroll}
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
            </ScrollView>

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
        </View>
      </Modal>

      {/* ── EDIT NOTE MODAL ── */}
      <Modal
        visible={editingNote}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingNote(false)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditingNote(false)} />
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
                placeholderTextColor={Colors.text.placeholder}
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
        </View>
      </Modal>

      {/* ── IMPORT STATS MODAL ── */}
      <Modal
        visible={modal === 'importStats'}
        transparent
        animationType="slide"
        onRequestClose={() => { store.setModal(null); setImportedStats(null); }}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { store.setModal(null); setImportedStats(null); }} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>IMPORT STATS</Text>
              <Text style={styles.sheetSubtitle}>
                {importedStats ? `${importedStats.length} stats found` : 'Scan failed'}
              </Text>
            </View>

            {importedStats && importedStats.length > 0 ? (
              <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
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
                        <View style={[styles.importConfStripe, { backgroundColor: isLow ? '#ffa032' : Colors.accent.yellow }]} />
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
              </ScrollView>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: Colors.text.muted,
  },

  // Header actions
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  editBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent.redSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnIcon: {
    fontSize: 14,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 40,
  },

  // Score hero card
  scoreHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1f14',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(61,220,132,0.2)',
    padding: Spacing.xl,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  heroSide: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  heroName: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.base,
    color: Colors.text.primary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  heroNameLoser: {
    color: Colors.text.muted,
  },
  heroCenter: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
  },
  heroScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroScoreNum: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['5xl'],
    color: Colors.text.secondary,
    lineHeight: FontSize['5xl'] + 8,
    minWidth: 36,
    textAlign: 'center',
  },
  heroColon: {
    fontFamily: FontFamily.displayBold,
    fontSize: 30,
    color: Colors.text.placeholder,
    lineHeight: 40,
  },
  heroResult: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.accent.green,
    textAlign: 'center',
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sourceBadgeBlue: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent.blueSubtle,
    borderWidth: 1,
    borderColor: 'rgba(106,166,255,0.25)',
  },
  sourceBadgeBlueText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.accent.blue,
  },
  sourceBadgeMuted: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  sourceBadgeMutedText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  editLink: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.accent.blue,
  },
  rescanLink: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },

  // Stats card
  statsCard: {
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.lg,
    gap: 2,
  },

  // Media
  mediaScroll: {
    flexGrow: 0,
  },
  mediaContent: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  mediaThumbnail: {
    width: 90,
    height: 118,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.bg.media,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  mediaImage: {
    width: 90,
    height: 118,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayIcon: {
    fontSize: 24,
    color: '#fff',
  },
  mediaEmpty: {
    height: 80,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaEmptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.placeholder,
  },

  // Commentary
  noteCard: {
    backgroundColor: 'rgba(106,166,255,0.08)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(106,166,255,0.2)',
    padding: Spacing.lg,
  },
  noteText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  noNoteRow: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  noNoteText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.placeholder,
  },

  // Edit stats sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bg.sheet,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.border.default,
    maxHeight: '85%',
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  sheetTitle: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    letterSpacing: 0.5,
  },
  sheetSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'right',
  },
  sheetScroll: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.md,
  },

  // Score edit sheet
  scoreEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing['2xl'],
  },
  scoreEditSide: {
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  scoreEditName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  scoreEditControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  scoreEditVal: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['4xl'],
    color: Colors.text.primary,
    minWidth: 48,
    textAlign: 'center',
  },
  scoreEditColon: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['3xl'],
    color: Colors.text.placeholder,
    paddingHorizontal: Spacing.sm,
  },

  // Media viewer
  mediaViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaViewerImage: {
    width: '100%',
    height: '100%',
  },

  // Edit stat rows
  editStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    gap: Spacing.sm,
  },
  editSideControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  stepBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  editStatVal: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    minWidth: 28,
    textAlign: 'center',
  },
  editStatLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: 'center',
    width: 70,
  },

  // Sheet buttons
  sheetButtons: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.secondary,
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.bg.base,
  },

  // Media section actions
  mediaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  importStatsBtn: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(106,166,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  importStatsBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.accent.blue,
  },

  // Import stats modal rows
  importStatRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  importStatRowLow: {
    backgroundColor: 'rgba(255,160,50,0.12)',
  },
  importStatRowMed: {
    backgroundColor: 'rgba(246,195,80,0.07)',
  },
  importConfStripe: {
    width: 3,
  },
  importStatContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  importErrorBody: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.xl,
  },
  importErrorText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Add media button
  addMediaBtn: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.accent.greenBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMediaBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.accent.green,
  },

  // Media delete button
  mediaDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaDeleteBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 14,
    color: '#fff',
    lineHeight: 16,
  },

  // Note edit
  noteEditBody: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  noteInput: {
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.strong,
    padding: Spacing.lg,
    fontFamily: FontFamily.body,
    fontSize: FontSize.base,
    color: Colors.text.primary,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  noteCharCount: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.text.placeholder,
    textAlign: 'right',
    marginTop: 4,
  },

  // Delete dialog
  delOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  delDialog: {
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border.strong,
    padding: Spacing['2xl'],
    width: '100%',
    alignItems: 'center',
    gap: Spacing.md,
  },
  delIconCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent.redSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  delIconEmoji: {
    fontSize: 22,
  },
  delTitle: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    color: Colors.text.primary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  delDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  delButtons: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.md,
    width: '100%',
  },
  delCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delCancelText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: Colors.text.secondary,
  },
  delConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delConfirmText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.base,
    color: '#fff',
  },
});
