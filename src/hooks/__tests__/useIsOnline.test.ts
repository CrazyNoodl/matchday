import { act, renderHook } from '@testing-library/react-native';

import { useIsOnline } from '../useIsOnline';

type Listener = (state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => void;

let mockListener: Listener | null = null;
const mockUnsubscribe = jest.fn();

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn((cb: Listener) => {
    mockListener = cb;
    return mockUnsubscribe;
  }),
}));

// The health-check corroboration layer (src/hooks/__tests__/useIsOnline.healthCheck.test.ts)
// is covered separately with fake timers. Here it's mocked to always succeed so it never
// interferes with the plain NetInfo-driven assertions below.
jest.mock('@/supabase/health', () => ({
  pingSupabase: jest.fn().mockResolvedValue(true),
}));

beforeEach(() => {
  mockListener = null;
  mockUnsubscribe.mockClear();
});

describe('useIsOnline', () => {
  it('defaults to online before any event fires', async () => {
    const { result } = await renderHook(() => useIsOnline());
    expect(result.current).toBe(true);
  });

  it('reports offline when isConnected is false', async () => {
    const { result } = await renderHook(() => useIsOnline());
    await act(async () => {
      mockListener?.({ isConnected: false, isInternetReachable: null });
    });
    expect(result.current).toBe(false);
  });

  it('reports offline when isInternetReachable is false even if isConnected is true', async () => {
    const { result } = await renderHook(() => useIsOnline());
    await act(async () => {
      mockListener?.({ isConnected: true, isInternetReachable: false });
    });
    expect(result.current).toBe(false);
  });

  it('treats unknown isInternetReachable (null) as online', async () => {
    const { result } = await renderHook(() => useIsOnline());
    await act(async () => {
      mockListener?.({ isConnected: true, isInternetReachable: null });
    });
    expect(result.current).toBe(true);
  });

  it('goes back online when connectivity is restored', async () => {
    const { result } = await renderHook(() => useIsOnline());
    await act(async () => {
      mockListener?.({ isConnected: false, isInternetReachable: false });
    });
    expect(result.current).toBe(false);
    await act(async () => {
      mockListener?.({ isConnected: true, isInternetReachable: true });
    });
    expect(result.current).toBe(true);
  });

  it('unsubscribes on unmount', async () => {
    const { unmount } = await renderHook(() => useIsOnline());
    await act(async () => {
      unmount();
    });
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
