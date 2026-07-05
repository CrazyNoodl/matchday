jest.mock('@/supabase/client', () => ({
  supabase: {
    auth: { getSession: jest.fn() },
    storage: {
      from: jest.fn(() => ({
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://cdn.example.com/file.jpg' } })),
        remove: jest.fn().mockResolvedValue({ error: null }),
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
  },
  supabaseConfigured: true,
}));

jest.mock('@/supabase/auth', () => ({
  getCurrentUserId: jest.fn(),
}));

import {
  uploadMediaItem,
  uploadTeamLogo,
  deleteMediaItem,
  deleteStorageFolder,
  buildRoundFolder,
  buildMatchFolder,
} from '../storage';
import { supabase } from '@/supabase/client';
import { getCurrentUserId } from '@/supabase/auth';

const mockGetSession = supabase.auth.getSession as jest.Mock;
const mockGetCurrentUserId = getCurrentUserId as jest.Mock;
const mockFetch = jest.fn();

beforeAll(() => {
  global.fetch = mockFetch;
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetCurrentUserId.mockResolvedValue('user-123');
  mockGetSession.mockResolvedValue({ data: { session: { access_token: 'token-abc' } } });
});

const makeLocalFetchResponse = (arrayBuffer = new ArrayBuffer(8)) => ({
  arrayBuffer: jest.fn().mockResolvedValue(arrayBuffer),
});
const makeUploadFetchResponse = (ok = true) => ({
  ok,
  text: jest.fn().mockResolvedValue(ok ? '' : 'Forbidden'),
});

// ── uploadMediaItem ───────────────────────────────────────────────────────────

describe('uploadMediaItem', () => {
  it('reads the file via arrayBuffer(), never via blob()', async () => {
    const localResponse = makeLocalFetchResponse();
    mockFetch
      .mockResolvedValueOnce(localResponse)
      .mockResolvedValueOnce(makeUploadFetchResponse());

    await uploadMediaItem('file://photo.jpg', 'image');

    expect(localResponse.arrayBuffer).toHaveBeenCalled();
    expect((localResponse as any).blob).toBeUndefined();
  });

  it('POSTs to Supabase storage REST endpoint with correct headers and binary body', async () => {
    const buf = new ArrayBuffer(8);
    mockFetch
      .mockResolvedValueOnce(makeLocalFetchResponse(buf))
      .mockResolvedValueOnce(makeUploadFetchResponse());

    await uploadMediaItem('file://photo.jpg', 'image');

    const [uploadUrl, uploadOpts] = mockFetch.mock.calls[1];
    expect(uploadUrl).toMatch(/https:\/\/project\.supabase\.co\/storage\/v1\/object\/match-media\//);
    expect(uploadOpts.method).toBe('POST');
    expect(uploadOpts.headers['Authorization']).toBe('Bearer token-abc');
    expect(uploadOpts.headers['apikey']).toBe('anon-key');
    expect(uploadOpts.headers['Content-Type']).toBe('image/jpeg');
    expect(uploadOpts.body).toBe(buf);
  });

  it('uses video/mp4 content-type for video uploads', async () => {
    mockFetch
      .mockResolvedValueOnce(makeLocalFetchResponse())
      .mockResolvedValueOnce(makeUploadFetchResponse());

    await uploadMediaItem('file://clip.mp4', 'video');

    const [, uploadOpts] = mockFetch.mock.calls[1];
    expect(uploadOpts.headers['Content-Type']).toBe('video/mp4');
  });

  it('returns public URL on success', async () => {
    mockFetch
      .mockResolvedValueOnce(makeLocalFetchResponse())
      .mockResolvedValueOnce(makeUploadFetchResponse(true));

    const result = await uploadMediaItem('file://photo.jpg', 'image');
    expect(result).toBe('https://cdn.example.com/file.jpg');
  });

  it('returns null when upload response is not ok', async () => {
    mockFetch
      .mockResolvedValueOnce(makeLocalFetchResponse())
      .mockResolvedValueOnce(makeUploadFetchResponse(false));

    const result = await uploadMediaItem('file://photo.jpg', 'image');
    expect(result).toBeNull();
  });

  it('returns null when no auth session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const result = await uploadMediaItem('file://photo.jpg', 'image');
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns null when no userId', async () => {
    mockGetCurrentUserId.mockResolvedValue(null);

    const result = await uploadMediaItem('file://photo.jpg', 'image');
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('nests the upload path under tournamentId/mediaFolder when context is given (#67)', async () => {
    mockFetch
      .mockResolvedValueOnce(makeLocalFetchResponse())
      .mockResolvedValueOnce(makeUploadFetchResponse());

    await uploadMediaItem('file://photo.jpg', 'image', {
      tournamentId: 'tour-1',
      mediaFolder: 'matchday-2026-07-03_1430/match_2-1_2026-07-03_1432',
    });

    const [uploadUrl] = mockFetch.mock.calls[1];
    expect(uploadUrl).toContain(
      '/user-123/tour-1/matchday-2026-07-03_1430/match_2-1_2026-07-03_1432/',
    );
  });
});

// ── buildRoundFolder / buildMatchFolder ─────────────────────────────────────

describe('buildRoundFolder / buildMatchFolder', () => {
  it('formats the round folder as matchday-{date}_{HHmm}', () => {
    const date = new Date(2026, 6, 3, 14, 30); // months are 0-indexed
    expect(buildRoundFolder(date)).toBe('matchday-2026-07-03_1430');
  });

  it('formats the match folder as match_{aScore}-{bScore}_{date}_{HHmm}', () => {
    const date = new Date(2026, 6, 3, 14, 32);
    expect(buildMatchFolder(2, 1, date)).toBe('match_2-1_2026-07-03_1432');
  });

  it('zero-pads month, day, hour, and minute', () => {
    const date = new Date(2026, 0, 5, 9, 5);
    expect(buildRoundFolder(date)).toBe('matchday-2026-01-05_0905');
  });
});

// ── deleteStorageFolder ──────────────────────────────────────────────────────

describe('deleteStorageFolder', () => {
  it('removes every file found at the prefix', async () => {
    const mockList = jest.fn().mockResolvedValue({
      data: [
        { name: 'a.jpg', id: 'file-1' },
        { name: 'b.jpg', id: 'file-2' },
      ],
      error: null,
    });
    const mockRemove = jest.fn().mockResolvedValue({ error: null });
    (supabase.storage.from as jest.Mock).mockReturnValue({ list: mockList, remove: mockRemove });

    await deleteStorageFolder('tour-1/matchday-2026-07-03_1430');

    expect(mockList).toHaveBeenCalledWith('user-123/tour-1/matchday-2026-07-03_1430', { limit: 1000 });
    expect(mockRemove).toHaveBeenCalledWith([
      'user-123/tour-1/matchday-2026-07-03_1430/a.jpg',
      'user-123/tour-1/matchday-2026-07-03_1430/b.jpg',
    ]);
  });

  it('recurses into nested pseudo-folders (id === null) before removing', async () => {
    const mockList = jest.fn()
      .mockResolvedValueOnce({
        data: [{ name: 'match_2-1_2026-07-03_1432', id: null }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ name: 'photo.jpg', id: 'file-1' }],
        error: null,
      });
    const mockRemove = jest.fn().mockResolvedValue({ error: null });
    (supabase.storage.from as jest.Mock).mockReturnValue({ list: mockList, remove: mockRemove });

    await deleteStorageFolder('tour-1/matchday-2026-07-03_1430');

    expect(mockList).toHaveBeenCalledTimes(2);
    expect(mockRemove).toHaveBeenCalledWith([
      'user-123/tour-1/matchday-2026-07-03_1430/match_2-1_2026-07-03_1432/photo.jpg',
    ]);
  });

  it('does nothing when the prefix has no files', async () => {
    const mockList = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockRemove = jest.fn();
    (supabase.storage.from as jest.Mock).mockReturnValue({ list: mockList, remove: mockRemove });

    await deleteStorageFolder('tour-1/empty-round');

    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('is a no-op when there is no signed-in user', async () => {
    mockGetCurrentUserId.mockResolvedValue(null);
    const mockList = jest.fn();
    (supabase.storage.from as jest.Mock).mockReturnValue({ list: mockList, remove: jest.fn() });

    await deleteStorageFolder('tour-1/round');

    expect(mockList).not.toHaveBeenCalled();
  });
});

// ── uploadTeamLogo ────────────────────────────────────────────────────────────

describe('uploadTeamLogo', () => {
  it('POSTs to team-logos path with image/jpeg content-type', async () => {
    mockFetch
      .mockResolvedValueOnce(makeLocalFetchResponse())
      .mockResolvedValueOnce(makeUploadFetchResponse());

    await uploadTeamLogo('file://logo.jpg');

    const [uploadUrl, uploadOpts] = mockFetch.mock.calls[1];
    expect(uploadUrl).toMatch(/\/team-logos\//);
    expect(uploadOpts.headers['Content-Type']).toBe('image/jpeg');
  });

  it('returns null on failed upload', async () => {
    mockFetch
      .mockResolvedValueOnce(makeLocalFetchResponse())
      .mockResolvedValueOnce(makeUploadFetchResponse(false));

    const result = await uploadTeamLogo('file://logo.jpg');
    expect(result).toBeNull();
  });
});

// ── deleteMediaItem ───────────────────────────────────────────────────────────

describe('deleteMediaItem', () => {
  it('calls storage.remove with the extracted path', async () => {
    const mockRemove = jest.fn().mockResolvedValue({ error: null });
    (supabase.storage.from as jest.Mock).mockReturnValue({ remove: mockRemove, getPublicUrl: jest.fn() });

    await deleteMediaItem('https://project.supabase.co/storage/v1/object/public/match-media/user-123/file.jpg');

    expect(mockRemove).toHaveBeenCalledWith(['user-123/file.jpg']);
  });

  it('skips deletion for local URIs', async () => {
    const mockRemove = jest.fn();
    (supabase.storage.from as jest.Mock).mockReturnValue({ remove: mockRemove, getPublicUrl: jest.fn() });

    await deleteMediaItem('file://local.jpg');
    expect(mockRemove).not.toHaveBeenCalled();
  });
});
