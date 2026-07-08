/**
 * Regression test for a race: useSyncManager's store-subscribe listener used
 * to (re)schedule a debounced runPush() on every qualifying edit without
 * checking whether a push was already in flight. Two edits made more than
 * PUSH_DEBOUNCE_MS apart (realistic: filling out an "add match" form takes
 * longer than 300ms) each got their own runPush() call, and nothing stopped
 * them from overlapping if the first was slow to settle (e.g. offline).
 *
 * pushState()'s 'openMatches' section is "upsert current list + delete any
 * cloud row absent from that list" — a delete-by-absence. If an EARLIER
 * runPush() (captured a smaller/staler matches array) finished its network
 * round-trip AFTER a LATER runPush() (captured a bigger/fresher array) had
 * already landed, the earlier call's delete-by-absence removed the newer
 * match from the cloud — even though it was already successfully synced.
 *
 * Fix: a debounce that settles while pushingRef.current is true no longer
 * starts a second overlapping push — it defers (pushQueuedRef) until the
 * in-flight push's finally() runs, then fires a single follow-up push with a
 * fresh state snapshot that includes every edit made in between. This test
 * verifies that deferral: match A's push starts and is held; match B is
 * added and its debounce settles while A is still in flight — this must NOT
 * produce a second held call. Only once push A's held calls resolve does the
 * follow-up push fire, and its payload must include both matches.
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useStore } from '../../store';
import { useSyncManager } from '../useSyncManager';
import type { Match } from '../../store/types';

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: () => null,
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

let mockIsOnline = true;
jest.mock('@/hooks/useIsOnline', () => ({
  useIsOnline: () => mockIsOnline,
}));

jest.mock('../auth', () => ({
  getCurrentUserId: jest.fn().mockResolvedValue('test-user-id'),
}));

// ---------------------------------------------------------------------------
// Stateful fake Supabase client, same shape as
// useSyncManager.offlineMatchLoss.test.ts, but 'matches' table calls can be
// deliberately held open (deferred) so the test controls completion order.
// ---------------------------------------------------------------------------
type Row = Record<string, unknown>;
const tables: Record<string, Map<string, Row>> = {
  players: new Map(),
  teams: new Map(),
  tournaments: new Map(),
  rounds: new Map(),
  matches: new Map(),
  closed_tournaments: new Map(),
};

// FIFO of held 'matches' table calls — each entry can be resolved on demand,
// out of arrival order, to simulate a stale request finishing late.
type Deferred = { resolve: () => void; op: 'upsert' | 'delete'; upsertRows: Row[]; deleteIds: string[] };
let heldMatchesCalls: Deferred[] = [];
let holdMatchesCalls = false;

function keyFor(table: string, row: Row): string {
  return table === 'teams' ? (row.code as string) : (row.id as string);
}

function parseInList(raw: string): string[] {
  return raw.replace(/^\(|\)$/g, '').split(',').filter(Boolean);
}

function mockMakeChain(table: string) {
  let op: 'select' | 'delete' | 'upsert' | null = null;
  let upsertRows: Row[] = [];
  let rows: [string, Row][] = [];
  let limitN: number | null = null;

  const chain: Record<string, unknown> = {
    select: () => { op = 'select'; rows = Array.from(tables[table].entries()); return chain; },
    delete: () => { op = 'delete'; rows = Array.from(tables[table].entries()); return chain; },
    upsert: (payload: Row | Row[]) => {
      op = 'upsert';
      upsertRows = Array.isArray(payload) ? payload : [payload];
      return chain;
    },
    eq: (field: string, val: unknown) => {
      rows = rows.filter(([, r]) => r[field] === val);
      return chain;
    },
    is: (field: string, val: null) => {
      rows = rows.filter(([, r]) => (r[field] ?? null) === val);
      return chain;
    },
    not: (field: string, _op: string, raw: string) => {
      const excluded = new Set(parseInList(raw));
      rows = rows.filter(([, r]) => !excluded.has(r[field] as string));
      return chain;
    },
    order: (field: string, opts?: { ascending?: boolean }) => {
      rows.sort((a, b) => {
        const av = a[1][field] as number | string;
        const bv = b[1][field] as number | string;
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return opts?.ascending === false ? -cmp : cmp;
      });
      return chain;
    },
    limit: (n: number) => { limitN = n; return chain; },
    then: (resolve: (v: { data?: unknown; error?: unknown }) => void) => {
      const applyUpsert = () => {
        for (const row of upsertRows) tables[table].set(keyFor(table, row), row);
        resolve({ data: null, error: null });
      };
      const applyDelete = () => {
        for (const [key] of rows) tables[table].delete(key);
        resolve({ data: null, error: null });
      };

      if (table === 'matches' && holdMatchesCalls && (op === 'upsert' || op === 'delete')) {
        heldMatchesCalls.push({
          resolve: op === 'upsert' ? applyUpsert : applyDelete,
          op,
          upsertRows: [...upsertRows],
          deleteIds: rows.map(([id]) => id),
        });
        return; // never resolves until the test manually flushes it
      }

      if (op === 'upsert') { applyUpsert(); return; }
      if (op === 'delete') { applyDelete(); return; }
      // select
      let result = rows;
      if (limitN != null) result = result.slice(0, limitN);
      resolve({ data: result.map(([, r]) => r), error: null });
    },
  };
  return chain;
}

jest.mock('../client', () => ({
  get supabase() {
    return {
      from: (table: string) => mockMakeChain(table),
      channel: () => ({
        on: function (this: unknown) { return this; },
        subscribe: () => ({ unsubscribe: () => {} }),
      }),
    };
  },
  supabaseConfigured: true,
}));

beforeEach(() => {
  jest.clearAllMocks();
  useStore.getState().resetStore();
  for (const t of Object.values(tables)) t.clear();
  heldMatchesCalls = [];
  holdMatchesCalls = false;
  mockIsOnline = true;

  tables.tournaments.set('tour-1', {
    id: 'tour-1', user_id: 'test-user-id', name: 'Friday Night', ranked: true,
    rounds_target: 5, player_ids: ['p1', 'p2'], round: 1, round_open: true,
    round_players: ['p1', 'p2'], status: 'active', updated_at: new Date(0).toISOString(),
  });
  // Cloud already has the two pre-offline matches.
  tables.matches.set('match-a-preexisting', {
    id: 'match-a-preexisting', user_id: 'test-user-id', tournament_id: 'tour-1', round_id: null,
    a_id: 'p1', b_id: 'p2', a_team: 'ARS', b_team: 'JUV', a_score: 1, b_score: 0,
    media: null, note: null, stats_override: null, updated_at: new Date(0).toISOString(),
  });
});

it('a stale push finishing after a fresher one does not delete the newer match from the cloud', async () => {
  const preexisting: Match = {
    id: 'match-a-preexisting', aId: 'p1', bId: 'p2', aTeam: 'ARS', bTeam: 'JUV', aScore: 1, bScore: 0,
  };
  useStore.setState({
    hasTournament: true, tournamentId: 'tour-1', tournamentName: 'Friday Night',
    tournamentRanked: true, tournamentRounds: 5, tournamentPlayers: ['p1', 'p2'],
    round: 1, roundOpen: true, roundPlayers: ['p1', 'p2'], matches: [preexisting],
  });

  await renderHook(() => useSyncManager());
  await waitFor(() => expect(useStore.getState().syncStatus).toBe('idle'));
  // The initial pull()'s applyCloudState() sets applyingRef.current = true and
  // only clears it 100ms later (see useSyncManager.ts) — edits made inside
  // that window are silently ignored by the dirty-tracking subscriber. Not
  // part of the race under test, so just wait it out.
  await new Promise((r) => setTimeout(r, 150));

  // Start holding 'matches' calls so both pushes below stay pending until we
  // manually decide the completion order.
  holdMatchesCalls = true;

  const matchA: Match = { id: 'match-a', aId: 'p1', bId: 'p2', aTeam: 'ARS', bTeam: 'JUV', aScore: 2, bScore: 0 };
  act(() => { useStore.getState().addMatch(matchA); });

  // Wait for the first debounced push to actually issue its 'matches' calls
  // (upsert + delete) and get held.
  await waitFor(() => expect(heldMatchesCalls.length).toBeGreaterThanOrEqual(1), { timeout: 3000 });
  const pushACalls = [...heldMatchesCalls];
  heldMatchesCalls = [];

  // Add a second match well after the first push already started (realistic:
  // filling the "add match" form takes several seconds > the 300ms debounce),
  // while the first push is still stuck pending.
  const matchB: Match = { id: 'match-b', aId: 'p1', bId: 'p2', aTeam: 'ARS', bTeam: 'JUV', aScore: 3, bScore: 1 };
  act(() => { useStore.getState().addMatch(matchB); });

  // Match B's own debounce (300ms) settles while push A is still held — with
  // the fix this must NOT start a second overlapping push.
  await new Promise((r) => setTimeout(r, 400));
  expect(heldMatchesCalls.length).toBe(0);

  // Let push A land — its payload only knows about match A + the
  // pre-existing match, since it was captured before match B existed.
  pushACalls.forEach((c) => c.resolve());

  // Push A's own delete-by-absence step (issued only after its upsert
  // resolves, sync.ts runs them sequentially) also touches 'matches' and
  // gets held too, since holdMatchesCalls is still true — drain it before
  // push A's runPush() fully settles and its finally() fires the deferred
  // follow-up.
  await waitFor(() => expect(heldMatchesCalls.length).toBeGreaterThanOrEqual(1), { timeout: 3000 });
  heldMatchesCalls.forEach((c) => c.resolve());
  heldMatchesCalls = [];

  // Push A's completion should trigger the deferred follow-up push
  // automatically, with a fresh snapshot that now includes match B.
  await waitFor(() => expect(heldMatchesCalls.length).toBeGreaterThanOrEqual(1), { timeout: 3000 });
  const followUpCalls = [...heldMatchesCalls];
  heldMatchesCalls = [];

  const followUpUpsertIds = followUpCalls.find((c) => c.op === 'upsert')?.upsertRows.map((r) => r.id) ?? [];
  expect(followUpUpsertIds).toContain('match-a');
  expect(followUpUpsertIds).toContain('match-b');

  holdMatchesCalls = false;
  followUpCalls.forEach((c) => c.resolve());

  await waitFor(() => expect(tables.matches.get('match-b')).toBeTruthy());
  expect(tables.matches.get('match-a')).toBeTruthy();
  expect(tables.matches.get('match-a-preexisting')).toBeTruthy();
});
