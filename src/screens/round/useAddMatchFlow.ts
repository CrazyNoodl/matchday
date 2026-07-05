import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Player, Match, MediaItem } from '@/store/types';
import { uploadMediaItems, buildMatchFolder } from '@/supabase/storage';
import { extractStatsFromPhoto, ExtractedStat } from '@/utils/extractStats';
import { resizeImage, OCR_PAYLOAD_MAX_DIMENSION, STAT_PHOTO_STORAGE_MAX_DIMENSION } from '@/utils/imageResize';
import {
  AddMatchState,
  initAddMatch,
  isAddMatchDirty,
} from '@/utils/addMatchState';

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

      // Upload local media to Supabase Storage before saving
      const uploadedMedia = addMatch.media.length > 0
        ? await uploadMediaItems(addMatch.media, { tournamentId, mediaFolder })
        : [];

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
      closeModal();
      reset();
    } catch {
      setShowSaveError(true);
    } finally {
      setIsSavingMatch(false);
    }
  }, [addMatch, isSavingMatch, players, addMatchToStore, closeModal, reset, t, tournamentId, roundFolder]);

  const runOcr = useCallback(
    async (assets: Array<{ base64: string; mimeType: string }>, isRetry = false) => {
      ocrCancelledRef.current = false;
      setAddMatch((prev) => ({
        ...prev,
        ocrScanning: true,
        ocrStatus: 'scanning',
        ...(isRetry ? {} : { ocrAssets: assets }),
      }));
      try {
        const rank = (c: ExtractedStat['confidence']) => (c === 'high' ? 3 : c === 'medium' ? 2 : 1);
        const map = new Map<string, { a: number; b: number; __conf: ExtractedStat['confidence'] }>();

        for (const asset of assets) {
          const stats = await extractStatsFromPhoto(asset.base64, asset.mimeType);
          if (ocrCancelledRef.current) return;
          for (const s of stats) {
            const existing = map.get(s.key);
            if (!existing || rank(s.confidence) > rank(existing.__conf)) {
              map.set(s.key, { a: s.home, b: s.away, __conf: s.confidence });
            }
          }
        }

        if (ocrCancelledRef.current) return;
        const pendingStats: Record<string, { a: number; b: number }> = {};
        map.forEach((v, k) => { pendingStats[k] = { a: v.a, b: v.b }; });

        setAddMatch((prev) => ({
          ...prev,
          ocrScanning: false,
          ocrStatus: 'done',
          pendingStats: Object.keys(pendingStats).length > 0 ? pendingStats : null,
        }));
      } catch {
        if (ocrCancelledRef.current) return;
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
            // Clear stale pendingStats — the combined run failed, old partial results
            // are no longer trustworthy and must not silently survive to save time.
            pendingStats: null,
          }));
        }
      }
    },
    [],
  );

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
            ? resizeImage(a.uri, a, OCR_PAYLOAD_MAX_DIMENSION, { base64: true }).catch(() => ({ base64: a.base64 }))
            : Promise.resolve({ base64: undefined }),
        ]);

        return { asset: a, storageUri: storageResult.uri, ocrBase64: ocrResult.base64 ?? a.base64 };
      }),
    );

    const newItems: MediaItem[] = resizedAssets.map(({ asset, storageUri }) => ({
      uri: storageUri,
      type: asset.type === 'video' ? 'video' : 'image',
    }));

    const newImageAssets = resizedAssets
      .filter(({ asset, ocrBase64 }) => asset.type !== 'video' && ocrBase64)
      .map(({ asset, ocrBase64 }) => ({ base64: ocrBase64!, mimeType: asset.mimeType ?? 'image/jpeg' }));

    // If user already explicitly skipped stats, don't re-enter the OCR flow on
    // subsequent picks — they've made their decision; don't re-block Next on failure.
    const userSkippedOcr = addMatch.ocrStatus === 'skipped';

    // Combine with previously scanned assets so second pick doesn't lose first OCR data
    const allImageAssets = [...addMatch.ocrAssets, ...newImageAssets];

    setAddMatch((prev) => ({
      ...prev,
      media: [...prev.media, ...newItems],
      ocrStatus: (newImageAssets.length > 0 && !userSkippedOcr) ? 'scanning' : prev.ocrStatus,
    }));

    if (newImageAssets.length > 0 && !userSkippedOcr) {
      runOcr(allImageAssets);
    }
  }, [addMatch.ocrAssets, addMatch.ocrStatus, addMatch.media.length, runOcr]);

  const handleRetryOcr = useCallback(() => {
    if (addMatch.ocrAssets.length > 0) {
      runOcr(addMatch.ocrAssets, true);
    }
  }, [addMatch.ocrAssets, runOcr]);

  const handleRemoveMedia = useCallback((idx: number) => {
    setAddMatch((prev) => {
      if (prev.ocrStatus === 'scanning') return prev;
      const removedIsImage = prev.media[idx]?.type === 'image';
      const ocrWasRun = prev.ocrStatus !== 'idle';
      return {
        ...prev,
        media: prev.media.filter((_, i) => i !== idx),
        // Only invalidate OCR data when an image is removed — videos don't affect stats
        ...(ocrWasRun && removedIsImage ? {
          pendingStats: null,
          ocrStatus: 'idle' as const,
          ocrAssets: [],
          ocrScanning: false,
        } : {}),
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
