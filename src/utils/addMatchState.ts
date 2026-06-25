import type { MediaItem } from '@/store/types';

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
  ocrAssets: Array<{ base64: string; mimeType: string }>;
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
    ocrAssets: [],
  };
}

export function getAddMatchStepLabel(step: number, tournamentRanked: boolean, t: (key: string) => string): string {
  if (tournamentRanked) {
    return ([
      t('matchday.steps.whoIsPlaying'),
      t('matchday.steps.finalScore'),
      t('matchday.steps.addPhotos'),
      t('matchday.steps.commentary'),
    ] as string[])[step - 1] ?? '';
  }
  return ([
    t('matchday.steps.whoIsPlaying'),
    t('matchday.steps.pickTeams'),
    t('matchday.steps.finalScore'),
    t('matchday.steps.addPhotos'),
    t('matchday.steps.commentary'),
  ] as string[])[step - 1] ?? '';
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
