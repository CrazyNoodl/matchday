import { type StateCreator } from 'zustand';
import {
  type Player,
  type Match,
  type ArchivedRound,
  type ClosedTournament,
  type MediaItem,
  type StatConfidence,
} from '../types';
import { type ParsedMatch } from '@/utils/importRound';
import { calculateStandings, isTopTied } from '@/utils/standings';
import { Colors } from '@/theme/colors';
import { initials, patchMatchEverywhere, matchMediaFolder } from '../sliceHelpers';
import { buildRoundFolder, deleteStorageFolder } from '@/supabase/storage';
import type { RootState } from '../index';

export interface TournamentState {
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
  // Storage folder name for the currently open round's media (see #67)
  roundFolder: string;
}

export interface TournamentActions {
  startTournament: (
    name: string,
    playerIds: string[],
    ranked: boolean,
    tournamentRounds?: number,
  ) => void;
  startRound: (ranked: boolean, playerIds: string[]) => void;
  addMatch: (match: Match) => void;
  deleteMatch: (id: string) => void;
  updateMatchMedia: (id: string, media: MediaItem[]) => void;
  updateMatchNote: (id: string, note: string) => void;
  updateMatchScore: (id: string, aScore: number, bScore: number) => void;
  updateMatchStats: (
    id: string,
    stats: Record<string, { a: number; b: number; confidence?: StatConfidence }> | undefined,
  ) => void;
  swapMatchSides: (id: string) => void;
  finishRound: () => void;
  deleteRound: () => void;
  deleteArchivedRound: (id: string) => void;
  deleteClosedTournament: (id: string) => void;
  closeTournament: () => void;
  renameTournament: (name: string) => void;
  updateRoundDate: (id: string, date: string) => void;
  bulkImportMatches: (parsed: ParsedMatch[]) => void;
}

export type TournamentSlice = TournamentState & TournamentActions;

export const createTournamentSlice: StateCreator<RootState, [], [], TournamentSlice> = (
  set,
  get,
) => ({
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
  roundFolder: '',

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
      roundFolder: '',
    }),

  startRound: (ranked, playerIds) =>
    set((s) => ({
      roundOpen: true,
      tournamentRanked: ranked,
      matches: [],
      round: s.archivedRounds.filter((r) => r.ranked).length + 1,
      roundPlayers: playerIds,
      tournamentPlayers: [...new Set([...s.tournamentPlayers, ...playerIds])],
      roundFolder: buildRoundFolder(new Date()),
    })),

  addMatch: (match) => set((s) => ({ matches: [...s.matches, match] })),

  deleteMatch: (id) => {
    const s = get();
    const match = s.matches.find((m) => m.id === id);
    if (match) {
      deleteStorageFolder(`${s.tournamentId}/${matchMediaFolder(s.roundFolder, match)}`).catch(
        () => {},
      );
    }
    set((st) => ({ matches: st.matches.filter((m) => m.id !== id) }));
  },

  updateMatchScore: (id, aScore, bScore) =>
    set((s) => patchMatchEverywhere(s, id, { aScore, bScore })),

  updateMatchMedia: (id, media) => set((s) => patchMatchEverywhere(s, id, { media })),

  updateMatchNote: (id, note) => set((s) => patchMatchEverywhere(s, id, { note })),

  updateMatchStats: (id, stats) =>
    set((s) => patchMatchEverywhere(s, id, { statsOverride: stats })),

  swapMatchSides: (id) =>
    set((s) => {
      const match =
        s.matches.find((m) => m.id === id) ??
        s.archivedRounds.flatMap((r) => r.matches).find((m) => m.id === id);
      if (!match) return s;
      return patchMatchEverywhere(s, id, {
        aId: match.bId,
        bId: match.aId,
        aTeam: match.bTeam,
        bTeam: match.aTeam,
        aScore: match.bScore,
        bScore: match.aScore,
      });
    }),

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
      folder: s.roundFolder || undefined,
    };

    set({
      archivedRounds: [...s.archivedRounds, newRound],
      matches: [],
      roundOpen: false,
      roundPlayers: [],
      roundFolder: '',
    });
  },

  deleteRound: () => {
    const s = get();
    if (s.roundFolder) {
      deleteStorageFolder(`${s.tournamentId}/${s.roundFolder}`).catch(() => {});
    }
    // Matches without a mediaFolder predate the per-round layout and live
    // outside the round folder above — clean those up individually.
    s.matches
      .filter((m) => !m.mediaFolder)
      .forEach((m) => {
        deleteStorageFolder(`${s.tournamentId}/${matchMediaFolder(s.roundFolder, m)}`).catch(
          () => {},
        );
      });
    set({ matches: [], roundOpen: false, roundPlayers: [], roundFolder: '' });
  },

  deleteArchivedRound: (id) => {
    const s = get();
    const round = s.archivedRounds.find((r) => r.id === id);
    if (round) {
      if (round.folder) {
        deleteStorageFolder(`${s.tournamentId}/${round.folder}`).catch(() => {});
      }
      round.matches
        .filter((m) => !m.mediaFolder)
        .forEach((m) => {
          deleteStorageFolder(`${s.tournamentId}/${matchMediaFolder(round.folder, m)}`).catch(
            () => {},
          );
        });
    }
    set((st) => ({ archivedRounds: st.archivedRounds.filter((r) => r.id !== id) }));
  },

  deleteClosedTournament: (id) => {
    const tour = get().closedTournaments.find((t) => t.id === id);
    // The whole tournament folder covers every round/match nested under it —
    // including matches from before the per-round layout, which also lived
    // directly under the tournament id — so a single sweep is enough here.
    if (tour) deleteStorageFolder(tour.id).catch(() => {});
    set((s) => ({ closedTournaments: s.closedTournaments.filter((t) => t.id !== id) }));
  },

  closeTournament: () => {
    const s = get();

    // Calculate overall champion from all ranked archived rounds
    const allMatches = s.archivedRounds.filter((r) => r.ranked).flatMap((r) => r.matches);

    const standings = calculateStandings(allMatches, s.tournamentPlayers);
    const champId = standings[0]?.playerId ?? '';
    const champPlayer = s.players.find((p: Player) => p.id === champId);
    const champTeam = s.teams.find((t) => t.code === champPlayer?.teamCode);

    const closed: ClosedTournament = {
      id: s.tournamentId || `tour-${Date.now()}`,
      name: s.tournamentName,
      date: new Date().toISOString(),
      rounds: [...s.archivedRounds],
      champId,
      champName: champPlayer?.name ?? '',
      champColor: champTeam?.color ?? Colors.team[0],
      champInit: champPlayer ? initials(champPlayer.name) : '',
      players: [...s.tournamentPlayers],
    };

    set({
      closedTournaments: [...s.closedTournaments, closed],
      tournamentId: '',
      hasTournament: false,
      tournamentName: '',
      roundFolder: '',
      round: 0,
      roundOpen: false,
      tournamentRounds: 0,
      tournamentPlayers: [],
      matches: [],
      archivedRounds: [],
    });
  },

  renameTournament: (name) => set({ tournamentName: name }),

  // Only rounds in the still-open tournament's archivedRounds can have their
  // date edited. Once closeTournament() runs, rounds move into
  // closedTournaments and become read-only — this no-ops there.
  updateRoundDate: (id, date) =>
    set((s) => {
      if (!s.hasTournament) return s;
      return {
        archivedRounds: s.archivedRounds.map((r) => (r.id === id ? { ...r, date } : r)),
      };
    }),

  bulkImportMatches: (parsed) => {
    const s = get();
    const ts = Date.now();
    const newPlayers: Player[] = [];
    const newMatches: Match[] = [];

    const playerByName = new Map<string, Player>(
      s.players.map((p: Player) => [p.name.toLowerCase(), p]),
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
        const found = s.teams.find((t) => t.code.toUpperCase() === code.toUpperCase());
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

    const allMatchPlayerIds = [...new Set(newMatches.flatMap((m) => [m.aId, m.bId]))];
    const missingFromTournament = allMatchPlayerIds.filter(
      (id) => !s.tournamentPlayers.includes(id),
    );

    set({
      players: [...s.players, ...newPlayers],
      matches: [...s.matches, ...newMatches],
      tournamentPlayers: [...new Set([...s.tournamentPlayers, ...missingFromTournament])],
    });
  },
});
