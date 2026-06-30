import { StateCreator } from 'zustand';
import { Player, Match, ArchivedRound, ClosedTournament, MediaItem } from '../types';
import { ParsedMatch } from '@/utils/importRound';
import { calculateStandings, isTopTied } from '@/utils/standings';
import { Colors } from '@/theme/colors';
import { initials, patchMatchEverywhere } from '../sliceHelpers';
import { deleteMediaItem } from '@/supabase/storage';
import type { RootState } from '../index';

function scheduleMediaCleanup(matches: Match[]): void {
  matches
    .flatMap((m) => m.media ?? [])
    .filter((item) => !item.pendingUpload)
    .forEach((item) => { deleteMediaItem(item.uri).catch(() => {}); });
}

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
}

export interface TournamentActions {
  startTournament: (name: string, playerIds: string[], ranked: boolean, tournamentRounds?: number) => void;
  startRound: (ranked: boolean, playerIds: string[]) => void;
  addMatch: (match: Match) => void;
  deleteMatch: (id: string) => void;
  updateMatchMedia: (id: string, media: MediaItem[]) => void;
  updateMatchNote: (id: string, note: string) => void;
  updateMatchScore: (id: string, aScore: number, bScore: number) => void;
  updateMatchStats: (
    id: string,
    stats: Record<string, { a: number; b: number }> | undefined,
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

export const createTournamentSlice: StateCreator<RootState, [], [], TournamentSlice> = (set, get) => ({
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

  deleteMatch: (id) => {
    const match = get().matches.find((m) => m.id === id);
    if (match) scheduleMediaCleanup([match]);
    set((s) => ({ matches: s.matches.filter((m) => m.id !== id) }));
  },

  updateMatchScore: (id, aScore, bScore) =>
    set((s) => patchMatchEverywhere(s, id, { aScore, bScore })),

  updateMatchMedia: (id, media) =>
    set((s) => patchMatchEverywhere(s, id, { media })),

  updateMatchNote: (id, note) =>
    set((s) => patchMatchEverywhere(s, id, { note })),

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
    };

    set({
      archivedRounds: [...s.archivedRounds, newRound],
      matches: [],
      roundOpen: false,
      roundPlayers: [],
    });
  },

  deleteRound: () => {
    scheduleMediaCleanup(get().matches);
    set({ matches: [], roundOpen: false, roundPlayers: [] });
  },

  deleteArchivedRound: (id) => {
    const round = get().archivedRounds.find((r) => r.id === id);
    if (round) scheduleMediaCleanup(round.matches);
    set((s) => ({ archivedRounds: s.archivedRounds.filter((r) => r.id !== id) }));
  },

  deleteClosedTournament: (id) => {
    const tour = get().closedTournaments.find((t) => t.id === id);
    if (tour) scheduleMediaCleanup(tour.rounds.flatMap((r) => r.matches));
    set((s) => ({ closedTournaments: s.closedTournaments.filter((t) => t.id !== id) }));
  },

  closeTournament: () => {
    const s = get();

    // Calculate overall champion from all ranked archived rounds
    const allMatches = s.archivedRounds
      .filter((r) => r.ranked)
      .flatMap((r) => r.matches);

    const standings = calculateStandings(allMatches, s.tournamentPlayers);
    const champId = standings[0]?.playerId ?? '';
    const champPlayer = s.players.find((p: Player) => p.id === champId);

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

  // Only rounds in the still-open tournament's archivedRounds can have their
  // date edited. Once closeTournament() runs, rounds move into
  // closedTournaments and become read-only — this no-ops there.
  updateRoundDate: (id, date) =>
    set((s) => {
      if (!s.hasTournament) return s;
      return {
        archivedRounds: s.archivedRounds.map((r) =>
          r.id === id ? { ...r, date } : r,
        ),
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
});
