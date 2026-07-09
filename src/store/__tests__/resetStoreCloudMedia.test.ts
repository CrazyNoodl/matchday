/**
 * resetStore() is used for two very different intents: the user-facing
 * "Reset All Data" (a genuine full wipe, cloud included) and sign-out's
 * local-only cache clear (must never touch the cloud). Both used to share
 * one unconditional deleteMediaItem() sweep over every match/player/team
 * media URI — including whatever sat in realDataBackup from an active Demo
 * Mode session. Deleting cloud media must now be an explicit opt-in via
 * `resetStore({ deleteCloudMedia: true })`, not resetStore()'s default.
 */

import { useStore } from '../index';
import { deleteMediaItem } from '../../supabase/storage';
import type { Player, Team, Match } from '../types';

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: () => null,
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

jest.mock('../../supabase/storage', () => ({
  deleteMediaItem: jest.fn().mockResolvedValue(undefined),
}));

const mockDeleteMediaItem = deleteMediaItem as jest.MockedFunction<typeof deleteMediaItem>;

const player: Player = { id: 'p1', name: 'Alice', teamCode: 'JUV', photo: 'https://cdn/p1.jpg' };
const team: Team = {
  code: 'JUV',
  name: 'Juventus',
  short: 'JUV',
  color: '#000',
  custom: false,
  logo: 'https://cdn/juv.jpg',
};
const match: Match = {
  id: 'm1',
  aId: 'p1',
  bId: 'p2',
  aTeam: 'JUV',
  bTeam: 'TOT',
  aScore: 1,
  bScore: 0,
  media: [{ uri: 'https://cdn/m1.jpg', type: 'image' }],
};

beforeEach(() => {
  jest.clearAllMocks();
  useStore.getState().resetStore();
  jest.clearAllMocks(); // clear the call recorded by the beforeEach reset itself
});

it('does not delete cloud media by default (sign-out\'s local-only cache clear)', async () => {
  useStore.setState({ players: [player], teams: [team], matches: [match] });

  await useStore.getState().resetStore();

  expect(mockDeleteMediaItem).not.toHaveBeenCalled();
  expect(useStore.getState().players).toHaveLength(0);
});

it('deletes cloud media when explicitly requested ("Reset All Data")', async () => {
  useStore.setState({ players: [player], teams: [team], matches: [match] });

  await useStore.getState().resetStore({ deleteCloudMedia: true });

  const deletedUris = mockDeleteMediaItem.mock.calls.map(([uri]) => uri);
  expect(deletedUris).toEqual(
    expect.arrayContaining(['https://cdn/p1.jpg', 'https://cdn/juv.jpg', 'https://cdn/m1.jpg']),
  );
});

it('does not leak Demo Mode\'s backed-up real media into a plain sign-out wipe', async () => {
  useStore.setState({
    demoMode: true,
    realDataBackup: {
      tournamentId: '',
      hasTournament: false,
      tournamentName: '',
      round: 0,
      roundOpen: false,
      tournamentRanked: true,
      tournamentRounds: 0,
      tournamentPlayers: [],
      roundPlayers: [],
      matches: [match],
      archivedRounds: [],
      closedTournaments: [],
      players: [player],
      teams: [team],
    },
  });

  await useStore.getState().resetStore();

  expect(mockDeleteMediaItem).not.toHaveBeenCalled();
});
