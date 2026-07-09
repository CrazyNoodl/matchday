import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '@/store';
import { type Player, type Match, type MediaItem } from '@/store/types';
import { uploadMediaItems, buildMatchFolder } from '@/supabase/storage';
import { extractStatsFromPhoto } from '@/utils/extractStats';
import {
  resizeImage,
  OCR_PAYLOAD_MAX_DIMENSION,
  STAT_PHOTO_STORAGE_MAX_DIMENSION,
} from '@/utils/imageResize';
import { mergeStatArrays, toPendingStatsRecord } from '@/utils/ocrPhotoMerge';
import { type AddMatchState, type OcrPhotoEntry, initAddMatch, isAddMatchDirty } from '@/utils/addMatchState';
import { trackEvent } from '@/analytics';

interface UseAddMatchFlowParams {
  tournamentRanked: boolean;
  tournamentId: string;
  roundFolder: string;
  players: Player[];
  addMatchToStore: (match: Match) => void;
  closeModal: () => void;
}

export function useAddMatchFlow({
  tournamentRanked,
  tournamentId,
  roundFolder,
  players,
  addMatchToStore,
  closeModal,
}: UseAddMatchFlowParams) {
  const { t } = useTranslation();
  const demoMode = useStore((s) => s.demoMode);
  const [addMatch, setAddMatch] = useState<AddMatchState>(initAddMatch());
  const [isSavingMatch, setIsSavingMatch] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showSaveError, setShowSaveError] = useState(false);
  const ocrCancelledRef = useRef(false);

  const totalSteps = tournamentRanked ? 4 : 5;

  const reset = useCallback(() => {
    ocrCancelledRef.current = true;
    setAddMatch(initAddMatch());
  }, []);

  const handleNext = useCallback(() => {
    setAddMatch((prev) => ({ ...prev, step: Math.min(prev.step + 1, totalSteps) }));
  }, [totalSteps]);

  const handleBack = useCallback(() => {
    if (addMatch.ocrStatus === 'scanning' || isSavingMatch) return;
    if (addMatch.step <= 1) {
      if (isAddMatchDirty(addMatch)) {
        setShowDiscardDialog(true);
      } else {
        setAddMatch(initAddMatch());
        closeModal();
      }
    } else {
      setAddMatch((prev) => ({ ...prev, step: prev.step - 1 }));
    }
  }, [addMatch, isSavingMatch, closeModal, t]);

  const handleSaveMatch = useCallback(async () => {
    if (!addMatch.homeId || !addMatch.awayId) return;
    if (isSavingMatch) return;
    setIsSavingMatch(true);
    try {
      const homePlayer = players.find((p) => p.id === addMatch.homeId);
      const awayPlayer = players.find((p) => p.id === addMatch.awayId);
      const hTeam = addMatch.homeTeam || homePlayer?.teamCode || 'UNK';
      const aTeam = addMatch.awayTeam || awayPlayer?.teamCode || 'UNK';

      const matchId = `match-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      // Fixed once at creation and never renamed, even if the score is edited later (#67)
      const matchFolder = buildMatchFolder(addMatch.homeScore, addMatch.awayScore, new Date());
      const mediaFolder = roundFolder ? `${roundFolder}/${matchFolder}` : matchFolder;

      // Upload local media to Supabase Storage before saving. Demo Mode
      // matches are discarded on exit (realDataBackup restore) and must
      // never reach the user's real cloud storage — keep the media local-
      // only instead of uploading it under their real account.
      const uploadedMedia =
        addMatch.media.length === 0
          ? []
          : demoMode
            ? addMatch.media
            : await uploadMediaItems(addMatch.media, { tournamentId, mediaFolder });

      const match: Match = {
        id: matchId,
        aId: addMatch.homeId,
        bId: addMatch.awayId,
        aTeam: hTeam,
        bTeam: aTeam,
        aScore: addMatch.homeScore,
        bScore: addMatch.awayScore,
        media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
        note: addMatch.note.trim() || undefined,
        statsOverride: addMatch.pendingStats ?? undefined,
        mediaFolder: matchFolder,
      };
      addMatchToStore(match);
      trackEvent('match_added', {
        hasMedia: uploadedMedia.length > 0 ? 'true' : 'false',
        hasStats: match.statsOverride ? 'true' : 'false',
      });
      closeModal();
      reset();
    } catch {
      setShowSaveError(true);
    } finally {
      setIsSavingMatch(false);
    }
  }, [
    addMatch,
    isSavingMatch,
    players,
    addMatchToStore,
    closeModal,
    reset,
    t,
    tournamentId,
    roundFolder,
    demoMode,
  ]);

  // Only (re)scans photos that don't have stats yet — already-succeeded photos
  // are never re-sent to the AI provider (#71 twin bug). A photo that fails
  // mid-batch does not discard sibling photos that succeeded earlier in the
  // same call: `updated` accumulates in place, and both the success path and
  // the catch below derive `pendingStats` from whatever's in it at that point.
  const runOcr = useCallback(async (photos: OcrPhotoEntry[]) => {
    ocrCancelledRef.current = false;
    setAddMatch((prev) => ({
      ...prev,
      ocrScanning: true,
      ocrStatus: 'scanning',
      ocrPhotos: photos,
    }));

    const updated = [...photos];
    const toScan = photos
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.asset !== null && p.stats === null);

    const commit = (ocrStatus: 'done' | 'error') => {
      const merged = mergeStatArrays(updated.map((p) => p.stats ?? []));
      setAddMatch((prev) => ({
        ...prev,
        ocrScanning: false,
        ocrStatus,
        ocrPhotos: updated,
        pendingStats: toPendingStatsRecord(merged),
      }));
    };

    try {
      for (const { p, i } of toScan) {
        const stats = await extractStatsFromPhoto(p.asset!.base64, p.asset!.mimeType);
        if (ocrCancelledRef.current) return;
        updated[i] = { ...p, stats };
      }
      commit('done');
    } catch {
      if (ocrCancelledRef.current) return;
      // A sibling photo's failure must not wipe already-good stats from
      // photos that succeeded — unlike the old flat-scan model, we know
      // exactly which photo failed and leave everything else intact.
      commit('error');
    }
  }, []);

  const handlePickMedia = useCallback(async () => {
    if (addMatch.ocrStatus === 'scanning') return;
    const slotsLeft = 5 - addMatch.media.length;
    if (slotsLeft <= 0) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      // Video temporarily disabled — upload/playback broken, see #59
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: slotsLeft,
      quality: 0.85,
      base64: true,
    });
    if (result.canceled) return;

    // Respect the 5-item cap — only keep assets that actually fit into media
    const fittingAssets = result.assets.slice(0, slotsLeft);

    // These photos double as both stored match media and an OCR source — see #62.
    // The stored copy is compressed hard (nobody zooms into a stat screenshot in the
    // gallery); the OCR payload gets a lighter downscale so it stays legible.
    const resizedAssets = await Promise.all(
      fittingAssets.map(async (a) => {
        if (a.type === 'video') return { asset: a, storageUri: a.uri, ocrBase64: undefined };

        const [storageResult, ocrResult] = await Promise.all([
          resizeImage(a.uri, a, STAT_PHOTO_STORAGE_MAX_DIMENSION).catch(() => ({ uri: a.uri })),
          a.base64
            ? resizeImage(a.uri, a, OCR_PAYLOAD_MAX_DIMENSION, { base64: true }).catch(() => ({
                base64: a.base64,
              }))
            : Promise.resolve({ base64: undefined }),
        ]);

        return { asset: a, storageUri: storageResult.uri, ocrBase64: ocrResult.base64 ?? a.base64 };
      }),
    );

    const newItems: MediaItem[] = resizedAssets.map(({ asset, storageUri }) => ({
      uri: storageUri,
      type: asset.type === 'video' ? 'video' : 'image',
    }));

    // Every image gets a slot, even with no usable base64 (asset: null) — this
    // keeps ocrPhotos indices aligned with media's image-type entries so a
    // later removal targets the right photo (see handleRemoveMedia).
    const newOcrPhotos: OcrPhotoEntry[] = resizedAssets
      .filter(({ asset }) => asset.type !== 'video')
      .map(({ asset, ocrBase64 }) => ({
        asset: ocrBase64 ? { base64: ocrBase64, mimeType: asset.mimeType ?? 'image/jpeg' } : null,
        stats: null,
      }));

    const hasScannableNewPhotos = newOcrPhotos.some((p) => p.asset !== null);

    // If user already explicitly skipped stats, don't re-enter the OCR flow on
    // subsequent picks — they've made their decision; don't re-block Next on failure.
    const userSkippedOcr = addMatch.ocrStatus === 'skipped';

    const allOcrPhotos = [...addMatch.ocrPhotos, ...newOcrPhotos];

    setAddMatch((prev) => ({
      ...prev,
      media: [...prev.media, ...newItems],
      ocrPhotos: allOcrPhotos,
      ocrStatus: hasScannableNewPhotos && !userSkippedOcr ? 'scanning' : prev.ocrStatus,
    }));

    if (hasScannableNewPhotos && !userSkippedOcr) {
      runOcr(allOcrPhotos);
    }
  }, [addMatch.ocrPhotos, addMatch.ocrStatus, addMatch.media.length, runOcr]);

  // Only the photo(s) still missing stats get rescanned — already-succeeded
  // photos in ocrPhotos are skipped by runOcr, making this a free granular retry.
  const handleRetryOcr = useCallback(() => {
    if (addMatch.ocrPhotos.length > 0) {
      runOcr(addMatch.ocrPhotos);
    }
  }, [addMatch.ocrPhotos, runOcr]);

  const handleRemoveMedia = useCallback((idx: number) => {
    setAddMatch((prev) => {
      if (prev.ocrStatus === 'scanning') return prev;
      const removedIsImage = prev.media[idx]?.type === 'image';
      const nextMedia = prev.media.filter((_, i) => i !== idx);

      if (!removedIsImage || prev.ocrStatus === 'idle') {
        return { ...prev, media: nextMedia };
      }

      // media and ocrPhotos are appended to together in the same relative
      // order — the k-th image-type entry in media always corresponds to
      // ocrPhotos[k], regardless of interleaved videos.
      const imagePos = prev.media.slice(0, idx).filter((m) => m.type === 'image').length;
      const nextOcrPhotos = prev.ocrPhotos.filter((_, i) => i !== imagePos);

      if (nextOcrPhotos.length === 0) {
        return {
          ...prev,
          media: nextMedia,
          ocrPhotos: [],
          pendingStats: null,
          ocrStatus: 'idle' as const,
          ocrScanning: false,
        };
      }

      if (prev.ocrStatus === 'skipped') {
        // User explicitly opted out — don't silently repopulate pendingStats.
        return { ...prev, media: nextMedia, ocrPhotos: nextOcrPhotos };
      }

      const merged = mergeStatArrays(nextOcrPhotos.map((p) => p.stats ?? []));
      const stillHasUnscanned = nextOcrPhotos.some((p) => p.asset !== null && p.stats === null);
      return {
        ...prev,
        media: nextMedia,
        ocrPhotos: nextOcrPhotos,
        pendingStats: toPendingStatsRecord(merged),
        // Self-heals 'error' -> 'done' once the specific failing photo is gone.
        ocrStatus: stillHasUnscanned ? prev.ocrStatus : 'done',
      };
    });
  }, []);

  const handleConfirmDiscard = useCallback(() => {
    setShowDiscardDialog(false);
    setAddMatch(initAddMatch());
    closeModal();
  }, [closeModal]);

  return {
    addMatch,
    setAddMatch,
    isSavingMatch,
    showDiscardDialog,
    setShowDiscardDialog,
    showSaveError,
    setShowSaveError,
    handleConfirmDiscard,
    totalSteps,
    reset,
    handleNext,
    handleBack,
    handleSaveMatch,
    handlePickMedia,
    handleRetryOcr,
    handleRemoveMedia,
  };
}
