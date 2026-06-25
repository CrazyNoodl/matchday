import { StateCreator } from 'zustand';
import { Modal, ArchivedRound, ClosedTournament } from '../types';
import type { RootState } from '../index';

export interface UiState {
  modal: Modal;
  selectedMatchId: string | null;
  viewingRound: ArchivedRound | null;
  viewingTournament: ClosedTournament | null;
  syncStatus: 'idle' | 'syncing' | 'error';
}

export interface UiActions {
  setModal: (modal: Modal) => void;
  setSelectedMatch: (id: string | null) => void;
  setViewingRound: (round: ArchivedRound | null) => void;
  setViewingTournament: (t: ClosedTournament | null) => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
}

export type UiSlice = UiState & UiActions;

export const createUiSlice: StateCreator<RootState, [], [], UiSlice> = (set) => ({
  modal: null,
  selectedMatchId: null,
  viewingRound: null,
  viewingTournament: null,
  syncStatus: 'idle',

  setModal: (modal) => set({ modal }),
  setSelectedMatch: (id) => set({ selectedMatchId: id }),
  setViewingRound: (round) => set({ viewingRound: round }),
  setViewingTournament: (t) => set({ viewingTournament: t }),
  setSyncStatus: (status) => set({ syncStatus: status }),
});
