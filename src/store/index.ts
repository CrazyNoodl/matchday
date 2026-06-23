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
  RealDataBackup,
} from './types';
import { ParsedMatch } from '../utils/importRound';
import { deleteMediaItem } from '../supabase/storage';
import { DEMO_STATE } from '../demo/data';
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
// State interface
// ---------------------------------------------------------------------------
interface AppState {
  // Tournament state
  tournamentId: string;
  hasTournament: boolean;
  tournamentName: string;
  round: number;
  roundOpen: boolean;
  tournamentRanked: boolean;
  tournamentRounds: number;
  tournamentPlayers: string[];
  roundPlayers: string[];
  matches: Match[];
  archivedRounds: ArchivedRound[];
  closedTournaments: ClosedTournament[];

  // Settings
  players: Player[];
  teams: Team[];
  showNick: boolean;
  showTeamLogo: boolean;
  language: string;
  demoMode: boolean;
  realDataBackup: RealDataBackup | null;

  // UI state (not persisted)
  modal: Modal;
  selectedMatchId: string | null;
  viewingRound: ArchivedRound | null;
  viewingTournament: ClosedTournament | null;
  syncStatus: 'idle' | 'syncing' | 'error';
}

// ---------------------------------------------------------------------------
// Actions interface
// ---------------------------------------------------------------------------
interface Actions {
  // Tournament
  startTournament: (name: string, playerIds: string[], ranked: boolean, tournamentRounds?: number) => void;
  startRound: (ranked: boolean, playerIds: string[]) => void;
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
  setViewingRound: (round: ArchivedRound | null) => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
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
  setViewingTournament: (t: ClosedTournament | null) => void;
  setShowNick: (v: boolean) => void;
  setShowTeamLogo: (v: boolean) => void;
  setLanguage: (lang: string) => void;
  setDemoMode: (on: boolean) => void;
  resetStore: () => Promise<void>;
  bulkImportMatches: (parsed: ParsedMatch[]) => void;
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
// Helper — patch a single match wherever it lives (current matches + archived rounds)
// ---------------------------------------------------------------------------
function patchMatchEverywhere(
  s: Pick<AppState, 'matches' | 'archivedRounds'>,
  id: string,
  patch: Partial<Match>,
): Pick<AppState, 'matches' | 'archivedRounds'> {
  return {
    matches: s.matches.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    archivedRounds: s.archivedRounds.map((r) => ({
      ...r,
      matches: r.matches.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),
  };
}

// ---------------------------------------------------------------------------
// Helper — collect every match across current round, archived rounds, and closed tournaments
// ---------------------------------------------------------------------------
function collectAllMatches(
  s: Pick<AppState, 'matches' | 'archivedRounds' | 'closedTournaments'>,
): Match[] {
  return [
    ...s.matches,
    ...s.archivedRounds.flatMap((r) => r.matches),
    ...s.closedTournaments.flatMap((t) => t.rounds.flatMap((r) => r.matches)),
  ];
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
      language: 'en',
      demoMode: false,
      realDataBackup: null,

      // UI state
      modal: null,
      selectedMatchId: null,
      viewingRound: null,
      viewingTournament: null,
      syncStatus: 'idle',

      // -----------------------------------------------------------------------
      // Tournament actions
      // -----------------------------------------------------------------------
      startTournament: (name, playerIds, ranked, tournamentRounds = 0) =>
        set({
          tournamentId: `tour-${Date.now()}`,
          hasTournament: true,
          tournamentName: name,
          round: 1,
          roundOpen: false,
          tournamentRanked: ranked,
          tournamentRounds,
          tournamentPlayers: playerIds,
          matches: [],
          archivedRounds: [],
        }),

      startRound: (ranked, playerIds) =>
        set((s) => ({
          roundOpen: true,
          tournamentRanked: ranked,
          matches: [],
          round: s.archivedRounds.length + 1,
          roundPlayers: playerIds,
          tournamentPlayers: [...new Set([...s.tournamentPlayers, ...playerIds])],
        })),

      addMatch: (match) =>
        set((s) => ({ matches: [...s.matches, match] })),

      deleteMatch: (id) =>
        set((s) => ({ matches: s.matches.filter((m) => m.id !== id) })),

      updateMatchScore: (id, aScore, bScore) =>
        set((s) => patchMatchEverywhere(s, id, { aScore, bScore })),

      updateMatchMedia: (id, media) =>
        set((s) => patchMatchEverywhere(s, id, { media })),

      updateMatchNote: (id, note) =>
        set((s) => patchMatchEverywhere(s, id, { note })),

      updateMatchStats: (id, stats) =>
        set((s) => patchMatchEverywhere(s, id, { statsOverride: stats })),

      finishRound: () => {
        const s = get();
        const standings = calculateStandings(s.matches, s.roundPlayers);
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
          players: [...s.roundPlayers],
        };

        set({
          archivedRounds: [...s.archivedRounds, newRound],
          matches: [],
          roundOpen: false,
          roundPlayers: [],
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
          id: s.tournamentId || `tour-${Date.now()}`,
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
          tournamentId: '',
          hasTournament: false,
          tournamentName: '',
          round: 0,
          roundOpen: false,
          tournamentRounds: 0,
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
        const allMatches = collectAllMatches(s);
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
        const allMatches = collectAllMatches(s);
        if (allMatches.some((m) => m.aTeam === code || m.bTeam === code)) return;
        set({ teams: s.teams.filter((t) => t.code !== code) });
      },

      // -----------------------------------------------------------------------
      // UI actions
      // -----------------------------------------------------------------------
      setModal: (modal) => set({ modal }),
      setSelectedMatch: (id) => set({ selectedMatchId: id }),
      setViewingRound: (round) => set({ viewingRound: round }),
      setSyncStatus: (status) => set({ syncStatus: status }),
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
      setViewingTournament: (t) => set({ viewingTournament: t }),
      setShowNick: (v) => set({ showNick: v }),
      setShowTeamLogo: (v) => set({ showTeamLogo: v }),
      setLanguage: (lang) => set({ language: lang }),

      setDemoMode: (on) => {
        const s = get();
        if (on === s.demoMode) return;
        if (on) {
          const backup: RealDataBackup = {
            tournamentId: s.tournamentId,
            hasTournament: s.hasTournament,
            tournamentName: s.tournamentName,
            round: s.round,
            roundOpen: s.roundOpen,
            tournamentRanked: s.tournamentRanked,
            tournamentRounds: s.tournamentRounds,
            tournamentPlayers: s.tournamentPlayers,
            roundPlayers: s.roundPlayers,
            matches: s.matches,
            archivedRounds: s.archivedRounds,
            closedTournaments: s.closedTournaments,
            players: s.players,
            teams: s.teams,
          };
          set({
            demoMode: true,
            realDataBackup: backup,
            ...DEMO_STATE,
            modal: null,
            selectedMatchId: null,
            viewingRound: null,
            viewingTournament: null,
          });
        } else {
          const backup = s.realDataBackup;
          set({
            demoMode: false,
            realDataBackup: null,
            ...(backup ?? {}),
            modal: null,
            selectedMatchId: null,
            viewingRound: null,
            viewingTournament: null,
          });
        }
      },

      bulkImportMatches: (parsed) => {
        const s = get();
        const ts = Date.now();
        const newPlayers: Player[] = [];
        const newMatches: Match[] = [];

        const playerByName = new Map<string, Player>(
          s.players.map((p) => [p.name.toLowerCase(), p]),
        );

        for (let i = 0; i < parsed.length; i++) {
          const m = parsed[i];

          const resolvePlayer = (name: string): Player => {
            const key = name.toLowerCase();
            let player = playerByName.get(key);
            if (!player) {
              player = {
                id: `player-import-${ts}-${newPlayers.length}`,
                name,
                color: Colors.player[(s.players.length + newPlayers.length) % Colors.player.length],
                teamCode: s.teams[0]?.code ?? 'JUV',
              };
              newPlayers.push(player);
              playerByName.set(key, player);
            }
            return player;
          };

          const playerA = resolvePlayer(m.playerAName);
          const playerB = resolvePlayer(m.playerBName);

          const resolveTeam = (code: string | null, fallback: string): string => {
            if (!code) return fallback;
            const found = s.teams.find(
              (t) => t.code.toUpperCase() === code.toUpperCase(),
            );
            return found ? found.code : fallback;
          };

          newMatches.push({
            id: `match-import-${ts}-${i}`,
            aId: playerA.id,
            bId: playerB.id,
            aTeam: resolveTeam(m.teamACode, playerA.teamCode),
            bTeam: resolveTeam(m.teamBCode, playerB.teamCode),
            aScore: m.scoreA,
            bScore: m.scoreB,
          });
        }

        const allMatchPlayerIds = [
          ...new Set(newMatches.flatMap((m) => [m.aId, m.bId])),
        ];
        const missingFromTournament = allMatchPlayerIds.filter(
          (id) => !s.tournamentPlayers.includes(id),
        );

        set({
          players: [...s.players, ...newPlayers],
          matches: [...s.matches, ...newMatches],
          tournamentPlayers: [
            ...new Set([...s.tournamentPlayers, ...missingFromTournament]),
          ],
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
export const selectPlayer = (id: string) => (s: AppState & Actions) =>
  s.players.find((p) => p.id === id);

export const selectTeam = (code: string) => (s: AppState & Actions) =>
  s.teams.find((t) => t.code === code);
