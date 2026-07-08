/**
 * Regression test: an edit made offline must survive an app restart, even
 * if the app is killed (crash, force-quit, OS eviction) before the edit
 * ever reaches the cloud.
 *
 * useSyncManager's dirty-table tracking (dirtyRef) was in-memory only — a
 * fresh mount always started from an empty Set, with no memory of what a
 * previous session failed to push. Meanwhile init() unconditionally called
 * pull() on every cold start, and pull()'s applyCloudState() is a blind
 * overwrite (see src/store/index.ts), not a merge. So: make an offline
 * edit, kill the app before it syncs, reopen while online — the very next
 * cold-start pull silently replaces the unsynced edit with the stale
 * pre-edit cloud snapshot. No error, no warning, the edit is just gone.
 *
 * Fix: dirty tables are now mirrored into persisted store state
 * (pendingSyncTables, via persistDirty() in useSyncManager). On init(),
 * any leftover pendingSyncTables from a previous session are pushed
 * *before* the normal pull runs, so the blind-overwrite pull never gets a
 * chance to clobber them.
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { useStore } from '../../store';
import { pushState, pullState } from '../sync';
import { useSyncManager } from '../useSyncManager';
import type { Player } from '../../store/types';

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

jest.mock('../sync', () => ({
  ...jest.requireActual('../sync'),
  pushState: jest.fn().mockResolvedValue(undefined),
  pullState: jest.fn(),
  subscribeToChanges: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
}));

jest.mock('../auth', () => ({
  getCurrentUserId: jest.fn().mockResolvedValue('test-user-id'),
}));

jest.mock('../client', () => ({
  supabaseConfigured: true,
  supabase: {},
}));

const mockPushState = pushState as jest.MockedFunction<typeof pushState>;
const mockPullState = pullState as jest.MockedFunction<typeof pullState>;

const stalePulledState = {
  players: [{ id: 'cloud-only', name: 'CloudOnly', teamCode: 'ARS' }],
  teams: [],
  matches: [],
  archivedRounds: [],
  closedTournaments: [],
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

beforeEach(() => {
  jest.clearAllMocks();
  useStore.getState().resetStore();
});

it('pushes leftover unsynced edits before pulling on the next cold start, instead of losing them', async () => {
  // --- Session 1: make an offline edit, its push fails, then the app dies ---
  mockPullState.mockResolvedValue(null); // empty cloud, first ever sync
  const { unmount } = await renderHook(() => useSyncManager());
  await waitFor(() => expect(mockPullState).toHaveBeenCalledTimes(1));

  mockPushState.mockRejectedValueOnce(new Error('network down'));
  const localPlayer: Player = { id: 'local-1', name: 'Local', teamCode: 'JUV' };
  useStore.getState().addPlayer(localPlayer);

  await waitFor(() => expect(mockPushState).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(useStore.getState().syncStatus).toBe('error'));
  // The failed push must have left a record that survives the restart below.
  expect(useStore.getState().pendingSyncTables).toContain('players');

  unmount(); // simulates the app process dying (crash / force-quit / OS eviction)

  // --- Session 2 ("cold start"): the store's persisted fields (players,
  // pendingSyncTables) are still there, exactly as a real MMKV rehydration
  // would leave them. Cloud now has *different*, stale (pre-edit) data. ---
  jest.clearAllMocks();
  mockPushState.mockResolvedValue(undefined);
  mockPullState.mockResolvedValue(stalePulledState);

  await renderHook(() => useSyncManager());

  await waitFor(() => expect(mockPushState).toHaveBeenCalledTimes(1));

  // The critical assertion: the payload this push actually sent must still
  // contain the offline edit. In the old (buggy) pull-first ordering, pull()
  // would have run first and applyCloudState()'d the stale snapshot over the
  // store *before* this push read it — so the payload would have shipped
  // the wrong (clobbered) data instead of failing loudly.
  const [pushedPayload] = mockPushState.mock.calls[0];
  expect(pushedPayload.players).toContainEqual(localPlayer);

  // Only after the leftover edit is safely pushed should it ever pull.
  await waitFor(() => expect(mockPullState).toHaveBeenCalledTimes(1));
  expect(useStore.getState().pendingSyncTables).toEqual([]);
});
