import { renderHook, act } from '@testing-library/react-native';
import { useSettings } from '../useSettings';
import { useStore } from '@/store';
import { signOut } from '@/supabase/auth';
import { deleteAllCloudData } from '@/supabase/sync';
import type { Player, Team } from '@/store/types';

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({ getString: () => null, set: jest.fn(), remove: jest.fn() }),
}));

// @/i18n initialises i18next on import (calls native modules); mock to data only.
jest.mock('@/i18n', () => ({
  LANGUAGES: [
    { code: 'en', nativeName: 'English', flag: '🇬🇧' },
    { code: 'uk', nativeName: 'Українська', flag: '🇺🇦' },
  ],
}));

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockDismissAll = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush, dismissAll: mockDismissAll }),
}));

jest.mock('@/utils/useGoBack', () => ({ useGoBack: () => jest.fn() }));

jest.mock('@/supabase/auth', () => ({ signOut: jest.fn().mockResolvedValue(undefined) }));

jest.mock('@/supabase/client', () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
  },
  supabaseConfigured: false,
}));

jest.mock('@/supabase/sync', () => ({
  deleteAllCloudData: jest.fn().mockResolvedValue(undefined),
}));

const mockSignOut = signOut as jest.Mock;
const mockDeleteAllCloudData = deleteAllCloudData as jest.Mock;

const SEED_PLAYERS: Player[] = [
  { id: 'player-1', name: 'Alice', color: '#f00', teamCode: 'JUV' },
  { id: 'player-2', name: 'Bob', color: '#00f', teamCode: 'TOT' },
  { id: 'player-3', name: 'Carol', color: '#0f0', teamCode: 'GAL' },
];

const SEED_TEAMS: Team[] = [
  { code: 'JUV', name: 'Juventus', short: 'JUV', color: '#000', custom: false },
  { code: 'TOT', name: 'Tottenham', short: 'TOT', color: '#fff', custom: false },
  { code: 'GAL', name: 'Galatasaray', short: 'GAL', color: '#f90', custom: false },
];

function setSeedState() {
  useStore.setState({
    players: SEED_PLAYERS,
    teams: SEED_TEAMS,
    hasTournament: false,
    archivedRounds: [],
    closedTournaments: [],
    showNick: true,
    showTeamLogo: true,
    language: 'en',
    demoMode: false,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  useStore.getState().resetStore();
});

// ── isDefaultState ────────────────────────────────────────────────────────────

describe('isDefaultState', () => {
  it('is true when store matches seed data exactly', async () => {
    setSeedState();
    const { result } = await renderHook(() => useSettings());
    expect(result.current.isDefaultState).toBe(true);
  });

  it('is false when an extra player is added', async () => {
    setSeedState();
    useStore.getState().addPlayer({ id: 'extra', name: 'Dave', color: '#0ff', teamCode: 'JUV' });
    const { result } = await renderHook(() => useSettings());
    expect(result.current.isDefaultState).toBe(false);
  });

  it('is false when a tournament is active', async () => {
    setSeedState();
    useStore.setState({ hasTournament: true });
    const { result } = await renderHook(() => useSettings());
    expect(result.current.isDefaultState).toBe(false);
  });

  it('is false when archived rounds exist', async () => {
    setSeedState();
    useStore.setState({
      archivedRounds: [
        {
          id: 'r1',
          n: 1,
          date: '',
          winner: '',
          games: 1,
          ranked: true,
          name: 'R1',
          matches: [],
        },
      ],
    });
    const { result } = await renderHook(() => useSettings());
    expect(result.current.isDefaultState).toBe(false);
  });

  it('is false when language is not "en"', async () => {
    setSeedState();
    useStore.setState({ language: 'uk' });
    const { result } = await renderHook(() => useSettings());
    expect(result.current.isDefaultState).toBe(false);
  });

  it('is false when showNick is off', async () => {
    setSeedState();
    useStore.setState({ showNick: false });
    const { result } = await renderHook(() => useSettings());
    expect(result.current.isDefaultState).toBe(false);
  });
});

// ── handleVersionTap easter egg ───────────────────────────────────────────────

describe('handleVersionTap', () => {
  // handleVersionTap reads `versionTaps` from the closure (not functional updater),
  // so batching multiple calls inside one act() would all read the same stale value.
  // Each tap needs its own await act() so React commits the state before the next call.
  async function tapN(result: { current: ReturnType<typeof useSettings> }, n: number) {
    for (let i = 0; i < n; i++) {
      await act(async () => {
        result.current.handleVersionTap();
      });
    }
  }

  it('navigates to changelog on the 3rd tap', async () => {
    const { result } = await renderHook(() => useSettings());
    await tapN(result, 3);
    expect(mockPush).toHaveBeenCalledWith('/settings/changelog');
  });

  it('does not navigate before the 3rd tap', async () => {
    const { result } = await renderHook(() => useSettings());
    await tapN(result, 2);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('unlocks dev mode after 10 taps', async () => {
    const { result } = await renderHook(() => useSettings());
    await tapN(result, 10);
    expect(result.current.devUnlocked).toBe(true);
  });

  it('ignores further taps once dev mode is unlocked', async () => {
    const { result } = await renderHook(() => useSettings());
    await tapN(result, 10);
    expect(result.current.devUnlocked).toBe(true);
    await act(async () => {
      result.current.handleVersionTap();
    });
    // Only the tap-3 changelog push should have fired (tap 10 unlocks, not navigates)
    expect(mockPush).toHaveBeenCalledTimes(1);
  });
});

// ── handleDemoToggle ──────────────────────────────────────────────────────────

describe('handleDemoToggle', () => {
  it('enables demo mode directly when no tournament is active', async () => {
    useStore.setState({ hasTournament: false, demoMode: false });
    const { result } = await renderHook(() => useSettings());
    await act(async () => {
      result.current.handleDemoToggle(true);
    });
    expect(useStore.getState().demoMode).toBe(true);
    expect(result.current.showDemoConfirm).toBe(false);
  });

  it('shows confirm dialog instead of enabling when tournament is active', async () => {
    useStore.setState({ hasTournament: true, demoMode: false });
    const { result } = await renderHook(() => useSettings());
    await act(async () => {
      result.current.handleDemoToggle(true);
    });
    expect(result.current.showDemoConfirm).toBe(true);
    expect(useStore.getState().demoMode).toBe(false);
  });

  it('disables demo mode without confirmation', async () => {
    useStore.setState({ demoMode: true });
    const { result } = await renderHook(() => useSettings());
    await act(async () => {
      result.current.handleDemoToggle(false);
    });
    expect(useStore.getState().demoMode).toBe(false);
    expect(result.current.showDemoConfirm).toBe(false);
  });
});

// ── confirmEnableDemo ─────────────────────────────────────────────────────────

describe('confirmEnableDemo', () => {
  it('enables demo mode, closes dialog, and navigates to home', async () => {
    useStore.setState({ hasTournament: true, demoMode: false });
    const { result } = await renderHook(() => useSettings());
    await act(async () => {
      result.current.handleDemoToggle(true);
    });
    expect(result.current.showDemoConfirm).toBe(true);
    await act(async () => {
      result.current.confirmEnableDemo();
    });
    expect(useStore.getState().demoMode).toBe(true);
    expect(result.current.showDemoConfirm).toBe(false);
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});

// ── handleSignOut ─────────────────────────────────────────────────────────────

describe('handleSignOut', () => {
  it('shows the sign-out confirmation dialog', async () => {
    const { result } = await renderHook(() => useSettings());
    await act(async () => {
      result.current.handleSignOut();
    });
    expect(result.current.showSignOutConfirm).toBe(true);
  });
});

describe('confirmSignOut', () => {
  it('calls signOut and closes the dialog', async () => {
    const { result } = await renderHook(() => useSettings());
    await act(async () => {
      result.current.handleSignOut();
    });
    await act(async () => {
      await result.current.confirmSignOut();
    });
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(result.current.showSignOutConfirm).toBe(false);
  });

  it('clears locally cached players/teams so the next account on this device starts empty', async () => {
    setSeedState();
    const { result } = await renderHook(() => useSettings());
    await act(async () => {
      await result.current.confirmSignOut();
    });
    expect(useStore.getState().players).toHaveLength(0);
    expect(useStore.getState().teams).toHaveLength(0);
  });

  it('still resets the store when signOut itself throws', async () => {
    setSeedState();
    mockSignOut.mockRejectedValueOnce(new Error('network down'));
    const { result } = await renderHook(() => useSettings());
    await act(async () => {
      await result.current.confirmSignOut();
    });
    expect(useStore.getState().players).toHaveLength(0);
  });
});

// ── handleReset ───────────────────────────────────────────────────────────────

describe('handleReset', () => {
  it('resets store and navigates to home', async () => {
    useStore.getState().addPlayer({ id: 'extra', name: 'Dave', color: '#fff', teamCode: 'JUV' });
    const countBefore = useStore.getState().players.length;
    const { result } = await renderHook(() => useSettings());
    await act(async () => {
      await result.current.handleReset();
    });
    expect(result.current.showResetConfirm).toBe(false);
    expect(useStore.getState().players.length).toBeLessThan(countBefore);
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('explicitly wipes cloud data — "Reset All Data" is a genuine full wipe, not local-only', async () => {
    // Unlike sign-out (which must NOT touch the cloud), this is the one place
    // a full account wipe is intended, so it must go through the dedicated
    // deleteAllCloudData() call rather than relying on the generic sync
    // dirty-diff mechanism (which is deliberately local-only, see resetStore).
    const { result } = await renderHook(() => useSettings());
    await act(async () => {
      await result.current.handleReset();
    });
    expect(mockDeleteAllCloudData).toHaveBeenCalledTimes(1);
  });

  it('still resets the local store when the cloud wipe fails', async () => {
    mockDeleteAllCloudData.mockRejectedValueOnce(new Error('network down'));
    useStore.getState().addPlayer({ id: 'extra', name: 'Dave', color: '#fff', teamCode: 'JUV' });
    const { result } = await renderHook(() => useSettings());
    await act(async () => {
      await result.current.handleReset();
    });
    expect(useStore.getState().players.find((p) => p.id === 'extra')).toBeUndefined();
  });
});
