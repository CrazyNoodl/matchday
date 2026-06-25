import { useCallback, useState } from 'react';
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
  const [addMatch, setAddMatch] = useState<AddMatchState>(initAddMatch());
  const [isSavingMatch, setIsSavingMatch] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const totalSteps = tournamentRanked ? 4 : 5;

  const reset = useCallback(() => {
    setAddMatch(initAddMatch());
    setSaveError(false);
  }, []);

  const handleNext = useCallback(() => {
    setAddMatch((prev) => ({ ...prev, step: Math.min(prev.step + 1, totalSteps) }));
  }, [totalSteps]);

  const handleBack = useCallback(() => {
    setAddMatch((prev) => {
      if (prev.ocrStatus === 'scanning') return prev;
      if (prev.step <= 1) {
        closeModal();
        return initAddMatch();
      }
      return { ...prev, step: prev.step - 1 };
    });
  }, [closeModal]);

  const handleSaveMatch = useCallback(async () => {
    if (!addMatch.homeId || !addMatch.awayId) return;
    setIsSavingMatch(true);
    setSaveError(false);
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
      setSaveError(true);
    } finally {
      setIsSavingMatch(false);
    }
  }, [addMatch, players, addMatchToStore, closeModal, reset]);

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
    if (addMatch.ocrAssets.length > 0) {
      runOcr(addMatch.ocrAssets, true);
    }
  }, [addMatch.ocrAssets, runOcr]);

  const handleRemoveMedia = useCallback((idx: number) => {
    setAddMatch((prev) => {
      if (prev.ocrStatus === 'scanning') return prev;
      return { ...prev, media: prev.media.filter((_, i) => i !== idx) };
    });
  }, []);

  return {
    addMatch,
    setAddMatch,
    isSavingMatch,
    saveError,
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
