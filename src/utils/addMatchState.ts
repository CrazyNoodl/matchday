import type { MediaItem } from '@/store/types';
import type { ExtractedStat } from '@/utils/extractStats';

export interface OcrPhotoEntry {
  // null when the picker gave no usable base64 for this image — permanently
  // unscannable, but still occupies its slot so this array's indices stay
  // aligned with media's image-type entries after later removals.
  asset: { base64: string; mimeType: string } | null;
  // null until a scan succeeds for this photo. Once set, never rescanned.
  stats: ExtractedStat[] | null;
}

export interface AddMatchState {
  step: number;
  homeId: string | null;
  awayId: string | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  media: MediaItem[];
  note: string;
  pendingStats: Record<string, { a: number; b: number }> | null;
  ocrScanning: boolean;
  ocrStatus: 'idle' | 'scanning' | 'done' | 'error' | 'skipped';
  ocrPhotos: OcrPhotoEntry[];
}

export function initAddMatch(): AddMatchState {
  return {
    step: 1,
    homeId: null,
    awayId: null,
    homeTeam: '',
    awayTeam: '',
    homeScore: 0,
    awayScore: 0,
    media: [],
    note: '',
    pendingStats: null,
    ocrScanning: false,
    ocrStatus: 'idle',
    ocrPhotos: [],
  };
}

export function getAddMatchStepLabel(
  step: number,
  tournamentRanked: boolean,
  t: (key: string) => string,
): string {
  if (tournamentRanked) {
    return (
      (
        [
          t('matchday.steps.whoIsPlaying').toUpperCase(),
          t('matchday.steps.finalScore').toUpperCase(),
          t('matchday.steps.addPhotos').toUpperCase(),
          t('matchday.steps.commentary').toUpperCase(),
        ] as string[]
      )[step - 1] ?? ''
    );
  }
  return (
    (
      [
        t('matchday.steps.whoIsPlaying').toUpperCase(),
        t('matchday.steps.pickTeams').toUpperCase(),
        t('matchday.steps.finalScore').toUpperCase(),
        t('matchday.steps.addPhotos').toUpperCase(),
        t('matchday.steps.commentary').toUpperCase(),
      ] as string[]
    )[step - 1] ?? ''
  );
}

export function isAddMatchDirty(state: AddMatchState): boolean {
  return (
    state.homeId !== null ||
    state.media.length > 0 ||
    state.homeScore > 0 ||
    state.awayScore > 0 ||
    state.note.trim() !== ''
  );
}

export function canAddMatchGoNext(state: AddMatchState, tournamentRanked: boolean): boolean {
  const { step } = state;
  const isMediaStep = tournamentRanked ? step === 3 : step === 4;
  if (isMediaStep && (state.ocrStatus === 'scanning' || state.ocrStatus === 'error')) {
    return false;
  }
  if (step === 1) return !!state.homeId && !!state.awayId;
  if (!tournamentRanked && step === 2) return !!state.homeTeam && !!state.awayTeam;
  return true;
}
