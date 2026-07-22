/**
 * Sync layer — local-first, Supabase as source of truth.
 *
 * Strategy:
 *  - Push: every store mutation calls pushState() → upserts all entities
 *  - Pull: on app start (and on real-time event) calls pullState() → merges into store
 *  - Conflict: last_write_wins via updated_at timestamp
 */

import * as Sentry from '@sentry/react-native';
import { supabase, supabaseConfigured } from './client';
import { getCurrentUserId } from './auth';
import type { Player, Team, Match, ArchivedRound, ClosedTournament } from '../store/types';
import type { StandingsViewMode } from '../store/slices/settingsSlice';
import type { ThemePreference } from '../theme/colors';
import type { Language } from '../i18n';

// ---------------------------------------------------------------------------
// Push — local → Supabase
// ---------------------------------------------------------------------------

export type DirtyTable =
  'players' | 'teams' | 'activeTournament' | 'openMatches' | 'closedTournaments' | 'settings';

export const ALL_DIRTY = new Set<DirtyTable>([
  'players',
  'teams',
  'activeTournament',
  'openMatches',
  'closedTournaments',
  'settings',
]);

export interface SyncedSettings {
  showNick: boolean;
  showTeamLogo: boolean;
  groupByTours: boolean;
  showAvgGoals: boolean;
  standingsViewMode: StandingsViewMode;
  colorScheme: ThemePreference;
  language: Language;
}

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
  settings: SyncedSettings;
}

// Strips locally-in-flight media (still uploading, or a failed upload awaiting
// retry) from a push payload — its `uri` is a device-local file:// path that
// means nothing to any other client, and would otherwise get written to the
// cloud as if it were a real, resolvable URL.
export function stripPendingMedia(matches: Match[]): Match[] {
  return matches.map((m) =>
    m.media?.some((item) => item.pendingUpload)
      ? { ...m, media: m.media!.filter((item) => !item.pendingUpload) }
      : m,
  );
}

// Shape pushState() needs, expressed independently of the Zustand store so
// this module never imports '@/store' — callers (useSyncManager, the backup
// feature) pass in whatever slice of `useStore.getState()` applies.
export interface SyncPayloadSource {
  tournamentId: string;
  players: Player[];
  teams: Team[];
  matches: Match[];
  archivedRounds: ArchivedRound[];
  closedTournaments: ClosedTournament[];
  tournamentName: string;
  tournamentRanked: boolean;
  tournamentRounds: number;
  tournamentPlayers: string[];
  round: number;
  roundOpen: boolean;
  roundPlayers: string[];
  hasTournament: boolean;
  showNick: boolean;
  showTeamLogo: boolean;
  groupByTours: boolean;
  showAvgGoals: boolean;
  standingsViewMode: StandingsViewMode;
  colorScheme: ThemePreference;
  language: Language;
}

export function buildSyncPayload(s: SyncPayloadSource): SyncPayload {
  return {
    tournamentId: s.tournamentId,
    players: s.players,
    teams: s.teams,
    matches: stripPendingMedia(s.matches),
    archivedRounds: s.archivedRounds.map((r) => ({
      ...r,
      matches: stripPendingMedia(r.matches),
    })),
    closedTournaments: s.closedTournaments.map((t) => ({
      ...t,
      rounds: t.rounds.map((r) => ({
        ...r,
        matches: stripPendingMedia(r.matches),
      })),
    })),
    tournament: {
      name: s.tournamentName,
      ranked: s.tournamentRanked,
      roundsTarget: s.tournamentRounds,
      playerIds: s.tournamentPlayers,
      round: s.round,
      roundOpen: s.roundOpen,
      roundPlayers: s.roundPlayers,
      hasTournament: s.hasTournament,
    },
    settings: {
      showNick: s.showNick,
      showTeamLogo: s.showTeamLogo,
      groupByTours: s.groupByTours,
      showAvgGoals: s.showAvgGoals,
      standingsViewMode: s.standingsViewMode,
      colorScheme: s.colorScheme,
      language: s.language,
    },
  };
}

// Every upsert/delete below used to be a bare `await db.from(...)...` — the
// Supabase client resolves query errors (auth, RLS, FK violations, etc.) as
// `{ data: null, error }` rather than a rejected promise, so those failures
// were silently swallowed. runPush() (useSyncManager) only detects a failed
// push via a thrown exception; a swallowed error looked identical to
// success, cleared the dirty flag, and the next pull then overwrote local
// state with cloud data that never actually received the write — e.g. a
// match added while offline, once the app reconnects, its (silently failed)
// push looks "done" and the following pull makes it vanish locally too.
// exec() surfaces these the same way pullState() already does.
async function exec(
  query: PromiseLike<{ error: { message?: string; code?: string } | null }>,
): Promise<void> {
  const { error } = await query;
  if (error) {
    throw new Error(`pushState: ${error.message ?? error.code ?? 'unknown error'}`);
  }
}

export async function pushState(
  payload: SyncPayload,
  dirty: Set<DirtyTable> = ALL_DIRTY,
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  console.log('[sync] pushing dirty:', [...dirty]);

  const now = new Date().toISOString();
  const db = supabase;

  // 1. Players
  if (dirty.has('players')) {
    if (payload.players.length > 0) {
      await exec(
        db.from('players').upsert(
          payload.players.map((p) => ({
            id: p.id,
            user_id: userId,
            name: p.name,
            nick: p.nick ?? null,
            team_code: p.teamCode,
            photo: p.photo ?? null,
            updated_at: now,
          })),
          { onConflict: 'id,user_id' },
        ),
      );
    }
    const playerIds = payload.players.map((p) => p.id);
    if (playerIds.length > 0) {
      await exec(
        db.from('players').delete().eq('user_id', userId).not('id', 'in', `(${playerIds})`),
      );
    } else {
      await exec(db.from('players').delete().eq('user_id', userId));
    }
  }

  // 2. Teams
  if (dirty.has('teams')) {
    if (payload.teams.length > 0) {
      await exec(
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
      );
    }
    const teamCodes = payload.teams.map((t) => t.code);
    if (teamCodes.length > 0) {
      await exec(
        db.from('teams').delete().eq('user_id', userId).not('code', 'in', `(${teamCodes})`),
      );
    } else {
      await exec(db.from('teams').delete().eq('user_id', userId));
    }
  }

  // 3. Active tournament + its archived rounds and their matches
  const { hasTournament } = payload.tournament;
  const tournamentId = payload.tournamentId;

  if (dirty.has('activeTournament'))
    if (hasTournament && tournamentId) {
      await exec(
        db.from('tournaments').upsert(
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
        ),
      );

      // Archived rounds
      if (payload.archivedRounds.length > 0) {
        await exec(
          db.from('rounds').upsert(
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
              // Omitted (undefined) for legacy rounds with no local shareId
              // yet — JSON.stringify drops undefined keys, so the column is
              // left untouched (existing DB value, backfilled by the
              // migration) rather than being overwritten with null.
              share_id: r.shareId,
              updated_at: now,
            })),
            { onConflict: 'id' },
          ),
        );
      }

      // Delete archived rounds no longer in local state (matches cascade)
      const archivedRoundIds = payload.archivedRounds.map((r) => r.id);
      if (archivedRoundIds.length > 0) {
        await exec(
          db
            .from('rounds')
            .delete()
            .eq('user_id', userId)
            .eq('tournament_id', tournamentId)
            .not('id', 'in', `(${archivedRoundIds})`),
        );
      } else {
        await exec(
          db.from('rounds').delete().eq('user_id', userId).eq('tournament_id', tournamentId),
        );
      }

      // Upsert matches inside archived rounds. `position` is each match's
      // index within its OWN round's array — computed before flattening, so
      // reordering one round doesn't shift positions in another.
      const archivedMatches = payload.archivedRounds.flatMap((r) =>
        r.matches.map((m, idx) => ({ ...m, roundId: r.id, position: idx })),
      );
      if (archivedMatches.length > 0) {
        await exec(
          db.from('matches').upsert(
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
              position: m.position,
              updated_at: now,
            })),
            { onConflict: 'id' },
          ),
        );
      }
    } else {
      // No active tournament — delete active tournament row (rounds + matches cascade)
      await exec(db.from('tournaments').delete().eq('user_id', userId).eq('status', 'active'));
    }

  // 4. Current open round matches (round_id = null)
  if (dirty.has('openMatches')) {
    if (payload.matches.length > 0) {
      await exec(
        db.from('matches').upsert(
          payload.matches.map((m, idx) => ({
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
            position: idx,
            updated_at: now,
          })),
          { onConflict: 'id' },
        ),
      );
    }
    const matchIds = payload.matches.map((m) => m.id);
    if (matchIds.length > 0) {
      await exec(
        db
          .from('matches')
          .delete()
          .eq('user_id', userId)
          .is('round_id', null)
          .not('id', 'in', `(${matchIds})`),
      );
    } else {
      await exec(db.from('matches').delete().eq('user_id', userId).is('round_id', null));
    }
  }

  // 5. Closed tournaments (upsert one by one to ensure tournaments row exists for FK)
  if (dirty.has('closedTournaments')) {
    for (const ct of payload.closedTournaments) {
      // Keep a tournaments row (status: closed) so rounds can reference tournaments.id via FK
      await exec(
        db.from('tournaments').upsert(
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
        ),
      );

      await exec(
        db.from('closed_tournaments').upsert(
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
        ),
      );

      if (ct.rounds.length > 0) {
        await exec(
          db.from('rounds').upsert(
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
              share_id: r.shareId,
              updated_at: now,
            })),
            { onConflict: 'id' },
          ),
        );

        const closedMatches = ct.rounds.flatMap((r) =>
          r.matches.map((m, idx) => ({ ...m, roundId: r.id, position: idx })),
        );
        if (closedMatches.length > 0) {
          await exec(
            db.from('matches').upsert(
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
                position: m.position,
                updated_at: now,
              })),
              { onConflict: 'id' },
            ),
          );
        }
      }
    }

    // Delete closed tournaments not in local state (rounds + matches cascade via tournaments.id)
    const closedTourIds = payload.closedTournaments.map((t) => t.id);
    if (closedTourIds.length > 0) {
      await exec(
        db
          .from('closed_tournaments')
          .delete()
          .eq('user_id', userId)
          .not('id', 'in', `(${closedTourIds})`),
      );
      await exec(
        db
          .from('tournaments')
          .delete()
          .eq('user_id', userId)
          .eq('status', 'closed')
          .not('id', 'in', `(${closedTourIds})`),
      );
    } else {
      await exec(db.from('closed_tournaments').delete().eq('user_id', userId));
      await exec(db.from('tournaments').delete().eq('user_id', userId).eq('status', 'closed'));
    }
  }

  // 6. User settings (display preferences — account-scoped, see #81). Always
  // exactly one row per user, so a plain upsert with no delete-by-absence
  // step is enough — there's nothing to orphan.
  if (dirty.has('settings')) {
    await exec(
      db.from('user_settings').upsert(
        {
          user_id: userId,
          show_nick: payload.settings.showNick,
          show_team_logo: payload.settings.showTeamLogo,
          group_by_tours: payload.settings.groupByTours,
          show_avg_goals: payload.settings.showAvgGoals,
          standings_view_mode: payload.settings.standingsViewMode,
          color_scheme: payload.settings.colorScheme,
          language: payload.settings.language,
          updated_at: now,
        },
        { onConflict: 'user_id' },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Explicit full wipe — "Reset All Data" (Settings → Danger zone) only.
//
// Deliberately NOT routed through pushState()'s dirty-diff mechanism: that
// mechanism deletes any cloud row missing from the current local payload as
// a side effect of a normal edit, which is exactly what turned an unrelated
// local-state wipe (sign-out's cache clear) into a real production data-loss
// incident (2026-07-06) — a debounced push fired with an emptied payload and
// deleted every table for the user. Cloud deletion this destructive must
// only ever happen via one explicit, directly-called function, never as an
// incidental consequence of some other local state change.
// ---------------------------------------------------------------------------

// Explicit, standalone full push — used by the local-backup "Push to Cloud"
// action. Deliberately bypasses useSyncManager's debounce/dirty-tracking
// entirely: that mechanism is for reacting to incremental local edits, not
// for "the user just restored a backup and wants to deliberately overwrite
// Supabase with it." Same principle as deleteAllCloudData() above — a
// full-replace cloud action must be one explicit, directly-called function.
export async function pushAllTables(payload: SyncPayload): Promise<void> {
  await pushState(payload, ALL_DIRTY);
}

export async function deleteAllCloudData(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const db = supabase;
  await exec(db.from('players').delete().eq('user_id', userId));
  await exec(db.from('teams').delete().eq('user_id', userId));
  await exec(db.from('closed_tournaments').delete().eq('user_id', userId));
  // Deletes both active and closed tournament rows; rounds/matches cascade
  // via FK (see supabase/migrations/001_initial_schema.sql).
  await exec(db.from('tournaments').delete().eq('user_id', userId));
  // Without this, resetStore()'s local reset-to-defaults for display
  // preferences (see store/index.ts) would get silently overwritten again
  // by the next pull, since the stale cloud row would still exist (#81).
  await exec(db.from('user_settings').delete().eq('user_id', userId));
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
  // null when this account has no synced settings row yet (fresh account, or
  // an existing account's first pull after #81 shipped).
  settings: SyncedSettings | null;
}

export async function pullState(): Promise<PulledState | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const db = supabase;

  const results = await Promise.all([
    db.from('players').select('*').eq('user_id', userId),
    db.from('teams').select('*').eq('user_id', userId),
    db.from('tournaments').select('*').eq('user_id', userId).eq('status', 'active').limit(1),
    db.from('rounds').select('*').eq('user_id', userId).order('n', { ascending: true }),
    db
      .from('matches')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })
      .order('id', { ascending: true }),
    db
      .from('closed_tournaments')
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: true }),
    db.from('user_settings').select('*').eq('user_id', userId).limit(1),
  ]);

  // A failed query (network blip, RLS error, etc.) must NOT be treated as
  // "the cloud has no data" — that would make the caller apply an empty
  // state over real local data, and could later push that emptiness back
  // up and delete real cloud rows. Surface failures by throwing instead.
  const failed = results.find((r) => r.error);
  if (failed) {
    throw new Error(`pullState: query failed — ${failed.error?.message ?? 'unknown error'}`);
  }

  const [
    { data: playersData },
    { data: teamsData },
    { data: activeTournamentRows },
    { data: allRounds },
    { data: allMatches },
    { data: closedTourRows },
    { data: settingsRows },
  ] = results;

  const settingsRow = ((settingsRows ?? []) as Record<string, unknown>[])[0] ?? null;

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
    shareId: r.share_id as string | undefined,
  });

  const archivedRounds: ArchivedRound[] = activeTournament
    ? (roundsByTournament.get(activeTournament.id as string) ?? []).map(buildRound)
    : [];

  const closedTournaments: ClosedTournament[] = (
    (closedTourRows ?? []) as Record<string, unknown>[]
  ).map((ct) => ({
    id: ct.id as string,
    name: ct.name as string,
    date: ct.date as string,
    champId: ct.champ_id as string,
    champName: ct.champ_name as string,
    champColor: ct.champ_color as string,
    champInit: ct.champ_init as string,
    players: ct.player_ids as string[],
    rounds: (roundsByTournament.get(ct.id as string) ?? []).map(buildRound),
  }));

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
      teamCode: p.team_code,
      photo: p.photo ?? undefined,
    })),
    teams: ((teamsData ?? []) as Record<string, unknown>[]).map((t) => ({
      code: t.code as string,
      name: t.name as string,
      short: t.short as string,
      color: t.color as string,
      custom: Boolean(t.custom),
      logo: (t.logo as string | null) ?? undefined,
    })),
    matches: currentRoundMatches.map(dbMatchToLocal),
    archivedRounds,
    closedTournaments,
    ...tournamentState,
    settings: settingsRow
      ? {
          showNick: Boolean(settingsRow.show_nick),
          showTeamLogo: Boolean(settingsRow.show_team_logo),
          groupByTours: Boolean(settingsRow.group_by_tours),
          showAvgGoals: Boolean(settingsRow.show_avg_goals),
          standingsViewMode: settingsRow.standings_view_mode as StandingsViewMode,
          colorScheme: settingsRow.color_scheme as ThemePreference,
          language: settingsRow.language as Language,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Real-time subscription
// ---------------------------------------------------------------------------

export function subscribeToChanges(userId: string, onUpdate: () => void) {
  const db = supabase;
  return db
    .channel(`user-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'players', filter: `user_id=eq.${userId}` },
      onUpdate,
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'teams', filter: `user_id=eq.${userId}` },
      onUpdate,
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matches', filter: `user_id=eq.${userId}` },
      onUpdate,
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rounds', filter: `user_id=eq.${userId}` },
      onUpdate,
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tournaments', filter: `user_id=eq.${userId}` },
      onUpdate,
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'closed_tournaments', filter: `user_id=eq.${userId}` },
      onUpdate,
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'user_settings', filter: `user_id=eq.${userId}` },
      onUpdate,
    )
    .subscribe();
}

// ---------------------------------------------------------------------------
// Fetch single match by ID (for direct deep links)
// ---------------------------------------------------------------------------

export async function fetchMatchById(matchId: string): Promise<Match | null> {
  if (!supabaseConfigured) return null;
  const db = supabase;
  const { data, error } = await db.from('matches').select('*').eq('id', matchId).single();

  if (error || !data) return null;
  return dbMatchToLocal(data as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tryParseJson<T>(raw: string): T | undefined {
  try {
    return JSON.parse(raw) as T;
  } catch {
    console.warn('[sync] malformed JSON, skipping field:', raw.slice(0, 80));
    Sentry.captureMessage('sync: malformed JSON field', {
      level: 'warning',
      extra: { raw: raw.slice(0, 200) },
    });
    return undefined;
  }
}

function dbMatchToLocal(m: Record<string, unknown>): Match {
  return {
    id: m.id as string,
    aId: m.a_id as string,
    bId: m.b_id as string,
    aTeam: m.a_team as string,
    bTeam: m.b_team as string,
    aScore: m.a_score as number,
    bScore: m.b_score as number,
    media: m.media ? tryParseJson(m.media as string) : undefined,
    note: (m.note as string) ?? undefined,
    statsOverride: m.stats_override ? tryParseJson(m.stats_override as string) : undefined,
  };
}
