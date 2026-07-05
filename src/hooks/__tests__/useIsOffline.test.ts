let mockNetworkState: { isConnected?: boolean } = {};

jest.mock('expo-network', () => ({
  useNetworkState: () => mockNetworkState,
}));

import { renderHook } from '@testing-library/react-native';
import { useIsOffline } from '../useIsOffline';

describe('useIsOffline', () => {
  it('reports online while the network state has not resolved yet', async () => {
    mockNetworkState = {};
    const { result } = await renderHook(() => useIsOffline());
    expect(result.current).toBe(false);
  });

  it('reports online when isConnected is true', async () => {
    mockNetworkState = { isConnected: true };
    const { result } = await renderHook(() => useIsOffline());
    expect(result.current).toBe(false);
  });

  it('reports offline when isConnected is false', async () => {
    mockNetworkState = { isConnected: false };
    const { result } = await renderHook(() => useIsOffline());
    expect(result.current).toBe(true);
  });
});
