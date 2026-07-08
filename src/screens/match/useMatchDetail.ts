import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGoBack } from '@/utils/useGoBack';
import { useDropdownMenu } from '@/hooks/useDropdownMenu';
import { useStore } from '@/store';
import { matchMediaFolder } from '@/store/sliceHelpers';
import type { MediaItem, MediaType, Match, StatConfidence } from '@/store/types';
import { extractStatsFromPhoto, type ExtractedStat } from '@/utils/extractStats';
import { resizeImage, MEDIA_MAX_DIMENSION, OCR_PAYLOAD_MAX_DIMENSION, STAT_PHOTO_STORAGE_MAX_DIMENSION } from '@/utils/imageResize';
import { fetchMatchById } from '@/supabase/sync';
import { uploadMediaItem, deleteMediaItem } from '@/supabase/storage';
import { buildMergedStats } from '@/utils/mergedStats';
import { STAT_DEF_MAP } from '@/utils/statDefinitions';

// A photo must recognize at least this many of the 23 canonical stat params
// to be treated as a genuine stats screenshot rather than the wrong photo.
const MIN_CANONICAL_STATS = 8;

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

  // Storage folder for a match's media — live matches use the currently open
  // round's folder, archived-round matches use their round's stored folder.
  // Delegates to matchMediaFolder so this stays identical to the path the
  // Add Match flow computes for the same match (see #67).
  const getMediaFolder = useCallback((m: Match): string => {
    const roundFolder = matches.some((mm) => mm.id === m.id)
      ? store.roundFolder
      : archivedRounds.find((r) => r.matches.some((mm) => mm.id === m.id))?.folder;
    return matchMediaFolder(roundFolder, m);
  }, [matches, archivedRounds, store.roundFolder]);

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
  // Keys the user actually changed in the current edit session — used at save time to
  // decide whether to keep the original OCR confidence and whether an untouched
  // never-set (isNA) row should stay excluded from statsOverride or now be included.
  const [touchedStats, setTouchedStats] = useState<Set<string>>(new Set());
  const [editAScore, setEditAScore] = useState(0);
  const [editBScore, setEditBScore] = useState(0);
  const [viewingMediaIndex, setViewingMediaIndex] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState(false);
  const [editNoteValue, setEditNoteValue] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [importingStats, setImportingStats] = useState(false);
  const [importStatsStep, setImportStatsStep] = useState<'preparing' | 'uploading' | 'scanning' | null>(null);
  // Refs for concurrency guards — updated synchronously, unlike state
  const uploadingMediaRef = useRef(false);
  const importingStatsRef = useRef(false);
  const [showClearStats, setShowClearStats] = useState(false);
  const [showSwapSides, setShowSwapSides] = useState(false);
  const statsMenu = useDropdownMenu();
  const [showOcrFailed, setShowOcrFailed] = useState(false);
  // At least one selected photo recognized fewer than MIN_CANONICAL_STATS params —
  // treated as the wrong screenshot / too low quality, distinct from a service error.
  // Supersedes the old "no stats found" case — 0 recognized stats always fails this
  // gate too, so that scenario is now covered here instead of a separate dialog.
  const [showInvalidStatsPhoto, setShowInvalidStatsPhoto] = useState(false);
  const [retryingMediaUri, setRetryingMediaUri] = useState<string | null>(null);

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

  // Video playback is broken (#59) — hide video items from display until fixed.
  // Still counted toward the 5-slot cap since they remain in the underlying data.
  const visibleMedia = useMemo(
    () =>
      (match?.media ?? [])
        .map((item, originalIndex) => ({ item, originalIndex }))
        .filter(({ item }) => item.type !== 'video'),
    [match?.media],
  );
  const hasMediaFiles = visibleMedia.length > 0;
  const isMediaFull = (match?.media?.length ?? 0) >= 5;

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
    setTouchedStats(new Set());
    store.setModal('editStats');
  }, [mergedStats, store]);

  const handleSaveScore = useCallback(() => {
    if (!match) return;
    store.updateMatchScore(match.id, editAScore, editBScore);
    store.setModal(null);
  }, [match, store, editAScore, editBScore]);

  const handleSaveStats = useCallback(() => {
    if (!match) return;
    const override: Record<string, { a: number; b: number; confidence?: StatConfidence }> = {};
    Object.entries(editValues).forEach(([key, v]) => {
      const original = match.statsOverride?.[key];
      // Rows that were never set AND weren't touched this session stay excluded
      // from statsOverride — they keep showing as a muted placeholder, not a
      // "real" 0, until the user actually interacts with them.
      if (original === undefined && !touchedStats.has(key)) return;
      override[key] = {
        a: v.a,
        b: v.b,
        // A manual edit means the value is now user-confirmed — drop the AI
        // confidence flag so it stops showing the low-confidence dot.
        confidence: touchedStats.has(key) ? undefined : original?.confidence,
      };
    });
    store.updateMatchStats(match.id, override);
    store.setModal(null);
  }, [match, store, editValues, touchedStats]);

  const handleDeleteMatch = useCallback(() => {
    if (!match) return;
    store.setModal(null);
    store.deleteMatch(match.id);
    router.replace('/round');
  }, [match, store, router]);

  const handleAddMedia = useCallback(async () => {
    if (!match) return;
    if (uploadingMediaRef.current || importingStatsRef.current) return;

    const slotsLeft = 5 - (match.media?.length ?? 0);
    if (slotsLeft <= 0) return;

    uploadingMediaRef.current = true;
    // Covers the entire native picker call, including the OS fetching a
    // not-yet-downloaded iCloud original before it hands the asset back to us —
    // that wait happens inside this single await with no progress events of its own.
    setUploadingMedia(true);

    const getMedia = (matchId: string) =>
      useStore.getState().matches.find((m) => m.id === matchId)?.media
      ?? useStore.getState().archivedRounds.flatMap((r) => r.matches).find((m) => m.id === matchId)?.media
      ?? [];

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        // Video temporarily disabled — upload/playback broken, see #59
        mediaTypes: ['images'] as unknown as ImagePicker.MediaTypeOptions,
        allowsMultipleSelection: true,
        selectionLimit: slotsLeft,
        quality: 0.8,
      });

      if (result.canceled || !result.assets.length) return;

      const matchId = match.id;
      const mediaFolder = getMediaFolder(match);

      // Optimistic: items appear immediately in the UI with a spinner overlay
      const optimisticItems: MediaItem[] = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
        uploading: true,
      }));
      store.updateMatchMedia(matchId, [...getMedia(matchId), ...optimisticItems]);

      // Picker is closed and items are visible — release ref/state so other actions can proceed
      uploadingMediaRef.current = false;
      setUploadingMedia(false);

      // Upload each item in background; navigation away does not interrupt this
      await Promise.all(
        result.assets.map(async (asset) => {
          const type: MediaType = asset.type === 'video' ? 'video' : 'image';
          const originalUri = asset.uri;
          // Downscale before upload — see #62. Optimistic item above already
          // displays originalUri, so failures below fall back to the resized
          // file (not the full-res original) to avoid re-resizing on retry.
          let localUri = originalUri;
          if (type === 'image') {
            try {
              localUri = (await resizeImage(originalUri, asset, MEDIA_MAX_DIMENSION)).uri;
            } catch { /* fall back to the original file if resizing fails */ }
          }

          let remoteUrl: string | null;
          try { remoteUrl = await uploadMediaItem(localUri, type, { tournamentId: store.tournamentId, mediaFolder }); } catch { remoteUrl = null; }

          // Replace the optimistic item matched by the original local URI + uploading flag
          store.updateMatchMedia(
            matchId,
            getMedia(matchId).map((item) => {
              if (item.uri === originalUri && item.uploading) {
                return remoteUrl !== null
                  ? { uri: remoteUrl, type }
                  : { uri: localUri, type, pendingUpload: true };
              }
              return item;
            }),
          );
        }),
      );
    } finally {
      uploadingMediaRef.current = false;
      setUploadingMedia(false);
    }
  }, [match, store, getMediaFolder]);

  const handleImportStats = useCallback(async () => {
    if (!match) return;
    // Bug 6 fix: ref guard is synchronously updated — prevents concurrent invocations
    // even when state batching would give a stale importingStats value in the closure
    if (importingStatsRef.current || uploadingMediaRef.current) return;
    importingStatsRef.current = true;
    // Covers the native picker call end-to-end, including the OS fetching a
    // not-yet-downloaded iCloud original before it hands the asset back to us —
    // that wait happens inside this single await with no progress events of its own.
    setImportingStats(true);
    setImportStatsStep('preparing');

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
      if (result.canceled || !result.assets.length) {
        setImportingStats(false);
        setImportStatsStep(null);
        return;
      }

      const matchId = match.id;
      const mediaFolder = getMediaFolder(match);

      // Bug 1 fix: inner try/finally resets the spinner after upload/OCR completes.
      try {
        // OCR runs first — it only needs the base64 already captured by the picker,
        // independent of upload — so we know per-photo validity before deciding
        // how (or whether) each photo gets saved to media.
        setImportStatsStep('scanning');
        // Bug 7 fix: catch per-photo so a failure on photo N doesn't discard
        // stats already collected from photos 1..N-1. Track whether any photo
        // threw to distinguish "service error" from "genuinely no stats found".
        const ocrResults = await Promise.all(
          result.assets.map(async (asset) => {
            if (!asset.base64) return { asset, stats: [] as ExtractedStat[], ocrFailed: false };
            // Light downscale before sending to the AI provider — see #62. Stays legible
            // for OCR while cutting payload size/latency; falls back to the picker's own
            // base64 (already within the cap, or resize failed) so a resize hiccup never
            // blocks OCR outright.
            let base64 = asset.base64;
            try {
              const payload = await resizeImage(asset.uri, asset, OCR_PAYLOAD_MAX_DIMENSION, { base64: true });
              if (payload.base64) base64 = payload.base64;
            } catch { /* keep original base64 */ }
            try {
              const stats = await extractStatsFromPhoto(base64, asset.mimeType ?? 'image/jpeg');
              return { asset, stats, ocrFailed: false };
            } catch {
              return { asset, stats: [] as ExtractedStat[], ocrFailed: true };
            }
          }),
        );

        // A photo "counts" only if it recognized enough of the 23 canonical
        // params — otherwise it's the wrong screenshot / too low quality, not
        // just an OCR service hiccup (that case is handled by ocrFailed below).
        const classified = ocrResults.map((r) => {
          const canonicalCount = new Set(
            r.stats.filter((s) => STAT_DEF_MAP[s.key]).map((s) => s.key),
          ).size;
          return { ...r, isValidPhoto: !r.ocrFailed && canonicalCount >= MIN_CANONICAL_STATS };
        });
        const anyInvalidPhoto = classified.some((r) => !r.ocrFailed && !r.isValidPhoto);
        const anyPhotoOcrFailed = classified.some((r) => r.ocrFailed);

        // Now upload every photo, valid or not — invalid ones are kept in storage
        // (not deleted) but filename-tagged so they can be identified and cleaned
        // up later — see #63.
        // Bug 9 fix: catch per-upload so a throw is treated as null (not a fatal error).
        setImportStatsStep('uploading');
        const uploadResults = await Promise.all(
          classified.map(async (r) => {
            // Aggressive downscale for the persisted copy — see #62. Nobody zooms into
            // a stat screenshot in the match gallery, so this can be much smaller than
            // the payload used for OCR above.
            let storageUri = r.asset.uri;
            try {
              storageUri = (await resizeImage(r.asset.uri, r.asset, STAT_PHOTO_STORAGE_MAX_DIMENSION)).uri;
            } catch { /* fall back to the original file if resizing fails */ }
            try {
              const remoteUrl = await uploadMediaItem(storageUri, 'image', {
                tournamentId: store.tournamentId,
                mediaFolder,
                ...(r.isValidPhoto || r.ocrFailed ? {} : { filenamePrefix: 'rejected-' }),
              });
              return { ...r, remoteUrl, localUri: storageUri };
            } catch {
              return { ...r, remoteUrl: null, localUri: storageUri };
            }
          }),
        );

        // Bug 4 fix: read fresh match.media at write time to avoid clobbering
        // media added by sync while uploads were in-flight.
        const getMedia = () =>
          useStore.getState().matches.find((m) => m.id === matchId)?.media
          ?? useStore.getState().archivedRounds.flatMap((r) => r.matches).find((m) => m.id === matchId)?.media;

        // Invalid photos never join match.media — only ones that either passed
        // validation or hit a genuine service error (not proven bad) do.
        const mediaCandidates = uploadResults.filter((r) => r.isValidPhoto || r.ocrFailed);
        if (!getMedia()?.length && mediaCandidates.length > 0) {
          const mediaItems: MediaItem[] = mediaCandidates.map(({ localUri, remoteUrl }) => ({
            uri: remoteUrl ?? localUri,
            type: 'image' as const,
            ...(remoteUrl === null ? { pendingUpload: true } : {}),
          }));
          store.updateMatchMedia(matchId, mediaItems);
        }

        // Merge stats only from photos that passed validation — a rejected
        // photo's guesses never touch the match's stats, even partially.
        const map = new Map<string, ExtractedStat>();
        const rank = (c: ExtractedStat['confidence']) => (c === 'high' ? 3 : c === 'medium' ? 2 : 1);
        for (const r of uploadResults) {
          if (!r.isValidPhoto) continue;
          for (const stat of r.stats) {
            const existing = map.get(stat.key);
            if (!existing || rank(stat.confidence) > rank(existing.confidence)) {
              map.set(stat.key, stat);
            }
          }
        }

        if (map.size > 0) {
          const override: Record<string, { a: number; b: number; confidence?: ExtractedStat['confidence'] }> = {};
          map.forEach((stat) => { override[stat.key] = { a: stat.home, b: stat.away, confidence: stat.confidence }; });
          store.updateMatchStats(matchId, override);
        }

        // Re-scan with a rejected photo and nothing else new: existing stats
        // are left completely untouched (updateMatchStats above never ran).
        // Note: a photo with 0 recognized stats always fails MIN_CANONICAL_STATS
        // too, so that case is already covered by anyInvalidPhoto above.
        if (anyInvalidPhoto) {
          setShowInvalidStatsPhoto(true);
        } else if (map.size === 0 && anyPhotoOcrFailed) {
          setShowOcrFailed(true);
        }

      } catch {
        setShowOcrFailed(true);
      } finally {
        setImportingStats(false);
        setImportStatsStep(null);
      }
    } finally {
      importingStatsRef.current = false;
      // Safety net for paths that exit before the inner finally runs
      // (e.g. launchImageLibraryAsync itself throwing) — never leave the spinner stuck.
      setImportingStats(false);
      setImportStatsStep(null);
    }
  }, [match, store, getMediaFolder]);

  const handleRetryUpload = useCallback(async (itemUri: string) => {
    if (!match || retryingMediaUri !== null) return;
    const item = match.media?.find((m) => m.uri === itemUri);
    if (!item?.pendingUpload) return;

    setRetryingMediaUri(itemUri);
    const matchId = match.id;
    const mediaFolder = getMediaFolder(match);

    const getFreshMedia = () =>
      useStore.getState().matches.find((m) => m.id === matchId)?.media
      ?? useStore.getState().archivedRounds.flatMap((r) => r.matches).find((m) => m.id === matchId)?.media
      ?? [];

    try {
      let remoteUrl: string | null;
      try { remoteUrl = await uploadMediaItem(itemUri, item.type, { tournamentId: store.tournamentId, mediaFolder }); } catch { remoteUrl = null; }

      const freshMedia = getFreshMedia();
      if (remoteUrl !== null) {
        store.updateMatchMedia(matchId, freshMedia.map((m) =>
          m.uri === itemUri ? { uri: remoteUrl!, type: item.type } : m,
        ));
      }
      // On failure: keep item with pendingUpload:true so user can retry again
    } finally {
      setRetryingMediaUri(null);
    }
  }, [match, store, retryingMediaUri, getMediaFolder]);

  const handleClearStats = useCallback(() => setShowClearStats(true), []);
  const handleSwapSides = useCallback(() => setShowSwapSides(true), []);

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

  // Only for non-canonical (OCR extra) rows — canonical params can be edited
  // but never removed from the fixed 23-param list (#72). Removing here just
  // drops the key from the in-progress edit session; it's excluded from
  // statsOverride once handleSaveStats writes editValues back to the store.
  const deleteStat = useCallback((key: string) => {
    setEditValues((prev) => {
      const { [key]: _omit, ...rest } = prev;
      return rest;
    });
    setTouchedStats((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const adjustStat = useCallback((key: string, side: 'a' | 'b', delta: number, isPercent: boolean) => {
    setTouchedStats((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
    setEditValues((prev) => {
      const current = prev[key] ?? { a: 0, b: 0 };
      let next = current[side] + delta;
      next = Math.max(0, next);
      if (isPercent) next = Math.min(100, next);
      // Round to 1 decimal — covers both integer stats and the 0.1 xG step
      // without floating point artifacts (e.g. 2 + 0.1 !== 2.1 in raw JS).
      next = Math.round(next * 10) / 10;
      return { ...prev, [key]: { ...current, [side]: next } };
    });
  }, []);

  // Confirms an AI-flagged value as correct without nudging it via +/- (#74).
  const confirmStat = useCallback((key: string) => {
    setTouchedStats((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
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
    isMediaFull,
    visibleMedia,
    hasStatsOverride,
    mergedStats,
    modal,
    syncStatus,
    remoteLoading,
    editValues,
    touchedStats,
    editAScore,
    editBScore,
    editingNote,
    editNoteValue,
    uploadingMedia,
    importingStats,
    importStatsStep,
    showClearStats,
    showSwapSides,
    statsMenu,
    viewingMediaIndex,
    showOcrFailed,
    showInvalidStatsPhoto,
    retryingMediaUri,
    goBack,
    store,
    setEditAScore,
    setEditBScore,
    setEditNoteValue,
    setEditingNote,
    setViewingMediaIndex,
    setShowClearStats,
    setShowSwapSides,
    setShowOcrFailed,
    setShowInvalidStatsPhoto,
    openEditScore,
    openEditStats,
    handleSaveScore,
    handleSaveStats,
    handleDeleteMatch,
    handleAddMedia,
    handleImportStats,
    handleRetryUpload,
    handleClearStats,
    handleSwapSides,
    handleDeleteMedia,
    openEditNote,
    handleSaveNote,
    adjustStat,
    confirmStat,
    deleteStat,
  };
}

export type MatchDetailHook = ReturnType<typeof useMatchDetail>;
