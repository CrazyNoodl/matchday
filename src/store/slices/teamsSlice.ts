import { StateCreator } from 'zustand';
import { Team } from '../types';
import { collectAllMatches } from '../sliceHelpers';
import type { RootState } from '../index';

export interface TeamsState {
  teams: Team[];
}

export interface TeamsActions {
  addTeam: (team: Team) => void;
  updateTeam: (team: Team) => void;
  deleteTeam: (code: string) => void;
}

export type TeamsSlice = TeamsState & TeamsActions;

export const createTeamsSlice: StateCreator<RootState, [], [], TeamsSlice> = (set, get) => ({
  teams: [],

  addTeam: (team) =>
    set((s) => ({ teams: [...s.teams, team] })),

  updateTeam: (team) =>
    set((s) => ({
      teams: s.teams.map((t) => (t.code === team.code ? team : t)),
    })),

  deleteTeam: (code) => {
    const s = get();
    const allMatches = collectAllMatches(s);
    if (allMatches.some((m) => m.aTeam === code || m.bTeam === code)) return;
    set({ teams: s.teams.filter((t) => t.code !== code) });
  },
});
