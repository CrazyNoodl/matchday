import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { useStore } from '@/store';
import type { MediaItem, Match } from '@/store/types';
import { extractStatsFromPhoto, type ExtractedStat } from '@/utils/extractStats';
import { fetchMatchById } from '@/supabase/sync';
import { uploadMediaItem, deleteMediaItem } from '@/supabase/storage';
import { buildMergedStats } from '@/utils/mergedStats';

export function useMatchDetail() {
  const router = useRouter();
  const goBack = useGoBack();
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();

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
  const hadLocalMatchRef = useRef(false);
  if (localMatch) hadLocalMatchRef.current = true;

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

  const [editValues, setEditValues] = useState<Record<string, { a: number; b: number }>>({});
  const [editAScore, setEditAScore] = useState(0);
  const [editBScore, setEditBScore] = useState(0);
  const [viewingMediaIndex, setViewingMediaIndex] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState(false);
  const [editNoteValue, setEditNoteValue] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [importingStats, setImportingStats] = useState(false);
  const [importedStats, setImportedStats] = useState<ExtractedStat[] | null>(null);
  const [showClearStats, setShowClearStats] = useState(false);
  const [showSwapSides, setShowSwapSides] = useState(false);
  const [showStatsMenu, setShowStatsMenu] = useState(false);
  const [statsMenuPos, setStatsMenuPos] = useState({ top: 0, right: 0 });
  const statsMenuBtnRef = useRef<import('react-native').View>(null);

  const hasStatsOverride = !!(match?.statsOverride && Object.keys(match.statsOverride).length > 0);

  const mergedStats = useMemo(
    () => (match ? buildMergedStats(match, hasStatsOverride) : []),
    [match, hasStatsOverride],
  );

  const playerA = players.find((p) => p.id === match?.aId);
  const playerB = players.find((p) => p.id === match?.bId);

  const aWins = (match?.aScore ?? 0) > (match?.bScore ?? 0);
  const bWins = (match?.bScore ?? 0) > (match?.aScore ?? 0);
  const isDraw = match ? match.aScore === match.bScore : false;

  const winnerName = aWins
    ? (playerA?.nick ?? playerA?.name ?? 'Player A')
    : bWins
    ? (playerB?.nick ?? playerB?.name ?? 'Player B')
    : null;

  const hasMediaFiles = !!(match?.media && match.media.length > 0);

  const openEditScore = useCallback(() => {
    if (!match) return;
    setEditAScore(match.aScore);
    setEditBScore(match.bScore);
    store.setModal('editScore');
  }, [match, store]);

  const openEditStats = useCallback(() => {
    const initial: Record<string, { a: number; b: number }> = {};
    mergedStats.forEach((s) => {
      initial[s.key] = { a: s.aVal, b: s.bVal };
    });
    setEditValues(initial);
    store.setModal('editStats');
  }, [mergedStats, store]);

  const handleSaveScore = useCallback(() => {
    if (!match) return;
    store.updateMatchScore(match.id, editAScore, editBScore);
    store.setModal(null);
  }, [match, store, editAScore, editBScore]);

  const handleSaveStats = useCallback(() => {
    if (!match) return;
    store.updateMatchStats(match.id, editValues);
    store.setModal(null);
  }, [match, store, editValues]);

  const handleDeleteMatch = useCallback(() => {
    if (!match) return;
    store.setModal(null);
    store.deleteMatch(match.id);
    router.replace('/round');
  }, [match, store, router]);

  const handleAddMedia = useCallback(async () => {
    if (!match) return;
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
  }, [match, store]);

  const handleImportStats = useCallback(async () => {
    if (!match) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as unknown as ImagePicker.MediaTypeOptions,
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
        const stats = await extractStatsFromPhoto(asset.base64, asset.mimeType ?? 'image/jpeg');
        allResults.push(stats);
      }
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

      if (noExistingMedia) {
        const matchId = match.id;
        Promise.all(
          result.assets.map(async (asset) => {
            const remoteUrl = await uploadMediaItem(asset.uri, 'image');
            return { uri: remoteUrl ?? asset.uri, type: 'image' as const };
          }),
        ).then((items) => {
          store.updateMatchMedia(matchId, items);
        }).catch((e) => {
          console.warn('[match] background stat-photo upload failed:', e);
        });
      }
    } catch {
      store.setModal('importStats');
      setImportedStats(null);
    } finally {
      setImportingStats(false);
    }
  }, [match, store]);

  const handleClearStats = useCallback(() => setShowClearStats(true), []);
  const handleSwapSides = useCallback(() => setShowSwapSides(true), []);

  const openStatsMenu = useCallback(() => {
    statsMenuBtnRef.current?.measureInWindow((x, y, _w, h) => {
      const screenWidth = Dimensions.get('window').width;
      setStatsMenuPos({ top: y + h + 6, right: screenWidth - x - _w });
      setShowStatsMenu(true);
    });
  }, []);

  const handleApplyImportedStats = useCallback(() => {
    if (!importedStats || !match) return;
    const override: Record<string, { a: number; b: number }> = {};
    for (const stat of importedStats) {
      override[stat.key] = { a: stat.home, b: stat.away };
    }
    store.updateMatchStats(match.id, override);
    store.setModal(null);
    setImportedStats(null);
  }, [importedStats, match, store]);

  const handleDeleteMedia = useCallback(async (idx: number) => {
    if (!match) return;
    const item = match.media?.[idx];
    if (item) await deleteMediaItem(item.uri);
    const updated = (match.media ?? []).filter((_, i) => i !== idx);
    store.updateMatchMedia(match.id, updated);
  }, [match, store]);

  const openEditNote = useCallback(() => {
    setEditNoteValue(match?.note ?? '');
    setEditingNote(true);
  }, [match]);

  const handleSaveNote = useCallback(() => {
    if (!match) return;
    store.updateMatchNote(match.id, editNoteValue.trim());
    setEditingNote(false);
  }, [match, store, editNoteValue]);

  const adjustStat = useCallback((key: string, side: 'a' | 'b', delta: number) => {
    setEditValues((prev) => {
      const current = prev[key] ?? { a: 0, b: 0 };
      return { ...prev, [key]: { ...current, [side]: Math.max(0, current[side] + delta) } };
    });
  }, []);

  return {
    id,
    match,
    playerA,
    playerB,
    isCurrentRoundMatch,
    isEditableMatch,
    aWins,
    bWins,
    isDraw,
    winnerName,
    hasMediaFiles,
    hasStatsOverride,
    mergedStats,
    modal,
    syncStatus,
    remoteLoading,
    editValues,
    editAScore,
    editBScore,
    editingNote,
    editNoteValue,
    uploadingMedia,
    importingStats,
    importedStats,
    showClearStats,
    showSwapSides,
    showStatsMenu,
    statsMenuPos,
    statsMenuBtnRef,
    viewingMediaIndex,
    goBack,
    store,
    setEditAScore,
    setEditBScore,
    setEditNoteValue,
    setEditingNote,
    setViewingMediaIndex,
    setShowStatsMenu,
    setShowClearStats,
    setShowSwapSides,
    openEditScore,
    openEditStats,
    openStatsMenu,
    handleSaveScore,
    handleSaveStats,
    handleDeleteMatch,
    handleAddMedia,
    handleImportStats,
    handleClearStats,
    handleSwapSides,
    handleApplyImportedStats,
    handleDeleteMedia,
    openEditNote,
    handleSaveNote,
    adjustStat,
  };
}

export type MatchDetailHook = ReturnType<typeof useMatchDetail>;
