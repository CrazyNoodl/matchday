/**
 * Regression coverage for #73: a media upload that failed while offline used
 * to only retry from the retry overlay on the specific match-detail screen
 * it lives on (handleRetryUpload in useMatchDetail.ts) — reopening the app
 * and reconnecting did nothing for it until the user happened to reopen that
 * exact match. useMediaRetryManager mounts once at the app root and retries
 * every pendingUpload item, across the open round and every archived round,
 * on the offline -> online transition.
 */

import { renderHook } from '@testing-library/react-native';
import { useStore } from '@/store';
import { uploadMediaItems } from '@/supabase/storage';
import { useMediaRetryManager } from '../useMediaRetryManager';
import type { Match, ArchivedRound } from '@/store/types';

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

jest.mock('@/supabase/client', () => ({
  supabaseConfigured: true,
  supabase: {},
}));

jest.mock('@/supabase/storage', () => ({
  uploadMediaItems: jest.fn(),
  deleteMediaItem: jest.fn().mockResolvedValue(undefined),
}));

const mockUploadMediaItems = uploadMediaItems as jest.MockedFunction<typeof uploadMediaItems>;

const makeMatch = (overrides: Partial<Match> = {}): Match => ({
  id: 'match-1',
  aId: 'p1',
  bId: 'p2',
  aScore: 2,
  bScore: 1,
  aTeam: 'JUV',
  bTeam: 'BAR',
  mediaFolder: 'match_2-1',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  useStore.getState().resetStore();
});

async function goOnline(rerender: (isOnline: boolean) => Promise<void> | void) {
  await rerender(true);
  // Let the retry loop's promise chain settle.
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

it('retries a pendingUpload item in the open round on reconnect and replaces it with the remote URL', async () => {
  useStore.setState({
    tournamentId: 'tour-1',
    roundFolder: 'matchday-2026-07-09_1000',
    matches: [
      makeMatch({
        media: [{ uri: 'file:///tmp/a.jpg', type: 'image', pendingUpload: true }],
      }),
    ],
  });
  mockUploadMediaItems.mockResolvedValueOnce([{ uri: 'https://cdn/a.jpg', type: 'image' }]);

  const { rerender } = await renderHook((isOnline: boolean) => useMediaRetryManager(isOnline), {
    initialProps: false,
  });
  await goOnline(rerender);

  expect(mockUploadMediaItems).toHaveBeenCalledWith(
    [{ uri: 'file:///tmp/a.jpg', type: 'image', pendingUpload: true }],
    { tournamentId: 'tour-1', mediaFolder: 'matchday-2026-07-09_1000/match_2-1' },
  );
  expect(useStore.getState().matches[0].media).toEqual([
    { uri: 'https://cdn/a.jpg', type: 'image' },
  ]);
});

it('retries pendingUpload items nested inside archived rounds', async () => {
  const archivedRound: ArchivedRound = {
    id: 'round-1',
    n: 1,
    date: '2026-07-08',
    winner: 'p1',
    games: 1,
    ranked: true,
    name: 'Round 1',
    folder: 'matchday-2026-07-08_1000',
    matches: [
      makeMatch({
        id: 'match-2',
        media: [{ uri: 'file:///tmp/b.jpg', type: 'image', pendingUpload: true }],
      }),
    ],
  };
  useStore.setState({ tournamentId: 'tour-1', archivedRounds: [archivedRound] });
  mockUploadMediaItems.mockResolvedValueOnce([{ uri: 'https://cdn/b.jpg', type: 'image' }]);

  const { rerender } = await renderHook((isOnline: boolean) => useMediaRetryManager(isOnline), {
    initialProps: false,
  });
  await goOnline(rerender);

  expect(useStore.getState().archivedRounds[0].matches[0].media).toEqual([
    { uri: 'https://cdn/b.jpg', type: 'image' },
  ]);
});

it('leaves a still-failing item pendingUpload rather than dropping it', async () => {
  useStore.setState({
    tournamentId: 'tour-1',
    matches: [
      makeMatch({ media: [{ uri: 'file:///tmp/a.jpg', type: 'image', pendingUpload: true }] }),
    ],
  });
  mockUploadMediaItems.mockResolvedValueOnce([
    { uri: 'file:///tmp/a.jpg', type: 'image', pendingUpload: true },
  ]);

  const { rerender } = await renderHook((isOnline: boolean) => useMediaRetryManager(isOnline), {
    initialProps: false,
  });
  await goOnline(rerender);

  expect(useStore.getState().matches[0].media).toEqual([
    { uri: 'file:///tmp/a.jpg', type: 'image', pendingUpload: true },
  ]);
});

it('does not touch already-uploaded media in the same match', async () => {
  useStore.setState({
    tournamentId: 'tour-1',
    matches: [
      makeMatch({
        media: [
          { uri: 'https://cdn/kept.jpg', type: 'image' },
          { uri: 'file:///tmp/a.jpg', type: 'image', pendingUpload: true },
        ],
      }),
    ],
  });
  mockUploadMediaItems.mockResolvedValueOnce([{ uri: 'https://cdn/a.jpg', type: 'image' }]);

  const { rerender } = await renderHook((isOnline: boolean) => useMediaRetryManager(isOnline), {
    initialProps: false,
  });
  await goOnline(rerender);

  expect(useStore.getState().matches[0].media).toEqual([
    { uri: 'https://cdn/kept.jpg', type: 'image' },
    { uri: 'https://cdn/a.jpg', type: 'image' },
  ]);
});

it('does nothing when there is no pendingUpload media anywhere', async () => {
  useStore.setState({
    matches: [makeMatch({ media: [{ uri: 'https://cdn/kept.jpg', type: 'image' }] })],
  });

  const { rerender } = await renderHook((isOnline: boolean) => useMediaRetryManager(isOnline), {
    initialProps: false,
  });
  await goOnline(rerender);

  expect(mockUploadMediaItems).not.toHaveBeenCalled();
});

it('does not retry while demo mode is active', async () => {
  useStore.setState({
    demoMode: true,
    matches: [
      makeMatch({ media: [{ uri: 'file:///tmp/a.jpg', type: 'image', pendingUpload: true }] }),
    ],
  });

  const { rerender } = await renderHook((isOnline: boolean) => useMediaRetryManager(isOnline), {
    initialProps: false,
  });
  await goOnline(rerender);

  expect(mockUploadMediaItems).not.toHaveBeenCalled();
});

it('does not run again just because the online state re-renders while already online', async () => {
  useStore.setState({
    tournamentId: 'tour-1',
    matches: [
      makeMatch({ media: [{ uri: 'file:///tmp/a.jpg', type: 'image', pendingUpload: true }] }),
    ],
  });
  mockUploadMediaItems.mockResolvedValue([{ uri: 'https://cdn/a.jpg', type: 'image' }]);

  const { rerender } = await renderHook((isOnline: boolean) => useMediaRetryManager(isOnline), {
    initialProps: true,
  });
  await rerender(true);
  await Promise.resolve();

  // Mounting already-online must not itself trigger a retry — only the
  // offline -> online transition does (matches the reconnect pattern in
  // useSyncManager).
  expect(mockUploadMediaItems).not.toHaveBeenCalled();
});
