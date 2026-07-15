// Direct unit tests for src/supabase/sync.ts — pushState() and pullState().
//
// These functions were previously only exercised indirectly (mocked out
// entirely in useSyncManager.test.ts), so the actual upsert/delete/error
// handling logic had zero test coverage despite being the most destructive
// code in the app (it can delete cloud rows for a user).

import { getCurrentUserId } from '../auth';
import {
  pushState,
  pullState,
  deleteAllCloudData,
  buildSyncPayload,
  pushAllTables,
  type SyncPayload,
} from '../sync';

jest.mock('../auth', () => ({
  getCurrentUserId: jest.fn(),
}));

const mockGetCurrentUserId = getCurrentUserId as jest.MockedFunction<typeof getCurrentUserId>;

// ---------------------------------------------------------------------------
// Mock Supabase query builder
//
// Every chain method (select/eq/not/order/limit/upsert/delete) returns the
// same thenable object, so `await db.from(table).upsert(...)` and
// `await db.from(table).delete().eq(...).not(...)` both resolve to a
// configurable { data, error } result. Each call is recorded so tests can
// assert on what was sent to which table/method.
// ---------------------------------------------------------------------------

interface RecordedCall {
  table: string;
  method: string;
  args: unknown[];
}

function buildMockDb(resultsByTable: Record<string, { data?: unknown; error?: unknown }> = {}) {
  const calls: RecordedCall[] = [];

  function makeChain(table: string) {
    const result = resultsByTable[table] ?? { data: [], error: null };
    const chain: Record<string, unknown> = {
      then: (resolve: (v: unknown) => void) => resolve(result),
    };
    for (const method of ['select', 'eq', 'not', 'order', 'limit', 'is']) {
      chain[method] = (...args: unknown[]) => {
        calls.push({ table, method, args });
        return chain;
      };
    }
    for (const method of ['upsert', 'delete']) {
      chain[method] = (...args: unknown[]) => {
        calls.push({ table, method, args });
        return chain;
      };
    }
    return chain;
  }

  const db = {
    from: jest.fn((table: string) => makeChain(table)),
  };

  return { db, calls };
}

jest.mock('../client', () => ({
  get supabase() {
    return (globalThis as any).__mockSupabaseDb;
  },
  supabaseConfigured: true,
}));

function setMockDb(db: unknown) {
  (globalThis as any).__mockSupabaseDb = db;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── pushState ───────────────────────────────────────────────────────────────

const BASE_SETTINGS: SyncPayload['settings'] = {
  showNick: true,
  showTeamLogo: true,
  groupByTours: true,
  showAvgGoals: true,
  standingsViewMode: 'table',
  colorScheme: 'dark',
  language: 'en',
};

describe('pushState', () => {
  const basePayload: SyncPayload = {
    tournamentId: '',
    players: [],
    teams: [],
    matches: [],
    archivedRounds: [],
    closedTournaments: [],
    tournament: {
      name: '',
      ranked: true,
      roundsTarget: 0,
      playerIds: [],
      round: 0,
      roundOpen: false,
      roundPlayers: [],
      hasTournament: false,
    },
    settings: BASE_SETTINGS,
  };

  it('does nothing when there is no signed-in user', async () => {
    mockGetCurrentUserId.mockResolvedValue(null);
    const { db, calls } = buildMockDb();
    setMockDb(db);

    await pushState(basePayload);

    expect(calls).toHaveLength(0);
  });

  it('upserts players and deletes-by-absence using the local id list', async () => {
    mockGetCurrentUserId.mockResolvedValue('user-1');
    const { db, calls } = buildMockDb();
    setMockDb(db);

    await pushState({
      ...basePayload,
      players: [{ id: 'p1', name: 'Alice', teamCode: 'JUV' }],
    });

    const playerUpsert = calls.find((c) => c.table === 'players' && c.method === 'upsert');
    expect(playerUpsert).toBeDefined();
    expect(playerUpsert!.args[0]).toEqual([
      expect.objectContaining({ id: 'p1', user_id: 'user-1', name: 'Alice' }),
    ]);

    // Delete-by-absence must scope to this user and exclude the kept id.
    const playerDeleteNot = calls.find((c) => c.table === 'players' && c.method === 'not');
    expect(playerDeleteNot).toBeDefined();
    expect(playerDeleteNot!.args).toEqual(['id', 'in', '(p1)']);
  });

  it("wipes ALL of a user's cloud players when the local players array is empty", async () => {
    // This is intentional behavior (user deleted every player locally), but it
    // is also the most destructive path in pushState: if the local array is
    // empty for the WRONG reason (e.g. state never finished loading), this is
    // exactly the code path that would silently delete real cloud data.
    // Asserting on it explicitly so any change to this behavior is deliberate.
    mockGetCurrentUserId.mockResolvedValue('user-1');
    const { db, calls } = buildMockDb();
    setMockDb(db);

    await pushState({ ...basePayload, players: [] });

    const deleteCalls = calls.filter((c) => c.table === 'players' && c.method === 'delete');
    expect(deleteCalls).toHaveLength(1);
    // No `.not('id', 'in', ...)` filter — every row for this user is deleted.
    const notCalls = calls.filter((c) => c.table === 'players' && c.method === 'not');
    expect(notCalls).toHaveLength(0);
    const eqCalls = calls.filter((c) => c.table === 'players' && c.method === 'eq');
    expect(eqCalls.some((c) => c.args[0] === 'user_id' && c.args[1] === 'user-1')).toBe(true);
  });

  it('deletes the active tournament row when hasTournament is false', async () => {
    mockGetCurrentUserId.mockResolvedValue('user-1');
    const { db, calls } = buildMockDb();
    setMockDb(db);

    await pushState(basePayload);

    const tournamentDelete = calls.find((c) => c.table === 'tournaments' && c.method === 'delete');
    expect(tournamentDelete).toBeDefined();
  });

  it('throws instead of silently succeeding when a table write errors', async () => {
    // Regression test: every upsert/delete used to be a bare `await`, ignoring
    // Supabase's `{ data: null, error }` result (query errors — auth, RLS, FK
    // violations — resolve rather than reject). useSyncManager's runPush()
    // only detects failure via a thrown exception, so a swallowed error
    // looked identical to success: the dirty flag got cleared, and the next
    // pull then overwrote local state with cloud data that never actually
    // received the write. In practice: add a match while offline, reconnect
    // — its push "succeeds" without writing anything, and the match vanishes
    // on the very next pull.
    mockGetCurrentUserId.mockResolvedValue('user-1');
    const { db } = buildMockDb({
      matches: {
        data: null,
        error: { message: 'insert or update on table "matches" violates foreign key constraint' },
      },
    });
    setMockDb(db);

    await expect(
      pushState(
        {
          ...basePayload,
          tournamentId: 'tour-1',
          matches: [
            { id: 'm1', aId: 'p1', bId: 'p2', aTeam: 'JUV', bTeam: 'ARS', aScore: 1, bScore: 0 },
          ],
        },
        new Set(['openMatches']),
      ),
    ).rejects.toThrow(/foreign key constraint/);
  });

  it('upserts user_settings only when settings is in the dirty set', async () => {
    mockGetCurrentUserId.mockResolvedValue('user-1');
    const { db, calls } = buildMockDb();
    setMockDb(db);

    await pushState(
      { ...basePayload, settings: { ...BASE_SETTINGS, language: 'uk', colorScheme: 'light' } },
      new Set(['settings']),
    );

    const settingsUpsert = calls.find((c) => c.table === 'user_settings' && c.method === 'upsert');
    expect(settingsUpsert).toBeDefined();
    expect(settingsUpsert!.args[0]).toEqual(
      expect.objectContaining({
        user_id: 'user-1',
        language: 'uk',
        color_scheme: 'light',
      }),
    );

    mockGetCurrentUserId.mockResolvedValue('user-1');
    const { db: db2, calls: calls2 } = buildMockDb();
    setMockDb(db2);
    await pushState(basePayload, new Set(['players']));
    expect(calls2.some((c) => c.table === 'user_settings')).toBe(false);
  });
});

// ─── deleteAllCloudData ──────────────────────────────────────────────────────

describe('deleteAllCloudData', () => {
  it('does nothing when there is no signed-in user', async () => {
    mockGetCurrentUserId.mockResolvedValue(null);
    const { db, calls } = buildMockDb();
    setMockDb(db);

    await deleteAllCloudData();

    expect(calls).toHaveLength(0);
  });

  it('deletes players, teams, closed_tournaments, tournaments and user_settings scoped to the user, with no survivor filter', async () => {
    mockGetCurrentUserId.mockResolvedValue('user-1');
    const { db, calls } = buildMockDb();
    setMockDb(db);

    await deleteAllCloudData();

    for (const table of ['players', 'teams', 'closed_tournaments', 'tournaments', 'user_settings']) {
      const del = calls.find((c) => c.table === table && c.method === 'delete');
      expect(del).toBeDefined();
      const eq = calls.find((c) => c.table === table && c.method === 'eq');
      expect(eq!.args).toEqual(['user_id', 'user-1']);
      // No `.not(...)` survivor filter on any table — this is a full wipe.
      expect(calls.some((c) => c.table === table && c.method === 'not')).toBe(false);
    }
  });

  it('throws instead of silently succeeding when a table delete errors', async () => {
    mockGetCurrentUserId.mockResolvedValue('user-1');
    const { db } = buildMockDb({
      teams: { data: null, error: { message: 'network error' } },
    });
    setMockDb(db);

    await expect(deleteAllCloudData()).rejects.toThrow(/network error/);
  });
});

// ─── buildSyncPayload ────────────────────────────────────────────────────────

describe('buildSyncPayload', () => {
  it('applies stripPendingMedia to matches at every nesting level and maps the tournament sub-object', () => {
    const pendingMedia = { uri: 'file:///tmp/x.jpg', type: 'image' as const, pendingUpload: true };
    const keptMedia = { uri: 'https://cdn/x.jpg', type: 'image' as const };
    const matchWithMedia = (id: string) => ({
      id,
      aId: 'p1',
      bId: 'p2',
      aTeam: 'JUV',
      bTeam: 'ARS',
      aScore: 1,
      bScore: 0,
      media: [pendingMedia, keptMedia],
    });

    const payload = buildSyncPayload({
      tournamentId: 'tour-1',
      players: [],
      teams: [],
      matches: [matchWithMedia('m1')],
      archivedRounds: [
        {
          id: 'r1',
          n: 1,
          date: '',
          winner: '',
          games: 1,
          ranked: true,
          name: '',
          matches: [matchWithMedia('m2')],
        },
      ],
      closedTournaments: [
        {
          id: 'ct1',
          name: '',
          date: '',
          champId: '',
          champName: '',
          champColor: '',
          champInit: '',
          players: [],
          rounds: [
            {
              id: 'r2',
              n: 1,
              date: '',
              winner: '',
              games: 1,
              ranked: true,
              name: '',
              matches: [matchWithMedia('m3')],
            },
          ],
        },
      ],
      tournamentName: 'Cup',
      tournamentRanked: true,
      tournamentRounds: 3,
      tournamentPlayers: [],
      round: 1,
      roundOpen: true,
      roundPlayers: [],
      hasTournament: true,
      showNick: false,
      showTeamLogo: true,
      groupByTours: false,
      showAvgGoals: true,
      standingsViewMode: 'cards',
      colorScheme: 'light',
      language: 'uk',
    });

    expect(payload.matches[0].media).toEqual([keptMedia]);
    expect(payload.archivedRounds[0].matches[0].media).toEqual([keptMedia]);
    expect(payload.closedTournaments[0].rounds[0].matches[0].media).toEqual([keptMedia]);
    expect(payload.tournament).toEqual({
      name: 'Cup',
      ranked: true,
      roundsTarget: 3,
      playerIds: [],
      round: 1,
      roundOpen: true,
      roundPlayers: [],
      hasTournament: true,
    });
    expect(payload.settings).toEqual({
      showNick: false,
      showTeamLogo: true,
      groupByTours: false,
      showAvgGoals: true,
      standingsViewMode: 'cards',
      colorScheme: 'light',
      language: 'uk',
    });
  });
});

// ─── pushAllTables ───────────────────────────────────────────────────────────

describe('pushAllTables', () => {
  it('pushes every table group regardless of what changed', async () => {
    mockGetCurrentUserId.mockResolvedValue('user-1');
    const { db, calls } = buildMockDb();
    setMockDb(db);

    await pushAllTables({
      tournamentId: '',
      players: [{ id: 'p1', name: 'Alice', teamCode: 'JUV' }],
      teams: [{ code: 'JUV', name: 'Juventus', short: 'JUV', color: '#000' }],
      matches: [],
      archivedRounds: [],
      closedTournaments: [],
      tournament: {
        name: '',
        ranked: true,
        roundsTarget: 0,
        playerIds: [],
        round: 0,
        roundOpen: false,
        roundPlayers: [],
        hasTournament: false,
      },
      settings: BASE_SETTINGS,
    });

    expect(calls.some((c) => c.table === 'players' && c.method === 'upsert')).toBe(true);
    expect(calls.some((c) => c.table === 'teams' && c.method === 'upsert')).toBe(true);
    expect(calls.some((c) => c.table === 'tournaments' && c.method === 'delete')).toBe(true);
    expect(calls.some((c) => c.table === 'user_settings' && c.method === 'upsert')).toBe(true);
  });
});

// ─── pullState ───────────────────────────────────────────────────────────────

describe('pullState', () => {
  it('returns null when there is no signed-in user', async () => {
    mockGetCurrentUserId.mockResolvedValue(null);
    const { db } = buildMockDb();
    setMockDb(db);

    expect(await pullState()).toBeNull();
  });

  it('assembles players/teams/closed tournaments from successful queries', async () => {
    mockGetCurrentUserId.mockResolvedValue('user-1');
    const { db } = buildMockDb({
      players: {
        data: [{ id: 'p1', name: 'Alice', team_code: 'JUV' }],
        error: null,
      },
      teams: { data: [], error: null },
      tournaments: { data: [], error: null },
      rounds: { data: [], error: null },
      matches: { data: [], error: null },
      closed_tournaments: { data: [], error: null },
    });
    setMockDb(db);

    const result = await pullState();

    expect(result).not.toBeNull();
    expect(result!.players).toEqual([
      {
        id: 'p1',
        name: 'Alice',
        nick: undefined,
        teamCode: 'JUV',
        photo: undefined,
      },
    ]);
    expect(result!.hasTournament).toBe(false);
    expect(result!.settings).toBeNull();
  });

  it('maps a user_settings row when one exists (#81)', async () => {
    mockGetCurrentUserId.mockResolvedValue('user-1');
    const { db } = buildMockDb({
      players: { data: [], error: null },
      teams: { data: [], error: null },
      tournaments: { data: [], error: null },
      rounds: { data: [], error: null },
      matches: { data: [], error: null },
      closed_tournaments: { data: [], error: null },
      user_settings: {
        data: [
          {
            user_id: 'user-1',
            show_nick: false,
            show_team_logo: true,
            group_by_tours: false,
            show_avg_goals: true,
            standings_view_mode: 'cards',
            color_scheme: 'light',
            language: 'uk',
          },
        ],
        error: null,
      },
    });
    setMockDb(db);

    const result = await pullState();

    expect(result!.settings).toEqual({
      showNick: false,
      showTeamLogo: true,
      groupByTours: false,
      showAvgGoals: true,
      standingsViewMode: 'cards',
      colorScheme: 'light',
      language: 'uk',
    });
  });

  it('throws instead of silently returning an empty state when a query errors', async () => {
    // Regression test: a failed query used to be swallowed via `data ?? []`,
    // making a network blip look identical to "the cloud is genuinely empty".
    // The caller (useSyncManager) uses that signal to decide whether to wipe
    // local state and/or bootstrap-push — so silently treating errors as
    // "empty" risked real data loss. pullState must surface the failure.
    mockGetCurrentUserId.mockResolvedValue('user-1');
    const { db } = buildMockDb({
      players: { data: null, error: { message: 'network error' } },
      teams: { data: [], error: null },
      tournaments: { data: [], error: null },
      rounds: { data: [], error: null },
      matches: { data: [], error: null },
      closed_tournaments: { data: [], error: null },
    });
    setMockDb(db);

    await expect(pullState()).rejects.toThrow(/network error/);
  });
});
