import { StateCreator } from 'zustand';
import { Player } from '../types';
import { collectAllMatches } from '../sliceHelpers';
import type { RootState } from '../index';

export interface PlayersState {
  players: Player[];
}

export interface PlayersActions {
  addPlayer: (player: Player) => void;
  updatePlayer: (player: Player) => void;
  deletePlayer: (id: string) => void;
}

export type PlayersSlice = PlayersState & PlayersActions;

export const createPlayersSlice: StateCreator<RootState, [], [], PlayersSlice> = (set, get) => ({
  players: [],

  addPlayer: (player) =>
    set((s) => ({ players: [...s.players, player] })),

  updatePlayer: (player) =>
    set((s) => ({
      players: s.players.map((p) => (p.id === player.id ? player : p)),
    })),

  deletePlayer: (id) => {
    const s = get();
    const allMatches = collectAllMatches(s);
    if (allMatches.some((m) => m.aId === id || m.bId === id)) return;
    if (s.closedTournaments.some((t) => t.players.includes(id))) return;
    set({ players: s.players.filter((p) => p.id !== id) });
  },
});
