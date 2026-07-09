/**
 * Covers the corroboration layer added on top of NetInfo: NetInfo/the browser only see
 * whether there's a network interface with a route, not whether requests to our own
 * backend actually get through (e.g. mobile data cut off for non-payment, or a wifi
 * captive portal with no real internet). useIsOnline re-verifies with a real Supabase
 * ping — periodically, and immediately on app foreground — while NetInfo claims online.
 */

import { act, renderHook } from '@testing-library/react-native';

import { pingSupabase } from '@/supabase/health';
import { useIsOnline, HEALTH_CHECK_INTERVAL_MS } from '../useIsOnline';

type NetInfoListener = (state: {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}) => void;
type AppStateListener = (state: string) => void;

let mockNetInfoListener: NetInfoListener | null = null;
let mockAppStateListener: AppStateListener | null = null;
const mockAppStateRemove = jest.fn();

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn((cb: NetInfoListener) => {
    mockNetInfoListener = cb;
    return jest.fn();
  }),
}));

// The real AppState mock provided by @react-native/jest-preset doesn't clean up its
// internal listener registry when a subscription's `.remove()` is called, so listeners
// leak across tests in this file. Fully mock 'react-native' here (like useIsOnline.web.test.ts
// does) so each test owns a single, controllable "change" callback instead. Spreading the
// actual module in is unsafe here — react-native's own index.js has circular internal
// requires (FlatList -> VirtualizedList -> ... -> DevMenu) that break under jest.requireActual
// when re-entered through this mock factory; a flat replacement sidesteps that entirely.
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: {
    addEventListener: jest.fn((_type: string, cb: AppStateListener) => {
      mockAppStateListener = cb;
      return { remove: mockAppStateRemove };
    }),
  },
}));

jest.mock('@/supabase/health', () => ({
  pingSupabase: jest.fn(),
}));

const mockedPing = pingSupabase as jest.Mock;

beforeEach(() => {
  mockNetInfoListener = null;
  mockAppStateListener = null;
  mockAppStateRemove.mockClear();
  mockedPing.mockReset();
  mockedPing.mockResolvedValue(true);
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useIsOnline health-check corroboration', () => {
  it('goes offline when NetInfo says online but Supabase is unreachable', async () => {
    mockedPing.mockResolvedValue(false);
    const { result } = await renderHook(() => useIsOnline());
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(result.current).toBe(false);
  });

  it('re-verifies periodically while online and flips offline if reachability drops', async () => {
    const { result } = await renderHook(() => useIsOnline());
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(result.current).toBe(true);

    mockedPing.mockResolvedValue(false);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(HEALTH_CHECK_INTERVAL_MS);
    });
    expect(result.current).toBe(false);
  });

  it('recovers once a later periodic check succeeds again', async () => {
    mockedPing.mockResolvedValue(false);
    const { result } = await renderHook(() => useIsOnline());
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(result.current).toBe(false);

    mockedPing.mockResolvedValue(true);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(HEALTH_CHECK_INTERVAL_MS);
    });
    expect(result.current).toBe(true);
  });

  it('re-verifies immediately when the app returns to the foreground, not waiting for the interval', async () => {
    const { result } = await renderHook(() => useIsOnline());
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(result.current).toBe(true);

    mockedPing.mockResolvedValue(false);
    await act(async () => {
      mockAppStateListener?.('active');
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(result.current).toBe(false);
  });

  it('does not ping Supabase while NetInfo already reports offline', async () => {
    await renderHook(() => useIsOnline());
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    mockedPing.mockClear();

    await act(async () => {
      mockNetInfoListener?.({ isConnected: false, isInternetReachable: false });
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(HEALTH_CHECK_INTERVAL_MS);
    });
    expect(mockedPing).not.toHaveBeenCalled();
  });

  it('removes the AppState subscription once the raw signal goes offline', async () => {
    await renderHook(() => useIsOnline());
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      mockNetInfoListener?.({ isConnected: false, isInternetReachable: false });
    });
    expect(mockAppStateRemove).toHaveBeenCalled();
  });

  it('trusts a hard NetInfo offline even if a stale verification had marked it unreachable', async () => {
    mockedPing.mockResolvedValue(false);
    const { result } = await renderHook(() => useIsOnline());
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(result.current).toBe(false);

    await act(async () => {
      mockNetInfoListener?.({ isConnected: false, isInternetReachable: false });
    });
    expect(result.current).toBe(false);
  });
});
