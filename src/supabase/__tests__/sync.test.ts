// Direct unit tests for src/supabase/sync.ts — pushState() and pullState().
//
// These functions were previously only exercised indirectly (mocked out
// entirely in useSyncManager.test.ts), so the actual upsert/delete/error
// handling logic had zero test coverage despite being the most destructive
// code in the app (it can delete cloud rows for a user).

jest.mock('../auth', () => ({
  getCurrentUserId: jest.fn(),
}));

import { getCurrentUserId } from '../auth';
import { pushState, pullState, type SyncPayload } from '../sync';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (globalThis as any).__mockSupabaseDb;
  },
  supabaseConfigured: true,
}));

function setMockDb(db: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__mockSupabaseDb = db;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── pushState ───────────────────────────────────────────────────────────────

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
      players: [{ id: 'p1', name: 'Alice', color: '#fff', teamCode: 'JUV' }],
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

  it('wipes ALL of a user\'s cloud players when the local players array is empty', async () => {
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
      matches: { data: null, error: { message: 'insert or update on table "matches" violates foreign key constraint' } },
    });
    setMockDb(db);

    await expect(
      pushState({
        ...basePayload,
        tournamentId: 'tour-1',
        matches: [{ id: 'm1', aId: 'p1', bId: 'p2', aTeam: 'JUV', bTeam: 'ARS', aScore: 1, bScore: 0 }],
      }, new Set(['openMatches'])),
    ).rejects.toThrow(/foreign key constraint/);
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
      players: { data: [{ id: 'p1', name: 'Alice', color: '#fff', team_code: 'JUV' }], error: null },
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
      { id: 'p1', name: 'Alice', nick: undefined, color: '#fff', teamCode: 'JUV', photo: undefined },
    ]);
    expect(result!.hasTournament).toBe(false);
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
