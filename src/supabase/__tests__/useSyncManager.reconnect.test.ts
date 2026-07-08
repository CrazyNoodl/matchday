/**
 * Regression test: edits made while offline must sync once connectivity
 * returns, without requiring another local mutation first.
 *
 * Previously, a failed debounced push (offline) only left the affected
 * tables marked dirty — nothing retried the push on its own. The next
 * automatic retry only fired on the *next* local store mutation, so a user
 * who went offline, made changes, and came back online without touching
 * anything else would have those changes stuck unsynced forever, despite
 * the offline banner promising "will sync once you're back online" (see
 * OfflineBanner / useIsOnline.ts).
 *
 * useSyncManager now watches useIsOnline() and, on the offline -> online
 * transition, flushes any still-dirty tables.
 *
 * First attempt at this fix pulled before pushing on reconnect (mirroring
 * the demo-mode-exit flow), which introduced a second bug: pull() calls
 * applyCloudState(), which overwrites the local store with whatever the
 * cloud last had — i.e. the pre-offline snapshot, without the offline
 * edits. That wiped the edits out of local state before they ever reached
 * the cloud, so the following push just re-confirmed the stale data. This
 * app is local-first (see CONTEXT.md), so on reconnect with pending dirty
 * tables the fix pushes first and does not pull at all.
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

let mockIsOnline = true;
jest.mock('@/hooks/useIsOnline', () => ({
  useIsOnline: () => mockIsOnline,
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

beforeEach(() => {
  jest.clearAllMocks();
  useStore.getState().resetStore();
  mockIsOnline = true;
});

it('flushes edits made while offline as soon as connectivity returns, with no further local change', async () => {
  mockPullState.mockResolvedValue(null);

  const { rerender } = await renderHook(() => useSyncManager());

  await waitFor(() => {
    expect(mockPullState).toHaveBeenCalledTimes(1);
  });

  // Go offline, then make a local edit — its debounced push fails (no network).
  mockIsOnline = false;
  await rerender(undefined);

  mockPushState.mockRejectedValueOnce(new Error('network down'));
  const localPlayer: Player = { id: 'local-1', name: 'Local', color: '#f00', teamCode: 'JUV' };
  useStore.getState().addPlayer(localPlayer);

  await waitFor(() => {
    expect(mockPushState).toHaveBeenCalledTimes(1);
  });
  await waitFor(() => {
    expect(useStore.getState().syncStatus).toBe('error');
  });

  // Come back online with no further edits — the failed push must retry on its own.
  mockPushState.mockResolvedValueOnce(undefined);
  mockIsOnline = true;
  await rerender(undefined);

  await waitFor(() => {
    expect(mockPushState).toHaveBeenCalledTimes(2);
  });

  // Must not have pulled on reconnect — a pull would applyCloudState() the
  // stale pre-offline cloud snapshot over the store and wipe out the edit
  // before the retry push above ever ran.
  expect(mockPullState).toHaveBeenCalledTimes(1);
  expect(useStore.getState().players).toContainEqual(localPlayer);
});

it('pulls (does not push) on reconnect when nothing local changed while offline', async () => {
  mockPullState.mockResolvedValue(null);

  const { rerender } = await renderHook(() => useSyncManager());

  await waitFor(() => {
    expect(mockPullState).toHaveBeenCalledTimes(1);
  });

  mockIsOnline = false;
  await rerender(undefined);
  mockIsOnline = true;
  await rerender(undefined);

  await waitFor(() => {
    expect(mockPullState).toHaveBeenCalledTimes(2);
  });
  expect(mockPushState).not.toHaveBeenCalled();
});
