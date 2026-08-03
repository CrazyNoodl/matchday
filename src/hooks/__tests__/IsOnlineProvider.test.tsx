import React from 'react';
import { Text } from 'react-native';
import { render, renderHook } from '@testing-library/react-native';

import { IsOnlineProvider, useIsOnline } from '../IsOnlineProvider';

// The whole point of this context is to replace N independent detector
// subscriptions (one per screen calling useIsOnline() directly) with exactly
// one, mounted at the root. Mocking the detector lets these tests assert on
// the call count itself, not just the resulting value.
const mockDetector = jest.fn(() => true);
jest.mock('../useIsOnline', () => ({
  useIsOnline: () => mockDetector(),
}));

function Consumer({ testID }: { testID: string }) {
  const isOnline = useIsOnline();
  return <Text testID={testID}>{String(isOnline)}</Text>;
}

beforeEach(() => {
  mockDetector.mockClear();
  mockDetector.mockReturnValue(true);
});

describe('IsOnlineProvider / useIsOnline', () => {
  it('defaults to online when read outside a provider', async () => {
    const { result } = await renderHook(() => useIsOnline());
    expect(result.current).toBe(true);
  });

  it('shares one detector subscription across every consumer under the provider', async () => {
    const { getByTestId } = await render(
      <IsOnlineProvider>
        <Consumer testID="a" />
        <Consumer testID="b" />
        <Consumer testID="c" />
      </IsOnlineProvider>,
    );

    expect(getByTestId('a').props.children).toBe('true');
    expect(getByTestId('b').props.children).toBe('true');
    expect(getByTestId('c').props.children).toBe('true');
    // Regression guard: this must stay 1 regardless of how many consumers
    // read useIsOnline() below the provider — that's the fix for the
    // duplicate NetInfo/pingSupabase cycles bug.
    expect(mockDetector).toHaveBeenCalledTimes(1);
  });

  it('propagates an offline detector value to every consumer', async () => {
    mockDetector.mockReturnValue(false);

    const { getByTestId } = await render(
      <IsOnlineProvider>
        <Consumer testID="a" />
        <Consumer testID="b" />
      </IsOnlineProvider>,
    );

    expect(getByTestId('a').props.children).toBe('false');
    expect(getByTestId('b').props.children).toBe('false');
  });
});
