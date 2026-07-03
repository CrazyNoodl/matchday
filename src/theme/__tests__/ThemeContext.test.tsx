import { renderHook } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { useEffectiveColorScheme } from '../ThemeContext';
import { useStore } from '@/store';

beforeEach(() => {
  jest.restoreAllMocks();
  useStore.getState().resetStore();
});

describe('useEffectiveColorScheme', () => {
  it('returns dark preference regardless of system scheme', async () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
    useStore.setState({ colorScheme: 'dark' });
    const { result } = await renderHook(() => useEffectiveColorScheme());
    expect(result.current).toBe('dark');
  });

  it('returns light preference regardless of system scheme', async () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    useStore.setState({ colorScheme: 'light' });
    const { result } = await renderHook(() => useEffectiveColorScheme());
    expect(result.current).toBe('light');
  });

  it('follows system scheme when preference is auto and system is light', async () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
    useStore.setState({ colorScheme: 'auto' });
    const { result } = await renderHook(() => useEffectiveColorScheme());
    expect(result.current).toBe('light');
  });

  it('follows system scheme when preference is auto and system is dark', async () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    useStore.setState({ colorScheme: 'auto' });
    const { result } = await renderHook(() => useEffectiveColorScheme());
    expect(result.current).toBe('dark');
  });

  it('defaults to dark when preference is auto and system scheme is unavailable', async () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(undefined as never);
    useStore.setState({ colorScheme: 'auto' });
    const { result } = await renderHook(() => useEffectiveColorScheme());
    expect(result.current).toBe('dark');
  });
});
