import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Avatar } from '../Avatar';
import { useStore } from '@/store';

jest.mock('@/store', () => ({
  useStore: jest.fn(),
}));

// expo-image needs expo-modules-core's native EventEmitter, which isn't set
// up under this project's @react-native/jest-preset — stand in with plain
// react-native Image, which supports the same source/onError props we use.
jest.mock('expo-image', () => ({
  Image: require('react-native').Image,
}));

const mockUseStore = useStore as unknown as jest.Mock;

function setState(players: any[], teams: any[]) {
  mockUseStore.mockImplementation((selector: any) => selector({ players, teams }));
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Avatar', () => {
  const player = { id: 'p1', name: 'Ada Lovelace', teamCode: 'ARS' };
  const team = { code: 'ARS', short: 'ARS', color: '#ff0000' };

  it('renders initials when the team has no logo', async () => {
    setState([player], [team]);
    const { getByText } = await render(<Avatar playerId="p1" />);
    expect(getByText('ARS')).toBeTruthy();
  });

  it('falls back to initials when the remote logo image fails to load', async () => {
    setState([player], [{ ...team, logo: 'https://example.com/logo.png' }]);
    const { getByText, getByTestId, queryByText } = await render(<Avatar playerId="p1" />);

    expect(queryByText('ARS')).toBeNull();

    const image = getByTestId('avatar-logo');
    await fireEvent(image, 'onError');

    expect(getByText('ARS')).toBeTruthy();
  });

  it('renders the player initials, not the team, when variant is "player"', async () => {
    setState([player], [{ ...team, logo: 'https://example.com/logo.png' }]);
    const { getByText, queryByText, queryByTestId } = await render(
      <Avatar playerId="p1" variant="player" />,
    );

    expect(getByText('AL')).toBeTruthy();
    expect(queryByText('ARS')).toBeNull();
    expect(queryByTestId('avatar-logo')).toBeNull();
  });
});
