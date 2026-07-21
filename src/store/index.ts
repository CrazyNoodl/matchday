import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { type Player, type Team, type Match, type ArchivedRound, type ClosedTournament } from './types';
import { deleteMediaItem } from '../supabase/storage';
import { createTournamentSlice, type TournamentSlice } from './slices/tournamentSlice';
import { createPlayersSlice, type PlayersSlice } from './slices/playersSlice';
import { createTeamsSlice, type TeamsSlice } from './slices/teamsSlice';
import { createSettingsSlice, type SettingsSlice, type StandingsViewMode } from './slices/settingsSlice';
import type { ThemePreference } from '../theme/colors';
import type { Language } from '../i18n';
import { createUiSlice, type UiSlice } from './slices/uiSlice';
import { stripUploadingMedia } from './sliceHelpers';

// ---------------------------------------------------------------------------
// Storage adapter — MMKV on native, localStorage on web
// ---------------------------------------------------------------------------
const buildStorage = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (name: string): string | null => {
        try {
          return localStorage.getItem(name);
        } catch (e) {
          console.warn('[store] localStorage.getItem failed:', e);
          Sentry.captureException(e, { tags: { storageOp: 'getItem' } });
          return null;
        }
      },
      setItem: (name: string, value: string): void => {
        try {
          localStorage.setItem(name, value);
        } catch (e) {
          console.warn('[store] localStorage.setItem failed:', e);
          Sentry.captureException(e, { tags: { storageOp: 'setItem' } });
        }
      },
      removeItem: (name: string): void => {
        try {
          localStorage.removeItem(name);
        } catch (e) {
          console.warn('[store] localStorage.removeItem failed:', e);
          Sentry.captureException(e, { tags: { storageOp: 'removeItem' } });
        }
      },
    };
  }
  // Native: lazy-import MMKV so the module doesn't crash on web.
  // Falls back to an in-memory store if the native module isn't available
  // (e.g. Jest/Storybook, which have no real native runtime).
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
    const mmkv = createMMKV({ id: 'matchday-store' });
    return {
      getItem: (name: string): string | null => mmkv.getString(name) ?? null,
      setItem: (name: string, value: string): void => mmkv.set(name, value),
      removeItem: (name: string): void => {
        mmkv.remove(name);
      },
    };
  } catch (e) {
    console.warn('[store] MMKV unavailable, falling back to in-memory storage:', e);
    Sentry.captureException(e, { tags: { storageOp: 'mmkvInit' } });
    const memory = new Map<string, string>();
    return {
      getItem: (name: string): string | null => memory.get(name) ?? null,
      setItem: (name: string, value: string): void => {
        memory.set(name, value);
      },
      removeItem: (name: string): void => {
        memory.delete(name);
      },
    };
  }
};

const mmkvStorage = buildStorage();

// Set true for the duration of resetStore()'s state wipe so useSyncManager's
// dirty-tracking subscriber doesn't mistake a local-only cache clear (dev
// "Reset data", sign-out account isolation) for a real edit to sync — that
// previously pushed the emptied state and deleted the user's real cloud rows.
export const syncSuppressionRef = { current: false };

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
    // null when the account has no synced settings row yet (fresh account,
    // or an existing account signing in for the first time after #81
    // shipped) — applyCloudState() leaves local settings untouched in that
    // case rather than overwriting them with anything.
    settings: {
      showNick: boolean;
      showTeamLogo: boolean;
      groupByTours: boolean;
      showAvgGoals: boolean;
      standingsViewMode: StandingsViewMode;
      colorScheme: ThemePreference;
      language: Language;
    } | null;
  }) => void;
  resetStore: (options?: { deleteCloudMedia?: boolean }) => Promise<void>;
  // Sync tables not yet pushed to Supabase. Persisted (unlike useSyncManager's
  // in-memory dirty tracking) so an app crash/force-quit/OS eviction before a
  // push completes doesn't silently lose the edit on next launch — see
  // useSyncManager's init(), which pushes these before ever pulling.
  pendingSyncTables: string[];
  setPendingSyncTables: (tables: string[]) => void;
  // The Supabase user id the local store's data was last confirmed to belong
  // to. Persisted so useSyncManager's init() can detect, on next launch, that
  // local data survived under the wrong account (e.g. a sign-out crashed
  // between resetStore() and signOut()) and force a wipe before that stale
  // data can reach the newly-signed-in account's cloud rows — see #80.
  lastSyncedUserId: string | null;
  setLastSyncedUserId: (id: string | null) => void;
}

// ---------------------------------------------------------------------------
// Combined store type — every consumer still calls useStore() exactly as before
// ---------------------------------------------------------------------------
export type RootState = TournamentSlice &
  PlayersSlice &
  TeamsSlice &
  SettingsSlice &
  UiSlice &
  RootActions;

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
        // Settings are account-scoped independently of the rest of the data
        // (#81) — apply them whenever a cloud row exists, even on a device
        // that otherwise has no cloud data yet (e.g. settings-only sync).
        // When there's no cloud row at all, leave local settings as-is:
        // either genuine device defaults, or an existing user's pre-#81
        // local preferences that useSyncManager will push up as the
        // account's first settings row.
        const settingsUpdate = pulled.settings
          ? {
              showNick: pulled.settings.showNick,
              showTeamLogo: pulled.settings.showTeamLogo,
              groupByTours: pulled.settings.groupByTours,
              showAvgGoals: pulled.settings.showAvgGoals,
              standingsViewMode: pulled.settings.standingsViewMode,
              colorScheme: pulled.settings.colorScheme,
              language: pulled.settings.language,
            }
          : {};
        if (!hasCloudData) {
          if (pulled.settings) set(settingsUpdate);
          return;
        }
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
          ...settingsUpdate,
        });
      },

      pendingSyncTables: [],
      setPendingSyncTables: (tables) => set({ pendingSyncTables: tables }),

      lastSyncedUserId: null,
      setLastSyncedUserId: (id) => set({ lastSyncedUserId: id }),

      // deleteCloudMedia defaults to false: resetStore() is also used by
      // sign-out to clear the *local* cache so it can't leak into the next
      // account on this device — that must never delete the real photos/
      // logos still sitting in the user's Supabase Storage bucket. Only the
      // explicit "Reset All Data" flow (which already deletes the user's
      // cloud DB rows via deleteAllCloudData()) opts in. Without this flag,
      // every resetStore() call — including a plain sign-out, and doubly so
      // one made while Demo Mode was on, since realDataBackup's real media
      // is included below too — permanently deleted the user's real cloud
      // media as a side effect of a supposedly local-only cache clear.
      resetStore: async (options) => {
        const s = get();
        const matchUris = [
          ...s.matches,
          ...s.archivedRounds.flatMap((r) => r.matches),
          ...s.closedTournaments.flatMap((t) => t.rounds.flatMap((r) => r.matches)),
          ...(s.realDataBackup?.matches ?? []),
          ...(s.realDataBackup?.archivedRounds.flatMap((r) => r.matches) ?? []),
          ...(s.realDataBackup?.closedTournaments.flatMap((t) =>
            t.rounds.flatMap((r) => r.matches),
          ) ?? []),
        ]
          .flatMap((m) => m.media ?? [])
          .map((media) => media.uri);
        const playerPhotoUris = [...s.players, ...(s.realDataBackup?.players ?? [])]
          .map((p) => p.photo)
          .filter((uri): uri is string => !!uri);
        const teamLogoUris = [...s.teams, ...(s.realDataBackup?.teams ?? [])]
          .map((t) => t.logo)
          .filter((uri): uri is string => !!uri);

        const mediaUris = [...new Set([...matchUris, ...playerPhotoUris, ...teamLogoUris])];

        syncSuppressionRef.current = true;
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
          pendingSyncTables: [],
          demoMode: false,
          realDataBackup: null,
          modal: null,
          selectedMatchId: null,
          viewingRound: null,
          viewingTournament: null,
          lastSyncedUserId: null,
          // Display preferences are account-scoped and synced (#81) — reset
          // to defaults here too, so a sign-out can't leave account A's
          // language/theme/etc. visible to account B before the next pull
          // completes. Reset All Data (the other resetStore() caller) also
          // wipes the matching cloud row via deleteAllCloudData(), so this
          // stays consistent there instead of resurrecting the old values
          // on the next sync.
          showNick: true,
          showTeamLogo: true,
          groupByTours: true,
          showAvgGoals: true,
          standingsViewMode: 'table',
          colorScheme: 'dark',
          language: 'en',
        });
        syncSuppressionRef.current = false;

        if (options?.deleteCloudMedia) {
          await Promise.all(mediaUris.map((uri) => deleteMediaItem(uri)));
        }
      },
    }),
    {
      name: 'matchday-store',
      storage: createJSONStorage(() => mmkvStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.matches = stripUploadingMedia(state.matches);
        state.archivedRounds = state.archivedRounds.map((r) => ({
          ...r,
          matches: stripUploadingMedia(r.matches),
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
        pendingSyncTables: state.pendingSyncTables,
        lastSyncedUserId: state.lastSyncedUserId,
        showNick: state.showNick,
        showTeamLogo: state.showTeamLogo,
        groupByTours: state.groupByTours,
        showAvgGoals: state.showAvgGoals,
        standingsViewMode: state.standingsViewMode,
        colorScheme: state.colorScheme,
        language: state.language,
        demoMode: state.demoMode,
        realDataBackup: state.realDataBackup,
        hasSeenOnboarding: state.hasSeenOnboarding,
        leaderModalEnabled: state.leaderModalEnabled,
        leaderModalMinPlayers: state.leaderModalMinPlayers,
        matchDragReorderEnabled: state.matchDragReorderEnabled,
      }),
    },
  ),
);

// ---------------------------------------------------------------------------
// Convenience selectors
// ---------------------------------------------------------------------------
export const selectPlayer = (id: string) => (s: RootState) => s.players.find((p) => p.id === id);

export const selectTeam = (code: string) => (s: RootState) => s.teams.find((t) => t.code === code);
