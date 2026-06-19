import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import {
  Player,
  Team,
  Match,
  ArchivedRound,
  ClosedTournament,
  Modal,
} from './types';
import { calculateStandings, isTopTied } from '../utils/standings';
import { Colors } from '../theme/colors';

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
  // Native: lazy-import MMKV so the module doesn't crash on web
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  const mmkv = createMMKV({ id: 'matchday-store' });
  return {
    getItem: (name: string): string | null => mmkv.getString(name) ?? null,
    setItem: (name: string, value: string): void => mmkv.set(name, value),
    removeItem: (name: string): void => { mmkv.remove(name); },
  };
};

const mmkvStorage = buildStorage();

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const SEED_PLAYERS: Player[] = [
  {
    id: 'player-1',
    name: 'Alex',
    nick: 'Fox',
    color: Colors.player[0],
    teamCode: 'MCI',
  },
  {
    id: 'player-2',
    name: 'Max',
    nick: 'Thunder',
    color: Colors.player[1],
    teamCode: 'BAR',
  },
];

const SEED_TEAMS: Team[] = [
  { code: 'MCI', name: 'Manchester City', short: 'MCI', color: Colors.team[0] },
  { code: 'BAR', name: 'FC Barcelona', short: 'BAR', color: Colors.team[1] },
  { code: 'RMA', name: 'Real Madrid', short: 'RMA', color: Colors.team[2] },
];

// ---------------------------------------------------------------------------
// State interface
// ---------------------------------------------------------------------------
interface AppState {
  // Tournament state
  hasTournament: boolean;
  tournamentName: string;
  round: number;
  roundOpen: boolean;
  tournamentRanked: boolean;
  tournamentPlayers: string[];
  matches: Match[];
  archivedRounds: ArchivedRound[];
  closedTournaments: ClosedTournament[];

  // Settings
  players: Player[];
  teams: Team[];
  showNick: boolean;
  showTeamLogo: boolean;
  language: string;

  // UI state (not persisted)
  modal: Modal;
  selectedMatchId: string | null;
  editingPlayerId: string | null;
  editingTeamCode: string | null;
  winnerPlayerId: string | null;
  viewingRound: ArchivedRound | null;
  viewingTournament: ClosedTournament | null;
}

// ---------------------------------------------------------------------------
// Actions interface
// ---------------------------------------------------------------------------
interface Actions {
  // Tournament
  startTournament: (name: string, playerIds: string[], ranked: boolean) => void;
  startRound: (ranked: boolean) => void;
  addMatch: (match: Match) => void;
  deleteMatch: (id: string) => void;
  updateMatchMedia: (id: string, media: import('./types').MediaItem[]) => void;
  updateMatchNote: (id: string, note: string) => void;
  updateMatchScore: (id: string, aScore: number, bScore: number) => void;
  updateMatchStats: (
    id: string,
    stats: Record<string, { a: number; b: number }>,
  ) => void;
  finishRound: () => void;
  closeTournament: () => void;
  renameTournament: (name: string) => void;

  // Players
  addPlayer: (player: Player) => void;
  updatePlayer: (player: Player) => void;
  deletePlayer: (id: string) => void;

  // Teams
  addTeam: (team: Team) => void;
  updateTeam: (team: Team) => void;
  deleteTeam: (code: string) => void;

  // UI
  setModal: (modal: Modal) => void;
  setSelectedMatch: (id: string | null) => void;
  setEditingPlayer: (id: string | null) => void;
  setEditingTeam: (code: string | null) => void;
  setWinner: (id: string | null) => void;
  setViewingRound: (round: ArchivedRound | null) => void;
  setViewingTournament: (t: ClosedTournament | null) => void;
  setShowNick: (v: boolean) => void;
  setShowTeamLogo: (v: boolean) => void;
  setLanguage: (lang: string) => void;
  resetStore: () => void;
}

// ---------------------------------------------------------------------------
// Helper — generate short initials from a player name
// ---------------------------------------------------------------------------
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useStore = create<AppState & Actions>()(
  persist(
    (set, get) => ({
      // -----------------------------------------------------------------------
      // Initial state
      // -----------------------------------------------------------------------
      hasTournament: false,
      tournamentName: '',
      round: 0,
      roundOpen: false,
      tournamentRanked: true,
      tournamentPlayers: [],
      matches: [],
      archivedRounds: [],
      closedTournaments: [],

      players: SEED_PLAYERS,
      teams: SEED_TEAMS,
      showNick: true,
      showTeamLogo: true,
      language: 'en',

      // UI state
      modal: null,
      selectedMatchId: null,
      editingPlayerId: null,
      editingTeamCode: null,
      winnerPlayerId: null,
      viewingRound: null,
      viewingTournament: null,

      // -----------------------------------------------------------------------
      // Tournament actions
      // -----------------------------------------------------------------------
      startTournament: (name, playerIds, ranked) =>
        set({
          hasTournament: true,
          tournamentName: name,
          round: 1,
          roundOpen: false,
          tournamentRanked: ranked,
          tournamentPlayers: playerIds,
          matches: [],
          archivedRounds: [],
        }),

      startRound: (ranked) =>
        set((s) => ({
          roundOpen: true,
          tournamentRanked: ranked,
          matches: [],
          round: s.archivedRounds.length + 1,
        })),

      addMatch: (match) =>
        set((s) => ({ matches: [...s.matches, match] })),

      deleteMatch: (id) =>
        set((s) => ({ matches: s.matches.filter((m) => m.id !== id) })),

      updateMatchScore: (id, aScore, bScore) =>
        set((s) => ({
          matches: s.matches.map((m) =>
            m.id === id ? { ...m, aScore, bScore } : m,
          ),
        })),

      updateMatchMedia: (id, media) =>
        set((s) => ({
          matches: s.matches.map((m) => (m.id === id ? { ...m, media } : m)),
        })),

      updateMatchNote: (id, note) =>
        set((s) => ({
          matches: s.matches.map((m) => (m.id === id ? { ...m, note } : m)),
        })),

      updateMatchStats: (id, stats) =>
        set((s) => ({
          matches: s.matches.map((m) =>
            m.id === id ? { ...m, statsOverride: stats } : m,
          ),
        })),

      finishRound: () => {
        const s = get();
        const standings = calculateStandings(s.matches, s.tournamentPlayers);
        const isTrueDraw = isTopTied(standings, s.matches);
        const winnerId = isTrueDraw || !standings[0] ? '' : standings[0].playerId;

        const newRound: ArchivedRound = {
          id: `round-${Date.now()}`,
          n: s.round,
          date: new Date().toISOString(),
          winner: winnerId,
          games: s.matches.length,
          ranked: s.tournamentRanked,
          matches: [...s.matches],
          name: `Round ${s.round}`,
        };

        set({
          archivedRounds: [...s.archivedRounds, newRound],
          matches: [],
          roundOpen: false,
        });
      },

      closeTournament: () => {
        const s = get();

        // Calculate overall champion from all ranked archived rounds
        const allMatches = s.archivedRounds
          .filter((r) => r.ranked)
          .flatMap((r) => r.matches);

        const standings = calculateStandings(allMatches, s.tournamentPlayers);
        const champId = standings[0]?.playerId ?? '';
        const champPlayer = s.players.find((p) => p.id === champId);

        const closed: ClosedTournament = {
          id: `tour-${Date.now()}`,
          name: s.tournamentName,
          date: new Date().toISOString(),
          rounds: [...s.archivedRounds],
          champId,
          champName: champPlayer?.name ?? '',
          champColor: champPlayer?.color ?? Colors.player[0],
          champInit: champPlayer ? initials(champPlayer.name) : '',
          players: [...s.tournamentPlayers],
        };

        set({
          closedTournaments: [...s.closedTournaments, closed],
          hasTournament: false,
          tournamentName: '',
          round: 0,
          roundOpen: false,
          tournamentPlayers: [],
          matches: [],
          archivedRounds: [],
        });
      },

      renameTournament: (name) => set({ tournamentName: name }),

      // -----------------------------------------------------------------------
      // Player actions
      // -----------------------------------------------------------------------
      addPlayer: (player) =>
        set((s) => ({ players: [...s.players, player] })),

      updatePlayer: (player) =>
        set((s) => ({
          players: s.players.map((p) => (p.id === player.id ? player : p)),
        })),

      deletePlayer: (id) => {
        const s = get();
        const allMatches = [
          ...s.matches,
          ...s.archivedRounds.flatMap((r) => r.matches),
          ...s.closedTournaments.flatMap((t) => t.rounds.flatMap((r) => r.matches)),
        ];
        if (allMatches.some((m) => m.aId === id || m.bId === id)) return;
        set({ players: s.players.filter((p) => p.id !== id) });
      },

      // -----------------------------------------------------------------------
      // Team actions
      // -----------------------------------------------------------------------
      addTeam: (team) =>
        set((s) => ({ teams: [...s.teams, team] })),

      updateTeam: (team) =>
        set((s) => ({
          teams: s.teams.map((t) => (t.code === team.code ? team : t)),
        })),

      deleteTeam: (code) => {
        const s = get();
        const allMatches = [
          ...s.matches,
          ...s.archivedRounds.flatMap((r) => r.matches),
          ...s.closedTournaments.flatMap((t) => t.rounds.flatMap((r) => r.matches)),
        ];
        if (allMatches.some((m) => m.aTeam === code || m.bTeam === code)) return;
        set({ teams: s.teams.filter((t) => t.code !== code) });
      },

      // -----------------------------------------------------------------------
      // UI actions
      // -----------------------------------------------------------------------
      setModal: (modal) => set({ modal }),
      setSelectedMatch: (id) => set({ selectedMatchId: id }),
      setEditingPlayer: (id) => set({ editingPlayerId: id }),
      setEditingTeam: (code) => set({ editingTeamCode: code }),
      setWinner: (id) => set({ winnerPlayerId: id }),
      setViewingRound: (round) => set({ viewingRound: round }),
      setViewingTournament: (t) => set({ viewingTournament: t }),
      setShowNick: (v) => set({ showNick: v }),
      setShowTeamLogo: (v) => set({ showTeamLogo: v }),
      setLanguage: (lang) => set({ language: lang }),

      resetStore: () => {
        set({
          hasTournament: false,
          tournamentName: '',
          round: 0,
          roundOpen: false,
          tournamentRanked: true,
          tournamentPlayers: [],
          matches: [],
          archivedRounds: [],
          closedTournaments: [],
          players: SEED_PLAYERS,
          teams: SEED_TEAMS,
          showNick: true,
          showTeamLogo: true,
          language: 'en',
          modal: null,
          selectedMatchId: null,
          editingPlayerId: null,
          editingTeamCode: null,
          winnerPlayerId: null,
          viewingRound: null,
          viewingTournament: null,
        });
      },
    }),
    {
      name: 'matchday-store',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        hasTournament: state.hasTournament,
        tournamentName: state.tournamentName,
        round: state.round,
        roundOpen: state.roundOpen,
        tournamentRanked: state.tournamentRanked,
        tournamentPlayers: state.tournamentPlayers,
        matches: state.matches,
        archivedRounds: state.archivedRounds,
        closedTournaments: state.closedTournaments,
        players: state.players,
        teams: state.teams,
        showNick: state.showNick,
        showTeamLogo: state.showTeamLogo,
        language: state.language,
      }),
    },
  ),
);

// ---------------------------------------------------------------------------
// Convenience selectors
// ---------------------------------------------------------------------------
export const selectPlayer = (id: string) => (s: AppState & Actions) =>
  s.players.find((p) => p.id === id);

export const selectTeam = (code: string) => (s: AppState & Actions) =>
  s.teams.find((t) => t.code === code);
