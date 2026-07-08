// useGoBack is a plain hook with no state/effects — safe to call directly in tests
import { useGoBack } from '../useGoBack';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useGoBack', () => {
  it('calls router.back() when there is history', () => {
    mockCanGoBack.mockReturnValue(true);
    const goBack = useGoBack();
    goBack();
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('calls router.replace("/") when there is no history', () => {
    mockCanGoBack.mockReturnValue(false);
    const goBack = useGoBack();
    goBack();
    expect(mockReplace).toHaveBeenCalledWith('/');
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('uses a custom fallback path when provided', () => {
    mockCanGoBack.mockReturnValue(false);
    const goBack = useGoBack('/matchday');
    goBack();
    expect(mockReplace).toHaveBeenCalledWith('/matchday');
  });
});
