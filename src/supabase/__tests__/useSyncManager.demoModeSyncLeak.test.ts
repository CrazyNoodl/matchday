/**
 * Regression test for a demo-mode data-loss incident: a real demo tournament
 * row (`demo-tour-pl-s2`, the hardcoded id in src/demo/data.ts's DEMO_STATE)
 * appeared in the user's real Supabase `tournaments` table next to their
 * actual active tournament.
 *
 * Root cause: setDemoMode(true) swaps players/teams/matches/tournament
 * fields to DEMO_STATE in one set() call. useSyncManager's dirty-tracking
 * subscriber compared references unconditionally and treated that swap as a
 * real edit, persisting it into pendingSyncTables. If the app was then
 * force-quit while Demo Mode was still on, the next cold start's
 * leftover-dirty flush (`init()`) called runPush() with no demoMode check at
 * all — pushing the live (still demo) state straight to Supabase under the
 * real user_id.
 *
 * Fix: (1) runPush() now refuses to push whenever demoMode is true,
 * regardless of caller — a last-line-of-defense guard. (2) the dirty-tracking
 * subscriber no longer marks anything dirty on a demo-mode enter/exit
 * transition, since that reference churn isn't a real edit — which also
 * stops it from permanently sabotaging the exit-demo "pull latest before
 * overwriting" safeguard (see the second test below).
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useStore } from '../../store';
import { pushState, pullState } from '../sync';
import { useSyncManager } from '../useSyncManager';
import { DEMO_STATE } from '../../demo/data';

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

beforeEach(() => {
  jest.clearAllMocks();
  useStore.getState().resetStore();
});

it('never pushes demo data left over from a force-quit while Demo Mode was still on', async () => {
  // Simulate a cold start where a previous session ended (crash/force-quit)
  // while Demo Mode was active: persisted state still has demoMode: true,
  // DEMO_STATE loaded into players/teams/tournament, and a leftover dirty
  // flag from that (or any prior) session.
  useStore.setState({
    demoMode: true,
    realDataBackup: {
      tournamentId: '',
      hasTournament: false,
      tournamentName: '',
      round: 0,
      roundOpen: false,
      tournamentRanked: true,
      tournamentRounds: 0,
      tournamentPlayers: [],
      roundPlayers: [],
      matches: [],
      archivedRounds: [],
      closedTournaments: [],
      players: [],
      teams: [],
    },
    ...DEMO_STATE,
    pendingSyncTables: ['players', 'teams', 'openMatches', 'activeTournament'],
  });

  mockPullState.mockResolvedValue(null);

  await renderHook(() => useSyncManager());

  // Give the leftover-dirty flush a chance to run.
  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(mockPushState).not.toHaveBeenCalled();
  // Cloud must never see the demo tournament id.
  mockPushState.mock.calls.forEach(([payload]) => {
    expect(payload.tournamentId).not.toBe('demo-tour-pl-s2');
  });
});

it('applies a newer cloud pull on exiting Demo Mode instead of always short-circuiting', async () => {
  mockPullState.mockResolvedValue(null); // empty cloud on first mount
  await renderHook(() => useSyncManager());
  await waitFor(() => expect(mockPullState).toHaveBeenCalledTimes(1));

  act(() => {
    useStore.getState().setDemoMode(true);
  });

  // Another device pushed a real edit to the cloud while Demo Mode was on.
  const cloudSnapshot = {
    players: [{ id: 'from-cloud', name: 'FromCloud', teamCode: 'ARS' }],
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
  mockPullState.mockResolvedValue(cloudSnapshot);
  mockPushState.mockClear();

  act(() => {
    useStore.getState().setDemoMode(false);
  });

  await waitFor(() => expect(mockPullState).toHaveBeenCalledTimes(2));
  // The exit-demo pull must not be short-circuited by a false "dirty" flag
  // caused by the restore itself — it should actually apply the cloud data.
  await waitFor(() => expect(useStore.getState().players).toEqual(cloudSnapshot.players));
  await waitFor(() => expect(mockPushState).toHaveBeenCalledTimes(1));
});
