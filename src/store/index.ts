import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import { Player, Team, Match, ArchivedRound, ClosedTournament } from './types';
import { deleteMediaItem } from '../supabase/storage';
import {
  createTournamentSlice,
  TournamentSlice,
} from './slices/tournamentSlice';
import { createPlayersSlice, PlayersSlice } from './slices/playersSlice';
import { createTeamsSlice, TeamsSlice } from './slices/teamsSlice';
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice';
import { createUiSlice, UiSlice } from './slices/uiSlice';

// ---------------------------------------------------------------------------
// Storage adapter — MMKV on native, localStorage on web
// ---------------------------------------------------------------------------
const buildStorage = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (name: string): string | null => {
        try { return localStorage.getItem(name); } catch { return null; }
      },
      setItem: (name: string, value: string): void => {
        try { localStorage.setItem(name, value); } catch {}
      },
      removeItem: (name: string): void => {
        try { localStorage.removeItem(name); } catch {}
      },
    };
  }
  // Native: lazy-import MMKV so the module doesn't crash on web.
  // Falls back to an in-memory store if the native module isn't available
  // (e.g. Jest/Storybook, which have no real native runtime).
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
    const mmkv = createMMKV({ id: 'matchday-store' });
    return {
      getItem: (name: string): string | null => mmkv.getString(name) ?? null,
      setItem: (name: string, value: string): void => mmkv.set(name, value),
      removeItem: (name: string): void => { mmkv.remove(name); },
    };
  } catch {
    const memory = new Map<string, string>();
    return {
      getItem: (name: string): string | null => memory.get(name) ?? null,
      setItem: (name: string, value: string): void => { memory.set(name, value); },
      removeItem: (name: string): void => { memory.delete(name); },
    };
  }
};

const mmkvStorage = buildStorage();

// ---------------------------------------------------------------------------
// Root-level actions — cross-cutting concerns that touch most/all slices,
// so they don't belong to any single domain slice.
// ---------------------------------------------------------------------------
interface RootActions {
  applyCloudState: (pulled: {
    players: Player[];
    teams: Team[];
    matches: Match[];
    archivedRounds: ArchivedRound[];
    closedTournaments: ClosedTournament[];
    tournamentId: string;
    hasTournament: boolean;
    tournamentName: string;
    tournamentRanked: boolean;
    tournamentRounds: number;
    tournamentPlayers: string[];
    round: number;
    roundOpen: boolean;
    roundPlayers: string[];
  }) => void;
  resetStore: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Combined store type — every consumer still calls useStore() exactly as before
// ---------------------------------------------------------------------------
export type RootState = TournamentSlice & PlayersSlice & TeamsSlice & SettingsSlice & UiSlice & RootActions;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useStore = create<RootState>()(
  persist(
    (set, get, store) => ({
      ...createTournamentSlice(set, get, store),
      ...createPlayersSlice(set, get, store),
      ...createTeamsSlice(set, get, store),
      ...createSettingsSlice(set, get, store),
      ...createUiSlice(set, get, store),

      applyCloudState: (pulled) => {
        const s = get();
        if (s.demoMode) return;
        // If cloud is completely empty this is likely first sync — preserve local state
        const hasCloudData =
          pulled.players.length > 0 ||
          pulled.teams.length > 0 ||
          pulled.closedTournaments.length > 0 ||
          pulled.hasTournament;
        if (!hasCloudData) return;
        set({
          players: pulled.players,
          teams: pulled.teams,
          matches: pulled.matches,
          archivedRounds: pulled.archivedRounds,
          closedTournaments: pulled.closedTournaments,
          tournamentId: pulled.tournamentId,
          hasTournament: pulled.hasTournament,
          tournamentName: pulled.tournamentName,
          tournamentRanked: pulled.tournamentRanked,
          tournamentRounds: pulled.tournamentRounds,
          tournamentPlayers: pulled.tournamentPlayers,
          round: pulled.round,
          roundOpen: pulled.roundOpen,
          roundPlayers: pulled.roundPlayers,
        });
      },

      resetStore: async () => {
        const s = get();
        const matchUris = [
          ...s.matches,
          ...s.archivedRounds.flatMap((r) => r.matches),
          ...s.closedTournaments.flatMap((t) => t.rounds.flatMap((r) => r.matches)),
          ...(s.realDataBackup?.matches ?? []),
          ...(s.realDataBackup?.archivedRounds.flatMap((r) => r.matches) ?? []),
          ...(s.realDataBackup?.closedTournaments.flatMap((t) => t.rounds.flatMap((r) => r.matches)) ?? []),
        ].flatMap((m) => m.media ?? []).map((media) => media.uri);
        const playerPhotoUris = [
          ...s.players,
          ...(s.realDataBackup?.players ?? []),
        ].map((p) => p.photo).filter((uri): uri is string => !!uri);
        const teamLogoUris = [
          ...s.teams,
          ...(s.realDataBackup?.teams ?? []),
        ].map((t) => t.logo).filter((uri): uri is string => !!uri);

        const mediaUris = [...new Set([...matchUris, ...playerPhotoUris, ...teamLogoUris])];

        set({
          tournamentId: '',
          hasTournament: false,
          tournamentName: '',
          round: 0,
          roundOpen: false,
          tournamentRanked: true,
          tournamentRounds: 0,
          tournamentPlayers: [],
          roundPlayers: [],
          matches: [],
          archivedRounds: [],
          closedTournaments: [],
          players: [],
          teams: [],
          showNick: true,
          showTeamLogo: true,
          colorScheme: 'dark',
          language: 'en',
          demoMode: false,
          realDataBackup: null,
          modal: null,
          selectedMatchId: null,
          viewingRound: null,
          viewingTournament: null,
        });

        await Promise.all(mediaUris.map((uri) => deleteMediaItem(uri)));
      },
    }),
    {
      name: 'matchday-store',
      storage: createJSONStorage(() => mmkvStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const stripTransient = (matches: Match[]) =>
          matches.map((m) =>
            m.media?.some((i) => i.pendingUpload || i.uploading)
              ? { ...m, media: m.media!.filter((i) => !i.pendingUpload && !i.uploading) }
              : m,
          );
        state.matches = stripTransient(state.matches);
        state.archivedRounds = state.archivedRounds.map((r) => ({
          ...r,
          matches: stripTransient(r.matches),
        }));
      },
      partialize: (state) => ({
        tournamentId: state.tournamentId,
        hasTournament: state.hasTournament,
        tournamentName: state.tournamentName,
        round: state.round,
        roundOpen: state.roundOpen,
        tournamentRanked: state.tournamentRanked,
        tournamentRounds: state.tournamentRounds,
        tournamentPlayers: state.tournamentPlayers,
        roundPlayers: state.roundPlayers,
        matches: state.matches,
        archivedRounds: state.archivedRounds,
        closedTournaments: state.closedTournaments,
        players: state.players,
        teams: state.teams,
        showNick: state.showNick,
        showTeamLogo: state.showTeamLogo,
        colorScheme: state.colorScheme,
        language: state.language,
        demoMode: state.demoMode,
        realDataBackup: state.realDataBackup,
      }),
    },
  ),
);

// ---------------------------------------------------------------------------
// Convenience selectors
// ---------------------------------------------------------------------------
export const selectPlayer = (id: string) => (s: RootState) =>
  s.players.find((p) => p.id === id);

export const selectTeam = (code: string) => (s: RootState) =>
  s.teams.find((t) => t.code === code);
