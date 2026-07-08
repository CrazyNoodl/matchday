/**
 * Regression test: matches added to an already-active tournament while fully
 * offline must survive a force-quit + reconnect + relaunch cycle.
 *
 * Unlike useSyncManager.coldStartClobber.test.ts (which mocks
 * pushState/pullState directly with a scripted stale response), this test
 * uses the REAL pushState()/pullState() from sync.ts against a stateful fake
 * Supabase client — so a successful push actually mutates what a later pull
 * reads back, exactly like real Postgres read-after-write. This caught a gap
 * a fixed-response pull mock would hide (e.g. a missing `channel()` stub
 * silently leaving syncStatus stuck on 'error' after a successful sync).
 */

import { renderHook, waitFor } from '@testing-library/react-native';
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

jest.mock('@/hooks/useIsOnline', () => ({
  useIsOnline: () => true,
}));

jest.mock('../auth', () => ({
  getCurrentUserId: jest.fn().mockResolvedValue('test-user-id'),
}));

// ---------------------------------------------------------------------------
// Stateful fake Supabase client: upserts/deletes actually mutate in-memory
// tables, and selects read back whatever is currently there — unlike a
// scripted mock, a later pullState() reflects an earlier pushState()'s writes.
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
let networkUp = true;

function keyFor(table: string, row: Row): string {
  return table === 'teams' ? (row.code as string) : (row.id as string);
}

function parseInList(raw: string): string[] {
  return raw
    .replace(/^\(|\)$/g, '')
    .split(',')
    .filter(Boolean);
}

function mockMakeChain(table: string) {
  let op: 'select' | 'delete' | 'upsert' | null = null;
  let upsertRows: Row[] = [];
  let rows: [string, Row][] = [];
  let limitN: number | null = null;

  const chain: Record<string, unknown> = {
    select: () => {
      op = 'select';
      rows = Array.from(tables[table].entries());
      return chain;
    },
    delete: () => {
      op = 'delete';
      rows = Array.from(tables[table].entries());
      return chain;
    },
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
    limit: (n: number) => {
      limitN = n;
      return chain;
    },
    then: (resolve: (v: { data?: unknown; error?: unknown }) => void) => {
      if (!networkUp) {
        resolve({ data: null, error: { message: 'network down' } });
        return;
      }
      if (op === 'upsert') {
        for (const row of upsertRows) tables[table].set(keyFor(table, row), row);
        resolve({ data: null, error: null });
        return;
      }
      if (op === 'delete') {
        for (const [key] of rows) tables[table].delete(key);
        resolve({ data: null, error: null });
        return;
      }
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
        on: function (this: unknown) {
          return this;
        },
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
  networkUp = true;

  // Seed cloud with an already-active tournament from a prior successful
  // sync (matches the real precondition: the tournament itself was created
  // while online, before this session's offline match-adding began).
  tables.tournaments.set('tour-1', {
    id: 'tour-1',
    user_id: 'test-user-id',
    name: 'Friday Night',
    ranked: true,
    rounds_target: 5,
    player_ids: ['p1', 'p2'],
    round: 1,
    round_open: true,
    round_players: ['p1', 'p2'],
    status: 'active',
    updated_at: new Date(0).toISOString(),
  });
});

it('does not let a reconnect pull wipe out matches added while fully offline', async () => {
  // Local store already reflects the same active tournament (as if it synced
  // successfully before this session went offline).
  useStore.setState({
    hasTournament: true,
    tournamentId: 'tour-1',
    tournamentName: 'Friday Night',
    tournamentRanked: true,
    tournamentRounds: 5,
    tournamentPlayers: ['p1', 'p2'],
    round: 1,
    roundOpen: true,
    roundPlayers: ['p1', 'p2'],
  });

  // --- Session 1: app opens fully offline, user adds matches, then force-quits ---
  networkUp = false;
  const { unmount } = await renderHook(() => useSyncManager());
  await waitFor(() => expect(useStore.getState().syncStatus).toBe('error'));

  const offlineMatch: Match = {
    id: 'match-offline-1',
    aId: 'p1',
    bId: 'p2',
    aTeam: 'ARS',
    bTeam: 'JUV',
    aScore: 3,
    bScore: 1,
  };
  useStore.getState().addMatch(offlineMatch);

  await waitFor(() => expect(useStore.getState().pendingSyncTables).toContain('openMatches'));

  unmount(); // force-quit — dirtyRef (in-memory) is gone, pendingSyncTables (persisted) survives

  // --- Session 2: connectivity is back, app relaunches ---
  networkUp = true;
  await renderHook(() => useSyncManager());

  await waitFor(() => expect(useStore.getState().pendingSyncTables).toEqual([]));
  await waitFor(() => expect(useStore.getState().syncStatus).toBe('idle'));

  // The offline match must still be present locally, and must have actually
  // reached the "cloud" (fake table), not just survived by luck locally.
  expect(useStore.getState().matches).toContainEqual(offlineMatch);
  expect(tables.matches.get('match-offline-1')).toBeTruthy();
});
