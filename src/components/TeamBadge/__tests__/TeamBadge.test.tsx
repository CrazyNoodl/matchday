import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TeamBadge } from '../TeamBadge';
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

function setTeams(teams: { code: string; short: string; color: string; logo?: string }[]) {
  mockUseStore.mockImplementation((selector: any) => selector({ teams }));
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TeamBadge', () => {
  it('renders initials when the team has no logo', async () => {
    setTeams([{ code: 'ARS', short: 'ARS', color: '#ff0000' }]);
    const { getByText } = await render(<TeamBadge teamCode="ARS" />);
    expect(getByText('ARS')).toBeTruthy();
  });

  it('falls back to initials when the remote logo image fails to load', async () => {
    setTeams([{ code: 'ARS', short: 'ARS', color: '#ff0000', logo: 'https://example.com/logo.png' }]);
    const { getByText, getByTestId, queryByText } = await render(<TeamBadge teamCode="ARS" />);

    expect(queryByText('ARS')).toBeNull();

    const image = getByTestId('team-badge-logo');
    await fireEvent(image, 'onError');

    expect(getByText('ARS')).toBeTruthy();
  });
});
