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
  // Refs for concurrency guards — updated synchronously, unlike state
  const uploadingMediaRef = useRef(false);
  const importingStatsRef = useRef(false);
  const [showClearStats, setShowClearStats] = useState(false);
  const [showSwapSides, setShowSwapSides] = useState(false);
  const [showStatsMenu, setShowStatsMenu] = useState(false);
  const [showUploadWarning, setShowUploadWarning] = useState(false);
  const [showOcrFailed, setShowOcrFailed] = useState(false);
  const [showOcrNoStats, setShowOcrNoStats] = useState(false);
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
    // Ref guard: synchronously blocks concurrent calls (state would be stale in closure)
    if (uploadingMediaRef.current || importingStatsRef.current) return;
    uploadingMediaRef.current = true;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'] as unknown as ImagePicker.MediaTypeOptions,
        allowsMultipleSelection: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const matchId = match.id;
        const type: 'image' | 'video' = asset.type === 'video' ? 'video' : 'image';
        // Show spinner only during the actual upload, not while picker is open
        setUploadingMedia(true);
        try {
          // Bug 10 fix: catch upload throw and treat it as null (same as upload-failed),
          // so the photo is always saved locally with pendingUpload when upload fails.
          let remoteUrl: string | null;
          try { remoteUrl = await uploadMediaItem(asset.uri, type); } catch { remoteUrl = null; }
          const newItem: MediaItem = remoteUrl !== null
            ? { uri: remoteUrl, type }
            : { uri: asset.uri, type, pendingUpload: true };
          // Bug 2 fix: read fresh media from store at write time, not from stale closure
          const freshMedia = useStore.getState().matches.find((m) => m.id === matchId)?.media
            ?? useStore.getState().archivedRounds.flatMap((r) => r.matches).find((m) => m.id === matchId)?.media
            ?? [];
          store.updateMatchMedia(matchId, [...freshMedia, newItem]);
        } finally {
          setUploadingMedia(false);
        }
      }
    } finally {
      uploadingMediaRef.current = false;
    }
  }, [match, store]);

  const handleImportStats = useCallback(async () => {
    if (!match) return;
    // Bug 6 fix: ref guard is synchronously updated — prevents concurrent invocations
    // even when state batching would give a stale importingStats value in the closure
    if (importingStatsRef.current || uploadingMediaRef.current) return;
    importingStatsRef.current = true;

    // Bug 11 fix: outer try/finally ensures the ref is ALWAYS released,
    // even if launchImageLibraryAsync itself throws (e.g. OS permission error).
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as unknown as ImagePicker.MediaTypeOptions,
        allowsMultipleSelection: true,
        selectionLimit: 4,
        quality: 0.85,
        base64: true,
      });
      if (result.canceled || !result.assets.length) return;

      // Bug 8 fix: spinner shown only after user confirms selection, not during picker display
      setImportingStats(true);
      const matchId = match.id;

      // Bug 1 fix: inner try/finally resets the spinner after upload/OCR completes.
      try {
        // Upload-first: try to upload all photos before running OCR.
        // If any upload fails (null return OR throw) we save locally and skip OCR.
        // Bug 9 fix: catch per-upload so a throw is treated as null (not a fatal error).
        const uploadResults = await Promise.all(
          result.assets.map(async (asset) => {
            try {
              const remoteUrl = await uploadMediaItem(asset.uri, 'image');
              return { asset, remoteUrl };
            } catch {
              return { asset, remoteUrl: null };
            }
          }),
        );

        const allUploaded = uploadResults.every((r) => r.remoteUrl !== null);

        // Bug 4 fix: read fresh match.media at write time to avoid clobbering
        // media added by sync while uploads were in-flight.
        const getMedia = () =>
          useStore.getState().matches.find((m) => m.id === matchId)?.media
          ?? useStore.getState().archivedRounds.flatMap((r) => r.matches).find((m) => m.id === matchId)?.media;

        if (!getMedia()?.length) {
          const mediaItems: MediaItem[] = uploadResults.map(({ asset, remoteUrl }) => ({
            uri: remoteUrl ?? asset.uri,
            type: 'image' as const,
            ...(remoteUrl === null ? { pendingUpload: true } : {}),
          }));
          store.updateMatchMedia(matchId, mediaItems);
        }

        // Run OCR regardless of upload status — base64 is already in memory from the picker.
        // If upload failed, photos are already saved locally; OCR should still extract stats.
        // Run OCR and auto-apply stats (no review modal)
        const map = new Map<string, ExtractedStat>();
        const rank = (c: ExtractedStat['confidence']) => (c === 'high' ? 3 : c === 'medium' ? 2 : 1);
        // Bug 7 fix: catch per-photo so a failure on photo N doesn't discard
        // stats already collected from photos 1..N-1. Track whether any photo
        // threw to distinguish "service error" from "genuinely no stats found".
        let anyPhotoOcrFailed = false;
        for (const { asset } of uploadResults) {
          if (!asset.base64) continue;
          try {
            const stats = await extractStatsFromPhoto(asset.base64, asset.mimeType ?? 'image/jpeg');
            for (const stat of stats) {
              const existing = map.get(stat.key);
              if (!existing || rank(stat.confidence) > rank(existing.confidence)) {
                map.set(stat.key, stat);
              }
            }
          } catch {
            anyPhotoOcrFailed = true;
          }
        }

        if (map.size > 0) {
          const override: Record<string, { a: number; b: number }> = {};
          map.forEach((stat) => { override[stat.key] = { a: stat.home, b: stat.away }; });
          store.updateMatchStats(matchId, override);
        } else if (anyPhotoOcrFailed) {
          setShowOcrFailed(true);
        } else {
          setShowOcrNoStats(true);
        }

        if (!allUploaded) {
          setShowUploadWarning(true);
        }
      } catch {
        setShowOcrFailed(true);
      } finally {
        setImportingStats(false);
      }
    } finally {
      importingStatsRef.current = false;
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
    showClearStats,
    showSwapSides,
    showStatsMenu,
    statsMenuPos,
    statsMenuBtnRef,
    viewingMediaIndex,
    showUploadWarning,
    showOcrFailed,
    showOcrNoStats,
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
    setShowUploadWarning,
    setShowOcrFailed,
    setShowOcrNoStats,
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
    handleDeleteMedia,
    openEditNote,
    handleSaveNote,
    adjustStat,
  };
}

export type MatchDetailHook = ReturnType<typeof useMatchDetail>;
