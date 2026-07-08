/**
 * Regression test: resetStore() (dev "Reset data" in Settings, and the
 * sign-out account-isolation wipe in confirmSignOut) is a LOCAL-ONLY cache
 * clear — it must never be treated as a real edit to sync. Previously the
 * subscribe listener below saw players/teams/tournament fields all change
 * to empty and marked every table dirty, so the debounced push fired with
 * an emptied payload — and pushState() deletes any cloud row not present in
 * the payload, permanently wiping the user's real Supabase data.
 *
 * Fix: resetStore() sets syncSuppressionRef.current around its state wipe;
 * the subscribe listener bails out early while it's set, so no table is
 * ever marked dirty for that transition and no push follows.
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { useStore } from '../../store';
import { pullState, pushState } from '../sync';
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
  pullState: jest.fn().mockResolvedValue(null),
  subscribeToChanges: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
}));

jest.mock('../auth', () => ({
  getCurrentUserId: jest.fn().mockResolvedValue('test-user-id'),
}));

jest.mock('../client', () => ({
  supabaseConfigured: true,
  supabase: {},
}));

jest.mock('../storage', () => ({
  deleteMediaItem: jest.fn().mockResolvedValue(undefined),
}));

const mockPullState = pullState as jest.MockedFunction<typeof pullState>;
const mockPushState = pushState as jest.MockedFunction<typeof pushState>;

beforeEach(() => {
  jest.clearAllMocks();
  useStore.getState().resetStore();
});

it('never pushes after resetStore() wipes local state, even though it has real cloud data', async () => {
  mockPullState.mockResolvedValue(null);
  await renderHook(() => useSyncManager());
  await waitFor(() => expect(mockPullState).toHaveBeenCalledTimes(1));

  // A real edit — this is the baseline: it SHOULD push.
  const localPlayer: Player = { id: 'local-1', name: 'Local', color: '#f00', teamCode: 'JUV' };
  useStore.getState().addPlayer(localPlayer);
  await waitFor(() => expect(mockPushState).toHaveBeenCalledTimes(1));

  mockPushState.mockClear();

  // The local-only wipe — this must NOT push.
  await useStore.getState().resetStore();

  // Give the 300ms push debounce window a chance to fire if the bug regresses.
  await new Promise((resolve) => setTimeout(resolve, 500));
  expect(mockPushState).not.toHaveBeenCalled();
});
