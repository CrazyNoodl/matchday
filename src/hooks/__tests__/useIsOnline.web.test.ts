/**
 * Regression test: @react-native-community/netinfo's web implementation prefers the
 * Network Information API (`navigator.connection`) when the browser exposes it, and that
 * API's `change` event does not reliably fire on a real connectivity drop (confirmed via
 * Chromium — going offline updates `navigator.onLine` and fires window `online`/`offline`
 * but never a `connection.change` event). useIsOnline bypasses NetInfo entirely on web and
 * listens to the window events directly — this file locks that behavior in.
 */

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
}));

import { act, renderHook } from '@testing-library/react-native';
import { useIsOnline } from '../useIsOnline';

describe('useIsOnline (web)', () => {
  // Deliberately no afterEach restoring the real window/navigator: @testing-library/react-native
  // registers its own auto-unmount afterEach at module scope, which — per Jest's hook ordering
  // (inner afterEach runs before outer) — would fire AFTER a local afterEach here restored the
  // real globals, making the hook's cleanup run against the wrong `window` and throw. Leaving the
  // fake window/navigator in place between tests is harmless since every test reassigns a fresh one.
  beforeEach(() => {
    (global as unknown as { window: EventTarget }).window = new EventTarget();
    (global as unknown as { navigator: { onLine: boolean } }).navigator = { onLine: true };
  });

  it('reflects navigator.onLine on mount', async () => {
    (global.navigator as unknown as { onLine: boolean }).onLine = false;
    const { result } = await renderHook(() => useIsOnline());
    expect(result.current).toBe(false);
  });

  it('goes offline on a window "offline" event, ignoring NetInfo', async () => {
    const { result } = await renderHook(() => useIsOnline());
    expect(result.current).toBe(true);
    await act(async () => {
      global.window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);
  });

  it('goes back online on a window "online" event', async () => {
    (global.navigator as unknown as { onLine: boolean }).onLine = false;
    const { result } = await renderHook(() => useIsOnline());
    expect(result.current).toBe(false);
    await act(async () => {
      global.window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });

  it('removes window listeners on unmount', async () => {
    const removeSpy = jest.spyOn(global.window, 'removeEventListener');
    const { unmount } = await renderHook(() => useIsOnline());
    await act(async () => {
      unmount();
    });
    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
