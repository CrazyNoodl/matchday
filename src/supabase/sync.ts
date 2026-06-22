/**
 * Sync layer — local-first, Supabase as source of truth.
 *
 * Strategy:
 *  - Push: every store mutation calls pushState() → upserts all entities
 *  - Pull: on app start (and on real-time event) calls pullState() → merges into store
 *  - Conflict: last_write_wins via updated_at timestamp
 */

import { supabase, supabaseConfigured } from './client';
import { getCurrentUserId } from './auth';
import type { Player, Team, Match, ArchivedRound, ClosedTournament } from '../store/types';

// ---------------------------------------------------------------------------
// Push — local → Supabase
// ---------------------------------------------------------------------------

export interface SyncPayload {
  tournamentId: string;
  players: Player[];
  teams: Team[];
  matches: Match[];
  archivedRounds: ArchivedRound[];
  closedTournaments: ClosedTournament[];
  tournament: {
    name: string;
    ranked: boolean;
    roundsTarget: number;
    playerIds: string[];
    round: number;
    roundOpen: boolean;
    roundPlayers: string[];
    hasTournament: boolean;
  };
}

export async function pushState(payload: SyncPayload): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // 1. Players
  if (payload.players.length > 0) {
    await db.from('players').upsert(
      payload.players.map((p) => ({
        id: p.id,
        user_id: userId,
        name: p.name,
        nick: p.nick ?? null,
        color: p.color,
        team_code: p.teamCode,
        photo: p.photo ?? null,
        updated_at: now,
      })),
      { onConflict: 'id,user_id' },
    );
  }
  const playerIds = payload.players.map((p) => p.id);
  if (playerIds.length > 0) {
    await db.from('players').delete().eq('user_id', userId).not('id', 'in', `(${playerIds})`);
  } else {
    await db.from('players').delete().eq('user_id', userId);
  }

  // 2. Teams
  if (payload.teams.length > 0) {
    await db.from('teams').upsert(
      payload.teams.map((t) => ({
        code: t.code,
        user_id: userId,
        name: t.name,
        short: t.short,
        color: t.color,
        custom: t.custom ?? false,
        logo: t.logo ?? null,
        updated_at: now,
      })),
      { onConflict: 'code,user_id' },
    );
  }
  const teamCodes = payload.teams.map((t) => t.code);
  if (teamCodes.length > 0) {
    await db.from('teams').delete().eq('user_id', userId).not('code', 'in', `(${teamCodes})`);
  } else {
    await db.from('teams').delete().eq('user_id', userId);
  }

  // 3. Active tournament + its archived rounds and their matches
  const { hasTournament } = payload.tournament;
  const tournamentId = payload.tournamentId;

  if (hasTournament && tournamentId) {
    await db.from('tournaments').upsert(
      {
        id: tournamentId,
        user_id: userId,
        name: payload.tournament.name,
        ranked: payload.tournament.ranked,
        rounds_target: payload.tournament.roundsTarget,
        player_ids: payload.tournament.playerIds,
        round: payload.tournament.round,
        round_open: payload.tournament.roundOpen,
        round_players: payload.tournament.roundPlayers,
        status: 'active',
        updated_at: now,
      },
      { onConflict: 'id' },
    );

    // Archived rounds
    if (payload.archivedRounds.length > 0) {
      await db.from('rounds').upsert(
        payload.archivedRounds.map((r) => ({
          id: r.id,
          user_id: userId,
          tournament_id: tournamentId,
          n: r.n,
          date: r.date,
          winner: r.winner,
          games: r.games,
          ranked: r.ranked,
          name: r.name,
          player_ids: r.players ?? [],
          status: 'archived',
          updated_at: now,
        })),
        { onConflict: 'id' },
      );
    }

    // Delete archived rounds no longer in local state (matches cascade)
    const archivedRoundIds = payload.archivedRounds.map((r) => r.id);
    if (archivedRoundIds.length > 0) {
      await db
        .from('rounds')
        .delete()
        .eq('user_id', userId)
        .eq('tournament_id', tournamentId)
        .not('id', 'in', `(${archivedRoundIds})`);
    } else {
      await db.from('rounds').delete().eq('user_id', userId).eq('tournament_id', tournamentId);
    }

    // Upsert matches inside archived rounds
    const archivedMatches = payload.archivedRounds.flatMap((r) =>
      r.matches.map((m) => ({ ...m, roundId: r.id })),
    );
    if (archivedMatches.length > 0) {
      await db.from('matches').upsert(
        archivedMatches.map((m) => ({
          id: m.id,
          user_id: userId,
          tournament_id: tournamentId,
          round_id: m.roundId,
          a_id: m.aId,
          b_id: m.bId,
          a_team: m.aTeam,
          b_team: m.bTeam,
          a_score: m.aScore,
          b_score: m.bScore,
          media: m.media ? JSON.stringify(m.media) : null,
          note: m.note ?? null,
          stats_override: m.statsOverride ? JSON.stringify(m.statsOverride) : null,
          updated_at: now,
        })),
        { onConflict: 'id' },
      );
    }
  } else {
    // No active tournament — delete active tournament row (rounds + matches cascade)
    await db.from('tournaments').delete().eq('user_id', userId).eq('status', 'active');
  }

  // 4. Current open round matches (round_id = null)
  if (payload.matches.length > 0) {
    await db.from('matches').upsert(
      payload.matches.map((m) => ({
        id: m.id,
        user_id: userId,
        tournament_id: tournamentId || null,
        round_id: null,
        a_id: m.aId,
        b_id: m.bId,
        a_team: m.aTeam,
        b_team: m.bTeam,
        a_score: m.aScore,
        b_score: m.bScore,
        media: m.media ? JSON.stringify(m.media) : null,
        note: m.note ?? null,
        stats_override: m.statsOverride ? JSON.stringify(m.statsOverride) : null,
        updated_at: now,
      })),
      { onConflict: 'id' },
    );
  }
  const matchIds = payload.matches.map((m) => m.id);
  if (matchIds.length > 0) {
    await db
      .from('matches')
      .delete()
      .eq('user_id', userId)
      .is('round_id', null)
      .not('id', 'in', `(${matchIds})`);
  } else {
    await db.from('matches').delete().eq('user_id', userId).is('round_id', null);
  }

  // 5. Closed tournaments (upsert one by one to ensure tournaments row exists for FK)
  for (const ct of payload.closedTournaments) {
    // Keep a tournaments row (status: closed) so rounds can reference tournaments.id via FK
    await db.from('tournaments').upsert(
      {
        id: ct.id,
        user_id: userId,
        name: ct.name,
        ranked: false,
        rounds_target: ct.rounds.length,
        player_ids: ct.players,
        round: ct.rounds.length,
        round_open: false,
        round_players: [],
        status: 'closed',
        updated_at: now,
      },
      { onConflict: 'id' },
    );

    await db.from('closed_tournaments').upsert(
      {
        id: ct.id,
        user_id: userId,
        name: ct.name,
        date: ct.date,
        champ_id: ct.champId,
        champ_name: ct.champName,
        champ_color: ct.champColor,
        champ_init: ct.champInit,
        player_ids: ct.players,
        updated_at: now,
      },
      { onConflict: 'id' },
    );

    if (ct.rounds.length > 0) {
      await db.from('rounds').upsert(
        ct.rounds.map((r) => ({
          id: r.id,
          user_id: userId,
          tournament_id: ct.id,
          n: r.n,
          date: r.date,
          winner: r.winner,
          games: r.games,
          ranked: r.ranked,
          name: r.name,
          player_ids: r.players ?? [],
          status: 'archived',
          updated_at: now,
        })),
        { onConflict: 'id' },
      );

      const closedMatches = ct.rounds.flatMap((r) =>
        r.matches.map((m) => ({ ...m, roundId: r.id })),
      );
      if (closedMatches.length > 0) {
        await db.from('matches').upsert(
          closedMatches.map((m) => ({
            id: m.id,
            user_id: userId,
            tournament_id: ct.id,
            round_id: m.roundId,
            a_id: m.aId,
            b_id: m.bId,
            a_team: m.aTeam,
            b_team: m.bTeam,
            a_score: m.aScore,
            b_score: m.bScore,
            media: m.media ? JSON.stringify(m.media) : null,
            note: m.note ?? null,
            stats_override: m.statsOverride ? JSON.stringify(m.statsOverride) : null,
            updated_at: now,
          })),
          { onConflict: 'id' },
        );
      }
    }
  }

  // Delete closed tournaments not in local state (rounds + matches cascade via tournaments.id)
  const closedTourIds = payload.closedTournaments.map((t) => t.id);
  if (closedTourIds.length > 0) {
    await db
      .from('closed_tournaments')
      .delete()
      .eq('user_id', userId)
      .not('id', 'in', `(${closedTourIds})`);
    await db
      .from('tournaments')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'closed')
      .not('id', 'in', `(${closedTourIds})`);
  } else {
    await db.from('closed_tournaments').delete().eq('user_id', userId);
    await db.from('tournaments').delete().eq('user_id', userId).eq('status', 'closed');
  }
}

// ---------------------------------------------------------------------------
// Pull — Supabase → local store shape
// ---------------------------------------------------------------------------

export interface PulledState {
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
}

export async function pullState(): Promise<PulledState | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [
    { data: playersData },
    { data: teamsData },
    { data: activeTournamentRows },
    { data: allRounds },
    { data: allMatches },
    { data: closedTourRows },
  ] = await Promise.all([
    db.from('players').select('*').eq('user_id', userId),
    db.from('teams').select('*').eq('user_id', userId),
    db.from('tournaments').select('*').eq('user_id', userId).eq('status', 'active').limit(1),
    db.from('rounds').select('*').eq('user_id', userId),
    db.from('matches').select('*').eq('user_id', userId).order('id', { ascending: true }),
    db.from('closed_tournaments').select('*').eq('user_id', userId),
  ]);

  const activeTournament = ((activeTournamentRows ?? []) as Record<string, unknown>[])[0] ?? null;
  const rounds = (allRounds ?? []) as Record<string, unknown>[];
  const matches = (allMatches ?? []) as Record<string, unknown>[];

  // Index rounds by tournament_id
  const roundsByTournament = new Map<string, Record<string, unknown>[]>();
  for (const r of rounds) {
    const tid = r.tournament_id as string;
    if (!roundsByTournament.has(tid)) roundsByTournament.set(tid, []);
    roundsByTournament.get(tid)!.push(r);
  }

  // Index matches by round_id; collect current-round matches (round_id = null)
  const matchesByRound = new Map<string, Record<string, unknown>[]>();
  const currentRoundMatches: Record<string, unknown>[] = [];
  for (const m of matches) {
    const rid = m.round_id as string | null;
    if (!rid) {
      currentRoundMatches.push(m);
    } else {
      if (!matchesByRound.has(rid)) matchesByRound.set(rid, []);
      matchesByRound.get(rid)!.push(m);
    }
  }

  const buildRound = (r: Record<string, unknown>): ArchivedRound => ({
    id: r.id as string,
    n: r.n as number,
    date: r.date as string,
    winner: r.winner as string,
    games: r.games as number,
    ranked: r.ranked as boolean,
    name: r.name as string,
    players: r.player_ids as string[],
    matches: (matchesByRound.get(r.id as string) ?? []).map(dbMatchToLocal),
  });

  const archivedRounds: ArchivedRound[] = activeTournament
    ? (roundsByTournament.get(activeTournament.id as string) ?? []).map(buildRound)
    : [];

  const closedTournaments: ClosedTournament[] = ((closedTourRows ?? []) as Record<string, unknown>[]).map(
    (ct) => ({
      id: ct.id as string,
      name: ct.name as string,
      date: ct.date as string,
      champId: ct.champ_id as string,
      champName: ct.champ_name as string,
      champColor: ct.champ_color as string,
      champInit: ct.champ_init as string,
      players: ct.player_ids as string[],
      rounds: (roundsByTournament.get(ct.id as string) ?? []).map(buildRound),
    }),
  );

  const tournamentState = activeTournament
    ? {
        tournamentId: activeTournament.id as string,
        hasTournament: true,
        tournamentName: activeTournament.name as string,
        tournamentRanked: activeTournament.ranked as boolean,
        tournamentRounds: activeTournament.rounds_target as number,
        tournamentPlayers: activeTournament.player_ids as string[],
        round: activeTournament.round as number,
        roundOpen: activeTournament.round_open as boolean,
        roundPlayers: activeTournament.round_players as string[],
      }
    : {
        tournamentId: '',
        hasTournament: false,
        tournamentName: '',
        tournamentRanked: true,
        tournamentRounds: 0,
        tournamentPlayers: [],
        round: 0,
        roundOpen: false,
        roundPlayers: [],
      };

  return {
    players: ((playersData ?? []) as Record<string, string>[]).map((p) => ({
      id: p.id,
      name: p.name,
      nick: p.nick ?? undefined,
      color: p.color,
      teamCode: p.team_code,
      photo: p.photo ?? undefined,
    })),
    teams: ((teamsData ?? []) as Record<string, string>[]).map((t) => ({
      code: t.code,
      name: t.name,
      short: t.short,
      color: t.color,
      custom: Boolean(t.custom),
      logo: t.logo ?? undefined,
    })),
    matches: currentRoundMatches.map(dbMatchToLocal),
    archivedRounds,
    closedTournaments,
    ...tournamentState,
  };
}

// ---------------------------------------------------------------------------
// Real-time subscription
// ---------------------------------------------------------------------------

export function subscribeToChanges(userId: string, onUpdate: () => void) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  return db
    .channel(`user-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `user_id=eq.${userId}` }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `user_id=eq.${userId}` }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `user_id=eq.${userId}` }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds', filter: `user_id=eq.${userId}` }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `user_id=eq.${userId}` }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'closed_tournaments', filter: `user_id=eq.${userId}` }, onUpdate)
    .subscribe();
}

// ---------------------------------------------------------------------------
// Fetch single match by ID (for direct deep links)
// ---------------------------------------------------------------------------

export async function fetchMatchById(matchId: string): Promise<Match | null> {
  if (!supabaseConfigured) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (error || !data) return null;
  return dbMatchToLocal(data as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dbMatchToLocal(m: Record<string, unknown>): Match {
  return {
    id: m.id as string,
    aId: m.a_id as string,
    bId: m.b_id as string,
    aTeam: m.a_team as string,
    bTeam: m.b_team as string,
    aScore: m.a_score as number,
    bScore: m.b_score as number,
    media: m.media ? JSON.parse(m.media as string) : undefined,
    note: (m.note as string) ?? undefined,
    statsOverride: m.stats_override ? JSON.parse(m.stats_override as string) : undefined,
  };
}
