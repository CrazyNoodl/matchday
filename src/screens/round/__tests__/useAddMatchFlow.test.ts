import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadMediaItems } from '@/supabase/storage';
import { extractStatsFromPhoto } from '@/utils/extractStats';
import { useAddMatchFlow } from '../useAddMatchFlow';
import { initAddMatch } from '@/utils/addMatchState';
import type { Match, Player } from '@/store/types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('@/supabase/storage', () => ({
  uploadMediaItems: jest.fn(),
  buildMatchFolder: jest.fn((a: number, b: number) => `match_${a}-${b}_test-stamp`),
}));

jest.mock('@/utils/extractStats', () => ({
  extractStatsFromPhoto: jest.fn(),
}));

// Resize is a pass-through here — its own behavior is covered by imageResize.test.ts
jest.mock('@/utils/imageResize', () => ({
  resizeImage: jest.fn((uri: string) => Promise.resolve({ uri })),
  MEDIA_MAX_DIMENSION: 2000,
  OCR_PAYLOAD_MAX_DIMENSION: 2000,
  STAT_PHOTO_STORAGE_MAX_DIMENSION: 1200,
  TEAM_LOGO_MAX_DIMENSION: 600,
}));

const mockUpload = uploadMediaItems as jest.Mock;
const mockPicker = ImagePicker.launchImageLibraryAsync as jest.Mock;
const mockExtractStats = extractStatsFromPhoto as jest.Mock;
const mockResizeImage = require('@/utils/imageResize').resizeImage as jest.Mock;

const PLAYERS: Player[] = [
  { id: 'p1', name: 'Alice', teamCode: 'JUV' },
  { id: 'p2', name: 'Bob', teamCode: 'BAR' },
];

async function makeHook(overrides: Partial<Parameters<typeof useAddMatchFlow>[0]> = {}) {
  const addMatchToStore = jest.fn();
  const closeModal = jest.fn();
  const hook = await renderHook(() =>
    useAddMatchFlow({
      tournamentRanked: true,
      tournamentId: 'test-tournament',
      roundFolder: 'matchday-2026-01-01_1200',
      players: PLAYERS,
      addMatchToStore,
      closeModal,
      ...overrides,
    }),
  );
  return { ...hook, addMatchToStore, closeModal };
}

beforeEach(() => {
  // resetAllMocks clears mockResolvedValueOnce queues; clearAllMocks does not
  jest.resetAllMocks();
  mockUpload.mockResolvedValue([]);
  mockExtractStats.mockResolvedValue([]);
  mockResizeImage.mockImplementation((uri: string) => Promise.resolve({ uri }));
});

// ---------------------------------------------------------------------------
// Bug 1 — handleRemoveMedia must clear pendingStats / ocrPhotos after OCR ran
// ---------------------------------------------------------------------------

describe('handleRemoveMedia — ghost stats fix', () => {
  it('clears pendingStats and resets ocrStatus to idle when a photo is removed after OCR', async () => {
    const { result } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        ocrStatus: 'done',
        ocrScanning: false,
        pendingStats: { shots: { a: 5, b: 3 } },
        media: [{ uri: 'file://photo.jpg', type: 'image' }],
        ocrPhotos: [{ asset: { base64: 'abc123', mimeType: 'image/jpeg' }, stats: [] }],
      });
    });

    await act(async () => {
      result.current.handleRemoveMedia(0);
    });

    const s = result.current.addMatch;
    expect(s.media).toHaveLength(0);
    expect(s.pendingStats).toBeNull();
    expect(s.ocrStatus).toBe('idle');
    expect(s.ocrPhotos).toHaveLength(0);
    expect(s.ocrScanning).toBe(false);
  });

  it('clears OCR state when photo is removed after skipped OCR', async () => {
    const { result } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        ocrStatus: 'skipped',
        ocrScanning: false,
        pendingStats: null,
        media: [
          { uri: 'file://a.jpg', type: 'image' },
          { uri: 'file://b.jpg', type: 'image' },
        ],
        ocrPhotos: [{ asset: { base64: 'x', mimeType: 'image/jpeg' }, stats: null }],
      });
    });

    await act(async () => {
      result.current.handleRemoveMedia(0);
    });

    expect(result.current.addMatch.ocrStatus).toBe('idle');
    expect(result.current.addMatch.ocrPhotos).toHaveLength(0);
  });

  it('leaves ocrStatus unchanged when removing media before any OCR', async () => {
    const { result } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        ocrStatus: 'idle',
        media: [{ uri: 'file://video.mp4', type: 'video' }],
      });
    });

    await act(async () => {
      result.current.handleRemoveMedia(0);
    });

    expect(result.current.addMatch.ocrStatus).toBe('idle');
    expect(result.current.addMatch.media).toHaveLength(0);
  });

  it('blocks removal while OCR is scanning', async () => {
    const { result } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        ocrStatus: 'scanning',
        ocrScanning: true,
        media: [{ uri: 'file://photo.jpg', type: 'image' }],
      });
    });

    await act(async () => {
      result.current.handleRemoveMedia(0);
    });

    expect(result.current.addMatch.media).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Bug 2 — handleSaveMatch must show an Alert on upload failure
// ---------------------------------------------------------------------------

describe('handleSaveMatch — upload error handling', () => {
  it('sets showSaveError and keeps modal open when uploadMediaItems throws', async () => {
    mockUpload.mockRejectedValueOnce(new Error('network error'));
    const { result, closeModal } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        homeId: 'p1',
        awayId: 'p2',
        media: [{ uri: 'file://photo.jpg', type: 'image' }],
      });
    });

    await act(async () => {
      await result.current.handleSaveMatch();
    });

    expect(result.current.showSaveError).toBe(true);
    expect(closeModal).not.toHaveBeenCalled();
    expect(result.current.isSavingMatch).toBe(false);
  });

  it('saves match and closes modal on success', async () => {
    const { result, addMatchToStore, closeModal } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        homeId: 'p1',
        awayId: 'p2',
        homeScore: 2,
        awayScore: 1,
      });
    });

    await act(async () => {
      await result.current.handleSaveMatch();
    });

    expect(addMatchToStore).toHaveBeenCalledTimes(1);
    const saved: Match = addMatchToStore.mock.calls[0][0];
    expect(saved.aId).toBe('p1');
    expect(saved.bId).toBe('p2');
    expect(saved.aScore).toBe(2);
    expect(saved.bScore).toBe(1);
    expect(closeModal).toHaveBeenCalledTimes(1);
    expect(result.current.showSaveError).toBe(false);
  });

  it('does not call store when homeId is missing', async () => {
    const { result, addMatchToStore } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({ ...initAddMatch(), homeId: null, awayId: 'p2' });
    });

    await act(async () => {
      await result.current.handleSaveMatch();
    });

    expect(addMatchToStore).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Bug 3 — handlePickMedia must combine ocrPhotos across multiple picks,
//          and (#71) must not re-scan photos already scanned in a prior pick
// ---------------------------------------------------------------------------

describe('handlePickMedia — video upload disabled (#59)', () => {
  it('requests images only from the picker', async () => {
    mockPicker.mockResolvedValueOnce({ canceled: true });
    const { result } = await makeHook();
    await act(async () => {
      await result.current.handlePickMedia();
    });
    expect(mockPicker).toHaveBeenCalledWith(expect.objectContaining({ mediaTypes: ['images'] }));
  });
});

describe('handlePickMedia — multi-batch OCR asset accumulation', () => {
  it('does not re-scan an already-scanned photo when a new one is added (#71)', async () => {
    mockExtractStats.mockResolvedValue([]);
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: 'file://new.jpg',
          type: 'image',
          base64: 'newBase64',
          mimeType: 'image/jpeg',
        },
      ],
    });

    const { result } = await makeHook();

    // Simulate state after a previous OCR run — old photo already has stats
    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        ocrStatus: 'done',
        ocrPhotos: [
          {
            asset: { base64: 'oldBase64', mimeType: 'image/jpeg' },
            stats: [{ key: 'shots', label: 'Shots', home: 3, away: 2, confidence: 'high' }],
          },
        ],
        media: [{ uri: 'file://old.jpg', type: 'image' }],
        pendingStats: { shots: { a: 3, b: 2 } },
      });
    });

    await act(async () => {
      await result.current.handlePickMedia();
    });

    await waitFor(() => {
      expect(result.current.addMatch.ocrStatus).toBe('done');
    });

    // Only the new photo is sent to the AI provider — the already-scanned one isn't
    expect(mockExtractStats).toHaveBeenCalledTimes(1);
    expect(mockExtractStats).toHaveBeenCalledWith('newBase64', 'image/jpeg');

    // Old photo's stats survive, merged with whatever the new photo produced
    expect(result.current.addMatch.pendingStats).toEqual({ shots: { a: 3, b: 2 } });
  });

  it('calls OCR only once on the first pick when ocrPhotos is empty', async () => {
    mockExtractStats.mockResolvedValue([]);
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: 'file://first.jpg',
          type: 'image',
          base64: 'firstBase64',
          mimeType: 'image/jpeg',
        },
      ],
    });

    const { result } = await makeHook();

    await act(async () => {
      await result.current.handlePickMedia();
    });

    await waitFor(() => {
      expect(mockExtractStats).toHaveBeenCalledTimes(1);
    });

    expect(mockExtractStats).toHaveBeenCalledWith('firstBase64', 'image/jpeg');
  });

  it('does not trigger OCR when only videos are picked', async () => {
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: 'file://clip.mp4',
          type: 'video',
          base64: null,
          mimeType: 'video/mp4',
        },
      ],
    });

    const { result } = await makeHook();

    await act(async () => {
      await result.current.handlePickMedia();
    });

    expect(mockExtractStats).not.toHaveBeenCalled();
    expect(result.current.addMatch.media).toHaveLength(1);
    expect(result.current.addMatch.ocrStatus).toBe('idle');
  });
});

// ---------------------------------------------------------------------------
// Bug 4 — handlePickMedia must not start a second OCR run while scanning
//          (Add Media button was missing disabled guard during scanning)
// ---------------------------------------------------------------------------

describe('handlePickMedia — blocked during active OCR scan', () => {
  it('does not start a second OCR run when called while ocrStatus is scanning', async () => {
    // Simulate first OCR run in progress
    mockExtractStats.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves in this test */
        }),
    );
    mockPicker
      .mockResolvedValueOnce({
        canceled: false,
        assets: [
          { uri: 'file://img1.jpg', type: 'image', base64: 'base1', mimeType: 'image/jpeg' },
        ],
      })
      .mockResolvedValueOnce({
        canceled: false,
        assets: [
          { uri: 'file://img2.jpg', type: 'image', base64: 'base2', mimeType: 'image/jpeg' },
        ],
      });

    const { result } = await makeHook();

    // First pick — starts OCR, never resolves
    await act(async () => {
      result.current.handlePickMedia();
    });

    await waitFor(() => {
      expect(result.current.addMatch.ocrStatus).toBe('scanning');
    });

    const callsAfterFirstPick = mockExtractStats.mock.calls.length;

    // Second pick attempt while scanning — should not trigger another OCR run
    await act(async () => {
      result.current.handlePickMedia();
    });

    // extractStatsFromPhoto must not have been called more times
    expect(mockExtractStats.mock.calls.length).toBe(callsAfterFirstPick);
  });
});

// ---------------------------------------------------------------------------
// Bug 5 — handleRetryOcr must not call runOcr inside a setState updater
//          (side effect in pure updater fires twice in StrictMode)
// ---------------------------------------------------------------------------

describe('handleRetryOcr — no side effect inside setState', () => {
  it('triggers exactly one OCR run on retry', async () => {
    mockExtractStats.mockResolvedValue([]);
    const { result } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        ocrStatus: 'error',
        ocrScanning: false,
        ocrPhotos: [{ asset: { base64: 'img1', mimeType: 'image/jpeg' }, stats: null }],
      });
    });

    await act(async () => {
      result.current.handleRetryOcr();
    });

    await waitFor(() => {
      expect(result.current.addMatch.ocrStatus).not.toBe('error');
    });

    // Must call extractStatsFromPhoto exactly once for the one asset
    expect(mockExtractStats).toHaveBeenCalledTimes(1);
    expect(mockExtractStats).toHaveBeenCalledWith('img1', 'image/jpeg');
  });

  it('does nothing when ocrPhotos is empty', async () => {
    const { result } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        ocrStatus: 'error',
        ocrPhotos: [],
      });
    });

    await act(async () => {
      result.current.handleRetryOcr();
    });

    expect(mockExtractStats).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Bug 6 — Back must be blocked during save to prevent ghost saves
// ---------------------------------------------------------------------------

describe('handleBack — blocked during save', () => {
  it('does not navigate back while isSavingMatch is true, save still completes', async () => {
    let resolveUpload!: (v: never[]) => void;
    mockUpload.mockReturnValueOnce(
      new Promise<never[]>((res) => {
        resolveUpload = res;
      }),
    );

    const { result, addMatchToStore, closeModal } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        step: 4,
        homeId: 'p1',
        awayId: 'p2',
        media: [{ uri: 'file://photo.jpg', type: 'image' }],
      });
    });

    // Start save — flush the synchronous setIsSavingMatch(true) state update
    await act(async () => {
      result.current.handleSaveMatch();
    });

    // Upload is still pending; isSavingMatch should be true
    expect(result.current.isSavingMatch).toBe(true);

    // Try to go back while saving — must be a no-op
    await act(async () => {
      result.current.handleBack();
    });
    expect(result.current.addMatch.step).toBe(4);
    expect(closeModal).not.toHaveBeenCalled();

    // Resolve upload and let everything settle
    await act(async () => {
      resolveUpload([]);
    });
    await waitFor(() => expect(result.current.isSavingMatch).toBe(false));

    expect(addMatchToStore).toHaveBeenCalledTimes(1);
    expect(closeModal).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Bug 7 — handleBack step <= 1: closeModal must be called outside setState
//          (side effect in pure updater fires twice in StrictMode)
// ---------------------------------------------------------------------------

describe('handleBack — side-effect-free state update on cancel', () => {
  it('calls closeModal exactly once when cancelling from step 1', async () => {
    const { result, closeModal } = await makeHook();

    await act(async () => {
      result.current.handleBack();
    });

    expect(closeModal).toHaveBeenCalledTimes(1);
    // State is reset after cancel
    expect(result.current.addMatch.step).toBe(1);
    expect(result.current.addMatch.homeId).toBeNull();
  });

  it('decrements step without calling closeModal when step > 1', async () => {
    const { result, closeModal } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({ ...initAddMatch(), step: 3 });
    });

    await act(async () => {
      result.current.handleBack();
    });

    expect(result.current.addMatch.step).toBe(2);
    expect(closeModal).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Bug 8 — handleSaveMatch must guard against concurrent invocation
// ---------------------------------------------------------------------------

describe('handleSaveMatch — double-save guard', () => {
  it('does not call addMatchToStore twice when invoked while already saving', async () => {
    let resolveFirst!: (v: never[]) => void;
    mockUpload.mockReturnValueOnce(
      new Promise<never[]>((res) => {
        resolveFirst = res;
      }),
    );

    const { result, addMatchToStore } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        homeId: 'p1',
        awayId: 'p2',
        media: [{ uri: 'file://photo.jpg', type: 'image' }],
      });
    });

    // Start first save — upload is blocking
    await act(async () => {
      result.current.handleSaveMatch();
    });
    expect(result.current.isSavingMatch).toBe(true);

    // Try to fire save again while first is in progress — should be no-op
    await act(async () => {
      await result.current.handleSaveMatch();
    });

    // Resolve first upload
    await act(async () => {
      resolveFirst([]);
    });
    await waitFor(() => expect(result.current.isSavingMatch).toBe(false));

    // Only one match saved despite two calls
    expect(addMatchToStore).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Bug 9 — handleRemoveMedia must NOT reset OCR state when a video is removed
// ---------------------------------------------------------------------------

describe('handleRemoveMedia — video removal preserves OCR state', () => {
  it('preserves pendingStats and ocrStatus when a video is removed after OCR', async () => {
    const { result } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        ocrStatus: 'done',
        ocrScanning: false,
        pendingStats: { shots: { a: 5, b: 3 } },
        ocrPhotos: [
          {
            asset: { base64: 'img1', mimeType: 'image/jpeg' },
            stats: [{ key: 'shots', label: 'Shots', home: 5, away: 3, confidence: 'high' }],
          },
        ],
        media: [
          { uri: 'file://img1.jpg', type: 'image' },
          { uri: 'file://clip.mp4', type: 'video' },
        ],
      });
    });

    // Remove the video (index 1)
    await act(async () => {
      result.current.handleRemoveMedia(1);
    });

    const s = result.current.addMatch;
    expect(s.media).toHaveLength(1);
    expect(s.media[0].type).toBe('image');
    // OCR data must be untouched
    expect(s.ocrStatus).toBe('done');
    expect(s.pendingStats).toEqual({ shots: { a: 5, b: 3 } });
    expect(s.ocrPhotos).toHaveLength(1);
  });

  it('still resets OCR state when an image is removed', async () => {
    const { result } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        ocrStatus: 'done',
        pendingStats: { shots: { a: 5, b: 3 } },
        ocrPhotos: [
          {
            asset: { base64: 'img1', mimeType: 'image/jpeg' },
            stats: [{ key: 'shots', label: 'Shots', home: 5, away: 3, confidence: 'high' }],
          },
        ],
        media: [
          { uri: 'file://img1.jpg', type: 'image' },
          { uri: 'file://clip.mp4', type: 'video' },
        ],
      });
    });

    // Remove the image (index 0) — no images left, so this is the full-reset case
    await act(async () => {
      result.current.handleRemoveMedia(0);
    });

    const s = result.current.addMatch;
    expect(s.ocrStatus).toBe('idle');
    expect(s.pendingStats).toBeNull();
    expect(s.ocrPhotos).toHaveLength(0);
  });

  it('preserves OCR state on video removal when ocrStatus is skipped', async () => {
    const { result } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        ocrStatus: 'skipped',
        ocrPhotos: [{ asset: { base64: 'img1', mimeType: 'image/jpeg' }, stats: null }],
        media: [
          { uri: 'file://img1.jpg', type: 'image' },
          { uri: 'file://clip.mp4', type: 'video' },
        ],
      });
    });

    await act(async () => {
      result.current.handleRemoveMedia(1);
    });

    expect(result.current.addMatch.ocrStatus).toBe('skipped');
    expect(result.current.addMatch.ocrPhotos).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// #71 — handleRemoveMedia must re-derive pendingStats per-photo, not wipe
//        everything, and self-heal an error state when the bad photo is gone
// ---------------------------------------------------------------------------

describe('handleRemoveMedia — per-photo incremental removal (#71)', () => {
  it('re-derives pendingStats from the surviving photo when a non-last image is removed', async () => {
    const { result } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        ocrStatus: 'done',
        pendingStats: { shots: { a: 5, b: 3 }, possession: { a: 60, b: 40 } },
        media: [
          { uri: 'file://img1.jpg', type: 'image' },
          { uri: 'file://img2.jpg', type: 'image' },
        ],
        ocrPhotos: [
          {
            asset: { base64: 'img1', mimeType: 'image/jpeg' },
            stats: [{ key: 'shots', label: 'Shots', home: 5, away: 3, confidence: 'high' }],
          },
          {
            asset: { base64: 'img2', mimeType: 'image/jpeg' },
            stats: [
              { key: 'possession', label: 'Possession', home: 60, away: 40, confidence: 'medium' },
            ],
          },
        ],
      });
    });

    // Remove the first image — the second's stats must survive, no rescan
    await act(async () => {
      result.current.handleRemoveMedia(0);
    });

    const s = result.current.addMatch;
    expect(s.media).toHaveLength(1);
    expect(s.ocrPhotos).toHaveLength(1);
    expect(s.pendingStats).toEqual({ possession: { a: 60, b: 40 } });
    expect(s.ocrStatus).toBe('done');
    expect(mockExtractStats).not.toHaveBeenCalled();
  });

  it('self-heals ocrStatus from error to done when the specific failing photo is removed', async () => {
    const { result } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        ocrStatus: 'error',
        pendingStats: { shots: { a: 5, b: 3 } },
        media: [
          { uri: 'file://good.jpg', type: 'image' },
          { uri: 'file://bad.jpg', type: 'image' },
        ],
        ocrPhotos: [
          {
            asset: { base64: 'good', mimeType: 'image/jpeg' },
            stats: [{ key: 'shots', label: 'Shots', home: 5, away: 3, confidence: 'high' }],
          },
          { asset: { base64: 'bad', mimeType: 'image/jpeg' }, stats: null },
        ],
      });
    });

    // Remove the failing photo (index 1)
    await act(async () => {
      result.current.handleRemoveMedia(1);
    });

    const s = result.current.addMatch;
    expect(s.ocrStatus).toBe('done');
    expect(s.pendingStats).toEqual({ shots: { a: 5, b: 3 } });
    expect(s.ocrPhotos).toHaveLength(1);
  });

  it('keeps ocrPhotos aligned with media when an image has no usable base64', async () => {
    mockExtractStats.mockResolvedValue([]);
    mockPicker
      .mockResolvedValueOnce({
        canceled: false,
        assets: [
          { uri: 'file://noBase.jpg', type: 'image', base64: undefined, mimeType: 'image/jpeg' },
        ],
      })
      .mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            uri: 'file://scannable.jpg',
            type: 'image',
            base64: 'scanBase',
            mimeType: 'image/jpeg',
          },
        ],
      });

    const { result } = await makeHook();

    // First pick — image with no usable base64 still gets a slot
    await act(async () => {
      await result.current.handlePickMedia();
    });
    expect(result.current.addMatch.ocrPhotos).toEqual([{ asset: null, stats: null }]);

    // Second pick — a normal scannable image
    await act(async () => {
      await result.current.handlePickMedia();
    });
    await waitFor(() => expect(result.current.addMatch.ocrStatus).toBe('done'));

    expect(result.current.addMatch.ocrPhotos).toHaveLength(2);
    expect(result.current.addMatch.ocrPhotos[0]).toEqual({ asset: null, stats: null });
    expect(result.current.addMatch.ocrPhotos[1].asset).toEqual({
      base64: 'scanBase',
      mimeType: 'image/jpeg',
    });

    // Remove the first (no-base64) image — the second's slot must be the one that remains
    await act(async () => {
      result.current.handleRemoveMedia(0);
    });
    expect(result.current.addMatch.media).toHaveLength(1);
    expect(result.current.addMatch.ocrPhotos).toHaveLength(1);
    expect(result.current.addMatch.ocrPhotos[0].asset).toEqual({
      base64: 'scanBase',
      mimeType: 'image/jpeg',
    });
  });
});

// ---------------------------------------------------------------------------
// #68/#71 twin bug — a sibling photo's already-good stats must survive a
// later photo's OCR failure, since the per-photo model knows exactly which
// photo failed instead of nuking the whole combined result (former Bug 12
// behavior, now deliberately reversed)
// ---------------------------------------------------------------------------

describe('runOcr — per-photo failure isolation', () => {
  it("preserves a sibling photo's pendingStats when a later photo's OCR fails", async () => {
    // First pick succeeds and sets pendingStats
    mockExtractStats.mockResolvedValueOnce([
      { key: 'shots', home: 5, away: 3, confidence: 'high' },
    ]);
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://img1.jpg', type: 'image', base64: 'base1', mimeType: 'image/jpeg' }],
    });

    const { result } = await makeHook();

    // First pick — OCR succeeds
    await act(async () => {
      await result.current.handlePickMedia();
    });
    await waitFor(() => expect(result.current.addMatch.ocrStatus).toBe('done'));
    expect(mockExtractStats).toHaveBeenCalledTimes(1);
    expect(result.current.addMatch.pendingStats).toEqual({ shots: { a: 5, b: 3 } });

    // Second pick — the new photo's OCR fails
    mockExtractStats.mockRejectedValueOnce(new Error('ocr fail'));
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://img2.jpg', type: 'image', base64: 'base2', mimeType: 'image/jpeg' }],
    });

    await act(async () => {
      await result.current.handlePickMedia();
    });
    await waitFor(() => expect(result.current.addMatch.ocrStatus).toBe('error'));

    // Exactly one more call, for the new photo only — photo1 is never rescanned
    expect(mockExtractStats).toHaveBeenCalledTimes(2);
    expect(mockExtractStats).toHaveBeenLastCalledWith('base2', 'image/jpeg');
    // photo1's already-good stats must survive photo2's failure
    expect(result.current.addMatch.pendingStats).toEqual({ shots: { a: 5, b: 3 } });
  });

  it("saves a sibling photo's already-good stats when the user skips past a failing photo", async () => {
    mockExtractStats.mockResolvedValueOnce([
      { key: 'possession', home: 60, away: 40, confidence: 'medium' },
    ]);
    mockPicker
      .mockResolvedValueOnce({
        canceled: false,
        assets: [
          { uri: 'file://img1.jpg', type: 'image', base64: 'base1', mimeType: 'image/jpeg' },
        ],
      })
      .mockResolvedValueOnce({
        canceled: false,
        assets: [
          { uri: 'file://img2.jpg', type: 'image', base64: 'base2', mimeType: 'image/jpeg' },
        ],
      });

    const { result, addMatchToStore } = await makeHook();

    // Set up players so save can proceed
    await act(async () => {
      result.current.setAddMatch({ ...initAddMatch(), homeId: 'p1', awayId: 'p2' });
    });

    // First pick — OCR succeeds → pendingStats set
    await act(async () => {
      await result.current.handlePickMedia();
    });
    await waitFor(() => expect(result.current.addMatch.ocrStatus).toBe('done'));

    // Second pick — OCR fails → error state, but photo1's stats survive
    mockExtractStats.mockRejectedValueOnce(new Error('ocr fail'));
    await act(async () => {
      await result.current.handlePickMedia();
    });
    await waitFor(() => expect(result.current.addMatch.ocrStatus).toBe('error'));
    expect(result.current.addMatch.pendingStats).toEqual({ possession: { a: 60, b: 40 } });

    // User skips the still-failing photo (same trigger as AddMatchSheet.tsx's Skip
    // button, which no longer nulls pendingStats)
    await act(async () => {
      result.current.setAddMatch((p) => ({ ...p, ocrStatus: 'skipped' }));
    });

    // Save match
    await act(async () => {
      await result.current.handleSaveMatch();
    });

    const saved: Match = addMatchToStore.mock.calls[0][0];
    // photo1's legitimate stats are saved — skipping the failing photo must not discard them
    expect(saved.statsOverride).toEqual({ possession: { a: 60, b: 40 } });
  });
});

// ---------------------------------------------------------------------------
// Bug 11 — picking images after user has skipped OCR must NOT re-enter the
//           scanning/error cycle and re-block Next
// ---------------------------------------------------------------------------

describe('handlePickMedia — skipped OCR is preserved when more images are added', () => {
  it('does not trigger OCR and keeps ocrStatus=skipped when user adds images after skipping', async () => {
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://new.jpg', type: 'image', base64: 'newBase', mimeType: 'image/jpeg' }],
    });

    const { result } = await makeHook();

    // Simulate state where user already explicitly skipped stats
    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        ocrStatus: 'skipped',
        ocrPhotos: [{ asset: { base64: 'oldFailed', mimeType: 'image/jpeg' }, stats: null }],
        media: [{ uri: 'file://old.jpg', type: 'image' }],
      });
    });

    await act(async () => {
      await result.current.handlePickMedia();
    });

    // Image was added to media
    expect(result.current.addMatch.media).toHaveLength(2);
    // OCR was NOT triggered
    expect(mockExtractStats).not.toHaveBeenCalled();
    // Status stays skipped — Next remains unblocked
    expect(result.current.addMatch.ocrStatus).toBe('skipped');
  });

  it('does not transition to error and re-block Next after a second OCR failure while skipped', async () => {
    // First pick: OCR fails → user skips
    mockExtractStats.mockRejectedValueOnce(new Error('ocr fail'));
    mockPicker
      .mockResolvedValueOnce({
        canceled: false,
        assets: [
          { uri: 'file://img1.jpg', type: 'image', base64: 'base1', mimeType: 'image/jpeg' },
        ],
      })
      .mockResolvedValueOnce({
        canceled: false,
        assets: [
          { uri: 'file://img2.jpg', type: 'image', base64: 'base2', mimeType: 'image/jpeg' },
        ],
      });

    const { result } = await makeHook();

    // First pick — OCR starts
    await act(async () => {
      await result.current.handlePickMedia();
    });
    await waitFor(() => expect(result.current.addMatch.ocrStatus).toBe('error'));

    // User skips stats manually
    await act(async () => {
      result.current.setAddMatch((prev) => ({ ...prev, ocrStatus: 'skipped' }));
    });
    expect(result.current.addMatch.ocrStatus).toBe('skipped');

    // Second pick — should NOT trigger OCR
    await act(async () => {
      await result.current.handlePickMedia();
    });

    expect(result.current.addMatch.ocrStatus).toBe('skipped'); // still skipped
    expect(result.current.addMatch.media).toHaveLength(2); // both images in media
    // extractStatsFromPhoto was only called during the first pick (1 time), not again
    expect(mockExtractStats).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Bug 10 — handlePickMedia must not OCR phantom images that don't fit in media
// ---------------------------------------------------------------------------

describe('handlePickMedia — no phantom OCR assets beyond media cap', () => {
  it('only processes images that fit within the 5-item limit', async () => {
    mockExtractStats.mockResolvedValue([]);
    // Return 3 images from picker when only 1 slot remains (4 existing items)
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [
        { uri: 'file://a.jpg', type: 'image', base64: 'base_a', mimeType: 'image/jpeg' },
        { uri: 'file://b.jpg', type: 'image', base64: 'base_b', mimeType: 'image/jpeg' },
        { uri: 'file://c.jpg', type: 'image', base64: 'base_c', mimeType: 'image/jpeg' },
      ],
    });

    const { result } = await makeHook();

    // Pre-fill 4 media slots
    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        media: Array.from({ length: 4 }, (_, i) => ({
          uri: `file://existing${i}.jpg`,
          type: 'image' as const,
        })),
      });
    });

    await act(async () => {
      await result.current.handlePickMedia();
    });

    await waitFor(() => expect(mockExtractStats).toHaveBeenCalled());

    // Only 1 new slot was available — OCR must only see 1 new image (not 3)
    expect(mockExtractStats).toHaveBeenCalledTimes(1);
    expect(mockExtractStats).toHaveBeenCalledWith('base_a', 'image/jpeg');
    // base_b and base_c must NOT have been processed
    expect(mockExtractStats).not.toHaveBeenCalledWith('base_b', expect.anything());
    expect(mockExtractStats).not.toHaveBeenCalledWith('base_c', expect.anything());

    // Exactly 5 items in media
    expect(result.current.addMatch.media).toHaveLength(5);
  });

  it('does not launch picker when all 5 slots are full', async () => {
    const { result } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        media: Array.from({ length: 5 }, (_, i) => ({
          uri: `file://existing${i}.jpg`,
          type: 'image' as const,
        })),
      });
    });

    await act(async () => {
      await result.current.handlePickMedia();
    });

    expect(mockPicker).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Discard confirmation — handleBack shows Alert when state is dirty (step 1)
// ---------------------------------------------------------------------------

describe('handleBack — discard confirmation', () => {
  it('calls closeModal directly when state is clean', async () => {
    const { result, closeModal } = await makeHook();

    await act(async () => {
      result.current.handleBack();
    });

    expect(result.current.showDiscardDialog).toBe(false);
    expect(closeModal).toHaveBeenCalledTimes(1);
  });

  it('sets showDiscardDialog (not closeModal) when homeId is set', async () => {
    const { result, closeModal } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({ ...initAddMatch(), homeId: 'p1' });
    });

    await act(async () => {
      result.current.handleBack();
    });

    expect(result.current.showDiscardDialog).toBe(true);
    expect(closeModal).not.toHaveBeenCalled();
  });

  it('sets showDiscardDialog when media is present', async () => {
    const { result, closeModal } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({
        ...initAddMatch(),
        media: [{ uri: 'file://photo.jpg', type: 'image' }],
      });
    });

    await act(async () => {
      result.current.handleBack();
    });

    expect(result.current.showDiscardDialog).toBe(true);
    expect(closeModal).not.toHaveBeenCalled();
  });

  it('calls closeModal after handleConfirmDiscard', async () => {
    const { result, closeModal } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({ ...initAddMatch(), homeId: 'p1', awayId: 'p2' });
    });

    await act(async () => {
      result.current.handleBack();
    });
    expect(result.current.showDiscardDialog).toBe(true);

    await act(async () => {
      result.current.handleConfirmDiscard();
    });

    expect(closeModal).toHaveBeenCalledTimes(1);
    expect(result.current.addMatch.homeId).toBeNull();
    expect(result.current.showDiscardDialog).toBe(false);
  });

  it('does NOT call closeModal when dialog is cancelled via setShowDiscardDialog(false)', async () => {
    const { result, closeModal } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({ ...initAddMatch(), homeId: 'p1' });
    });

    await act(async () => {
      result.current.handleBack();
    });
    expect(result.current.showDiscardDialog).toBe(true);

    await act(async () => {
      result.current.setShowDiscardDialog(false);
    });

    expect(closeModal).not.toHaveBeenCalled();
    expect(result.current.addMatch.homeId).toBe('p1');
  });

  it('sets showDiscardDialog when score > 0 even without players or media', async () => {
    const { result, closeModal } = await makeHook();

    await act(async () => {
      result.current.setAddMatch({ ...initAddMatch(), homeScore: 1 });
    });

    await act(async () => {
      result.current.handleBack();
    });

    expect(result.current.showDiscardDialog).toBe(true);
    expect(closeModal).not.toHaveBeenCalled();
  });
});
