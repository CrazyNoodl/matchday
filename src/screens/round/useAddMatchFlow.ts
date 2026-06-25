import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Player, Match, MediaItem } from '@/store/types';
import { uploadMediaItems } from '@/supabase/storage';
import { extractStatsFromPhoto } from '@/utils/extractStats';
import {
  AddMatchState,
  initAddMatch,
} from '@/utils/addMatchState';

interface UseAddMatchFlowParams {
  tournamentRanked: boolean;
  players: Player[];
  addMatchToStore: (match: Match) => void;
  closeModal: () => void;
}

export function useAddMatchFlow({
  tournamentRanked,
  players,
  addMatchToStore,
  closeModal,
}: UseAddMatchFlowParams) {
  const { t } = useTranslation();
  const [addMatch, setAddMatch] = useState<AddMatchState>(initAddMatch());
  const [isSavingMatch, setIsSavingMatch] = useState(false);

  const totalSteps = tournamentRanked ? 4 : 5;

  const reset = useCallback(() => {
    setAddMatch(initAddMatch());
  }, []);

  const handleNext = useCallback(() => {
    setAddMatch((prev) => ({ ...prev, step: Math.min(prev.step + 1, totalSteps) }));
  }, [totalSteps]);

  const handleBack = useCallback(() => {
    if (addMatch.ocrStatus === 'scanning' || isSavingMatch) return;
    if (addMatch.step <= 1) {
      setAddMatch(initAddMatch());
      closeModal();
    } else {
      setAddMatch((prev) => ({ ...prev, step: prev.step - 1 }));
    }
  }, [addMatch.ocrStatus, addMatch.step, isSavingMatch, closeModal]);

  const handleSaveMatch = useCallback(async () => {
    if (!addMatch.homeId || !addMatch.awayId) return;
    if (isSavingMatch) return;
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
      addMatchToStore(match);
      closeModal();
      reset();
    } catch {
      Alert.alert(t('common.error'), t('matchday.saveMatchError'));
    } finally {
      setIsSavingMatch(false);
    }
  }, [addMatch, isSavingMatch, players, addMatchToStore, closeModal, reset, t]);

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
    const slotsLeft = 7 - addMatch.media.length;
    if (slotsLeft <= 0) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: slotsLeft,
      quality: 0.85,
      base64: true,
    });
    if (result.canceled) return;

    // Respect the 7-item cap — only keep assets that actually fit into media
    const fittingAssets = result.assets.slice(0, slotsLeft);

    const newItems: MediaItem[] = fittingAssets.map((a) => ({
      uri: a.uri,
      type: a.type === 'video' ? 'video' : 'image',
    }));

    const newImageAssets = fittingAssets
      .filter((a) => a.type !== 'video' && a.base64)
      .map((a) => ({ base64: a.base64!, mimeType: a.mimeType ?? 'image/jpeg' }));

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

  return {
    addMatch,
    setAddMatch,
    isSavingMatch,
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
