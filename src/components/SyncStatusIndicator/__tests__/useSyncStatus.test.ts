import { renderHook } from '@testing-library/react-native';
import { useStore } from '@/store';
import { useSyncStatus } from '../useSyncStatus';

jest.mock('@/store', () => ({
  useStore: jest.fn(),
}));

jest.mock('@/supabase/client', () => ({
  supabaseConfigured: true,
}));

const mockUseStore = useStore as unknown as jest.Mock;

function setState(state: Record<string, unknown>) {
  const full = {
    syncStatus: 'idle',
    pendingSyncTables: [],
    matches: [],
    archivedRounds: [],
    demoMode: false,
    ...state,
  };
  mockUseStore.mockImplementation((selector: any) => selector(full));
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useSyncStatus', () => {
  it('is not visible when idle with nothing pending', async () => {
    setState({});
    const { result } = await renderHook(() => useSyncStatus());
    expect(result.current.visible).toBe(false);
  });

  it('is visible while syncing even with nothing pending', async () => {
    setState({ syncStatus: 'syncing' });
    const { result } = await renderHook(() => useSyncStatus());
    expect(result.current.visible).toBe(true);
    expect(result.current.isSyncing).toBe(true);
  });

  it('is visible and reports pendingCount from pendingSyncTables', async () => {
    setState({ pendingSyncTables: ['players', 'openMatches'] });
    const { result } = await renderHook(() => useSyncStatus());
    expect(result.current.visible).toBe(true);
    expect(result.current.pendingCount).toBe(2);
  });

  it('adds pendingUpload media across matches and archivedRounds to the count', async () => {
    setState({
      matches: [
        { id: 'm1', media: [{ uri: 'file:///a.jpg', type: 'image', pendingUpload: true }] },
      ],
      archivedRounds: [
        {
          matches: [
            { id: 'm2', media: [{ uri: 'file:///b.jpg', type: 'image', pendingUpload: true }] },
          ],
        },
      ],
    });
    const { result } = await renderHook(() => useSyncStatus());
    expect(result.current.pendingCount).toBe(2);
  });

  it('is visible on error regardless of pendingCount', async () => {
    setState({ syncStatus: 'error' });
    const { result } = await renderHook(() => useSyncStatus());
    expect(result.current.visible).toBe(true);
    expect(result.current.isError).toBe(true);
  });

  it('is hidden during demo mode even with a pending count', async () => {
    setState({ pendingSyncTables: ['players'], demoMode: true });
    const { result } = await renderHook(() => useSyncStatus());
    expect(result.current.visible).toBe(false);
  });
});
