jest.mock('@/supabase/client', () => ({
  supabase: {
    auth: { getSession: jest.fn() },
    storage: {
      from: jest.fn(() => ({
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://cdn.example.com/file.jpg' } })),
        remove: jest.fn().mockResolvedValue({ error: null }),
      })),
    },
  },
  supabaseConfigured: true,
}));

jest.mock('@/supabase/auth', () => ({
  getCurrentUserId: jest.fn(),
}));

import { uploadMediaItem, uploadTeamLogo, deleteMediaItem } from '../storage';
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
