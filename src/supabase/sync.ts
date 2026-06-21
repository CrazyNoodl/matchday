/**
 * Sync layer — local-first, Supabase as source of truth.
 *
 * Strategy:
 *  - Push: every store mutation calls pushState() → upserts all entities
 *  - Pull: on app start (and on real-time event) calls pullState() → merges into store
 *  - Conflict: last_write_wins via updated_at timestamp
 */

import { supabase } from './client';
import { getCurrentUserId } from './auth';
import type { Player, Team, Match, ArchivedRound, ClosedTournament } from '../store/types';

// ---------------------------------------------------------------------------
// Push — local → Supabase
// ---------------------------------------------------------------------------

export interface SyncPayload {
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

  await Promise.all([
    // Players
    db.from('players').upsert(
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
      { onConflict: 'id' },
    ),

    // Teams
    db.from('teams').upsert(
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
    ),

    // Active matches
    db.from('matches').upsert(
      payload.matches.map((m) => ({
        id: m.id,
        user_id: userId,
        tournament_id: null,
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
    ),
  ]);
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
}

export async function pullState(): Promise<PulledState | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [
    { data: players },
    { data: teams },
    { data: matches },
  ] = await Promise.all([
    db.from('players').select('*').eq('user_id', userId),
    db.from('teams').select('*').eq('user_id', userId),
    db.from('matches').select('*').eq('user_id', userId).is('round_id', null),
  ]);

  return {
    players: ((players ?? []) as Record<string, string>[]).map((p) => ({
      id: p.id,
      name: p.name,
      nick: p.nick ?? undefined,
      color: p.color,
      teamCode: p.team_code,
      photo: p.photo ?? undefined,
    })),
    teams: ((teams ?? []) as Record<string, string>[]).map((t) => ({
      code: t.code,
      name: t.name,
      short: t.short,
      color: t.color,
      custom: Boolean(t.custom),
      logo: t.logo ?? undefined,
    })),
    matches: (matches ?? []).map(dbMatchToLocal),
    archivedRounds: [],     // TODO: pull rounds in next iteration
    closedTournaments: [],  // TODO: pull closed tournaments in next iteration
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
    .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `user_id=eq.${userId}` }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `user_id=eq.${userId}` }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `user_id=eq.${userId}` }, onUpdate)
    .subscribe();
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
