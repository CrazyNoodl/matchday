/**
 * Regression test for the "pull failure treated as empty cloud" bug.
 *
 * Previously, pull() in useSyncManager only checked `if (!pulled) return false`.
 * pullState() used to swallow query errors and resolve to an empty-but-truthy
 * object, so a network blip on the very first sync looked identical to
 * "this user's cloud has no data yet" — which then triggered a bootstrap
 * push of local state, including the destructive delete-by-absence path in
 * pushState (see sync.test.ts). A transient read failure could cascade into
 * a write that deletes real cloud rows.
 *
 * pullState() now throws on query error instead of returning an empty
 * object, and useSyncManager's pull() distinguishes 'failed' from 'empty'.
 * This test renders the real hook (sync module mocked, no network) and
 * asserts that a rejected pullState() never results in pushState being called.
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

// Stub connectivity as always-online — this suite is about pull-failure/
// bootstrap-push logic, not reconnect behavior (see useSyncManager.reconnect.test.ts).
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

beforeEach(() => {
  jest.clearAllMocks();
  useStore.getState().resetStore();
});

it('never bootstraps a push when the initial pull fails, even with local data present', async () => {
  // Local state has real data — this is exactly the scenario that risks
  // data loss if a failed pull is mistaken for "cloud is empty".
  const localPlayer: Player = { id: 'local-1', name: 'Local', color: '#f00', teamCode: 'JUV' };
  useStore.getState().addPlayer(localPlayer);

  mockPullState.mockRejectedValue(new Error('network error'));

  renderHook(() => useSyncManager());

  await waitFor(() => {
    expect(mockPullState).toHaveBeenCalled();
  });

  // Give the rejected promise's .catch handling time to settle.
  await waitFor(() => {
    expect(useStore.getState().syncStatus).toBe('error');
  });

  expect(mockPushState).not.toHaveBeenCalled();
});

it('does bootstrap a push when the pull genuinely succeeds with an empty cloud', async () => {
  const localPlayer: Player = { id: 'local-1', name: 'Local', color: '#f00', teamCode: 'JUV' };
  useStore.getState().addPlayer(localPlayer);

  mockPullState.mockResolvedValue(null);

  renderHook(() => useSyncManager());

  await waitFor(() => {
    expect(mockPushState).toHaveBeenCalledTimes(1);
  });
});
