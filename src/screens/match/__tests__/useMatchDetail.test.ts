jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({ getString: () => null, set: jest.fn(), remove: jest.fn() }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ id: 'match-1' }),
}));

jest.mock('@/utils/useGoBack', () => ({ useGoBack: () => jest.fn() }));

jest.mock('@/supabase/sync', () => ({
  fetchMatchById: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/supabase/storage', () => ({
  uploadMediaItem: jest.fn().mockResolvedValue(null),
  deleteMediaItem: jest.fn().mockResolvedValue(undefined),
  // Also used by tournamentSlice.ts (imported transitively via the store) for
  // folder-prefix deletes (#67) — not under test here, just needs to exist.
  deleteStorageFolder: jest.fn().mockResolvedValue(undefined),
  buildRoundFolder: jest.fn(() => 'matchday-mock'),
  buildMatchFolder: jest.fn(() => 'match-mock'),
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

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { All: 'All' },
}));

import { renderHook, act } from '@testing-library/react-native';
import { useMatchDetail } from '../useMatchDetail';
import { useStore } from '@/store';
import type { Match, ArchivedRound, ClosedTournament } from '@/store/types';

const mockUpload = jest.mocked(require('@/supabase/storage').uploadMediaItem);
const mockExtractStats = jest.mocked(require('@/utils/extractStats').extractStatsFromPhoto);
const mockPicker = jest.mocked(require('expo-image-picker').launchImageLibraryAsync);

const MATCH: Match = {
  id: 'match-1',
  aId: 'player-a',
  bId: 'player-b',
  aTeam: 'JUV',
  bTeam: 'TOT',
  aScore: 3,
  bScore: 1,
};

const ARCHIVED_ROUND: ArchivedRound = {
  id: 'round-1',
  n: 1,
  date: '2024-01-01',
  winner: '',
  games: 1,
  ranked: true,
  name: 'Round 1',
  matches: [MATCH],
};

const CLOSED_TOURNAMENT: ClosedTournament = {
  id: 'tour-1',
  name: 'Tournament 1',
  date: '2024-01-01',
  rounds: [ARCHIVED_ROUND],
  champId: 'player-a',
  champName: 'Alice',
  champColor: '#f00',
  champInit: 'AL',
  players: ['player-a', 'player-b'],
};

beforeEach(() => {
  jest.resetAllMocks();
  mockPicker.mockResolvedValue({ canceled: true });
  mockUpload.mockResolvedValue(null);
  mockExtractStats.mockResolvedValue([]);
  jest.mocked(require('@/supabase/sync').fetchMatchById).mockResolvedValue(null);
  // deleteMatch chains .catch() directly onto this without awaiting first —
  // needs a real resolved promise, not resetAllMocks' bare undefined return.
  jest.mocked(require('@/supabase/storage').deleteStorageFolder).mockResolvedValue(undefined);
  jest.mocked(require('@/utils/imageResize').resizeImage).mockImplementation((uri: string) => Promise.resolve({ uri }));
  useStore.getState().resetStore();
});

// #63: handleImportStats now rejects any photo that recognizes fewer than
// MIN_CANONICAL_STATS (8) of the 23 canonical params. Tests that want a photo
// to be treated as a genuine, valid stats screenshot must mock at least 8
// canonical keys — this helper builds that baseline with overridable values.
const CANONICAL_TEST_KEYS = ['possession', 'shots', 'passes', 'tackles', 'saves', 'fouls', 'corners', 'freekicks'];
function makeValidStats(
  overrides: Record<string, { home: number; away: number; confidence?: 'high' | 'medium' | 'low' }> = {},
) {
  return CANONICAL_TEST_KEYS.map((key) => ({
    key,
    label: key,
    home: overrides[key]?.home ?? 5,
    away: overrides[key]?.away ?? 5,
    confidence: overrides[key]?.confidence ?? ('high' as const),
  }));
}

// ── Match lookup ──────────────────────────────────────────────────────────────

describe('match lookup', () => {
  it('finds match in matches (current round)', async () => {
    useStore.setState({ matches: [MATCH] });
    const { result } = await renderHook(() => useMatchDetail());
    expect(result.current.match?.id).toBe('match-1');
    expect(result.current.isCurrentRoundMatch).toBe(true);
  });

  it('finds match in archivedRounds when not in matches', async () => {
    useStore.setState({ matches: [], archivedRounds: [ARCHIVED_ROUND], hasTournament: true });
    const { result } = await renderHook(() => useMatchDetail());
    expect(result.current.match?.id).toBe('match-1');
    expect(result.current.isCurrentRoundMatch).toBe(false);
    expect(result.current.isEditableMatch).toBe(true);
  });

  it('finds match in closedTournaments as last resort', async () => {
    useStore.setState({
      matches: [],
      archivedRounds: [],
      closedTournaments: [CLOSED_TOURNAMENT],
      hasTournament: false,
    });
    const { result } = await renderHook(() => useMatchDetail());
    expect(result.current.match?.id).toBe('match-1');
    expect(result.current.isCurrentRoundMatch).toBe(false);
    expect(result.current.isEditableMatch).toBe(false);
  });

  it('returns undefined when match is not found anywhere', async () => {
    const { result } = await renderHook(() => useMatchDetail());
    expect(result.current.match).toBeUndefined();
  });

  it('prefers match from matches over the same id in archivedRounds', async () => {
    const inRound = { ...MATCH, aScore: 99 };
    useStore.setState({
      matches: [MATCH],
      archivedRounds: [{ ...ARCHIVED_ROUND, matches: [inRound] }],
    });
    const { result } = await renderHook(() => useMatchDetail());
    expect(result.current.match?.aScore).toBe(3);
  });
});

// ── isEditableMatch ───────────────────────────────────────────────────────────

describe('isEditableMatch', () => {
  it('is true when match is in current round', async () => {
    useStore.setState({ matches: [MATCH] });
    const { result } = await renderHook(() => useMatchDetail());
    expect(result.current.isEditableMatch).toBe(true);
  });

  it('is false when match is in archivedRounds but hasTournament is false', async () => {
    useStore.setState({ matches: [], archivedRounds: [ARCHIVED_ROUND], hasTournament: false });
    const { result } = await renderHook(() => useMatchDetail());
    expect(result.current.isEditableMatch).toBe(false);
  });

  it('is false when match is only in closedTournaments', async () => {
    useStore.setState({ matches: [], archivedRounds: [], closedTournaments: [CLOSED_TOURNAMENT] });
    const { result } = await renderHook(() => useMatchDetail());
    expect(result.current.isEditableMatch).toBe(false);
  });
});

// ── Score comparisons ─────────────────────────────────────────────────────────

describe('score comparisons', () => {
  it('aWins when side A has higher score', async () => {
    useStore.setState({ matches: [{ ...MATCH, aScore: 3, bScore: 1 }] });
    const { result } = await renderHook(() => useMatchDetail());
    expect(result.current.aWins).toBe(true);
    expect(result.current.bWins).toBe(false);
    expect(result.current.isDraw).toBe(false);
  });

  it('bWins when side B has higher score', async () => {
    useStore.setState({ matches: [{ ...MATCH, aScore: 0, bScore: 2 }] });
    const { result } = await renderHook(() => useMatchDetail());
    expect(result.current.aWins).toBe(false);
    expect(result.current.bWins).toBe(true);
    expect(result.current.isDraw).toBe(false);
  });

  it('isDraw when scores are equal', async () => {
    useStore.setState({ matches: [{ ...MATCH, aScore: 2, bScore: 2 }] });
    const { result } = await renderHook(() => useMatchDetail());
    expect(result.current.isDraw).toBe(true);
    expect(result.current.aWins).toBe(false);
    expect(result.current.bWins).toBe(false);
  });
});

// ── openEditScore ─────────────────────────────────────────────────────────────

describe('openEditScore', () => {
  it('pre-fills with current match scores and opens modal', async () => {
    useStore.setState({ matches: [{ ...MATCH, aScore: 3, bScore: 1 }] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { result.current.openEditScore(); });
    expect(result.current.editAScore).toBe(3);
    expect(result.current.editBScore).toBe(1);
    expect(useStore.getState().modal).toBe('editScore');
  });
});

// ── handleSaveScore ───────────────────────────────────────────────────────────

describe('handleSaveScore', () => {
  it('persists new scores to store and closes modal', async () => {
    useStore.setState({ matches: [MATCH] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => {
      result.current.setEditAScore(() => 2);
      result.current.setEditBScore(() => 2);
    });
    await act(async () => { result.current.handleSaveScore(); });
    const saved = useStore.getState().matches.find((m) => m.id === 'match-1');
    expect(saved?.aScore).toBe(2);
    expect(saved?.bScore).toBe(2);
    expect(useStore.getState().modal).toBeNull();
  });
});

// ── handleDeleteMatch ─────────────────────────────────────────────────────────

describe('handleDeleteMatch', () => {
  it('removes match from store and navigates to /round', async () => {
    useStore.setState({ matches: [MATCH] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { result.current.handleDeleteMatch(); });
    expect(useStore.getState().matches).toHaveLength(0);
    expect(mockReplace).toHaveBeenCalledWith('/round');
  });
});

// ── adjustStat ────────────────────────────────────────────────────────────────

describe('adjustStat', () => {
  it('increments stat value', async () => {
    useStore.setState({ matches: [MATCH] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { result.current.adjustStat('shots', 'a', 3, false); });
    expect(result.current.editValues['shots']?.a).toBe(3);
  });

  it('decrements stat value', async () => {
    useStore.setState({ matches: [MATCH] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => {
      result.current.adjustStat('shots', 'a', 5, false);
      result.current.adjustStat('shots', 'a', -2, false);
    });
    expect(result.current.editValues['shots']?.a).toBe(3);
  });

  it('clamps at zero — never goes negative', async () => {
    useStore.setState({ matches: [MATCH] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { result.current.adjustStat('fouls', 'b', -10, false); });
    expect(result.current.editValues['fouls']?.b).toBe(0);
  });

  it('tracks side A and side B independently', async () => {
    useStore.setState({ matches: [MATCH] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => {
      result.current.adjustStat('passes', 'a', 10, false);
      result.current.adjustStat('passes', 'b', 7, false);
    });
    expect(result.current.editValues['passes']?.a).toBe(10);
    expect(result.current.editValues['passes']?.b).toBe(7);
  });

  // #63: percent fields (possession, shotAccuracy, etc.) can't exceed 100 on either side
  it('clamps at 100 for percent fields', async () => {
    useStore.setState({ matches: [MATCH] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { result.current.adjustStat('possession', 'a', 150, true); });
    expect(result.current.editValues['possession']?.a).toBe(100);
  });

  it('does not clamp non-percent fields at 100', async () => {
    useStore.setState({ matches: [MATCH] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { result.current.adjustStat('passes', 'a', 150, false); });
    expect(result.current.editValues['passes']?.a).toBe(150);
  });

  // #63: expectedGoals (xG) steps by 0.1 — verify no floating point drift (e.g. 2.1 not 2.0999999)
  it('accumulates 0.1 steps without floating point drift', async () => {
    useStore.setState({ matches: [MATCH] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => {
      for (let i = 0; i < 21; i++) result.current.adjustStat('expectedGoals', 'a', 0.1, false);
    });
    expect(result.current.editValues['expectedGoals']?.a).toBe(2.1);
  });
});

// ── openEditStats / handleSaveStats (#63) ─────────────────────────────────────

describe('openEditStats / handleSaveStats', () => {
  it('seeds editValues with 0/0 for a param missing from statsOverride', async () => {
    const match = { ...MATCH, statsOverride: { shots: { a: 7, b: 3 } } };
    useStore.setState({ matches: [match] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { result.current.openEditStats(); });
    expect(result.current.editValues['fouls']).toEqual({ a: 0, b: 0 });
    expect(result.current.editValues['shots']).toEqual({ a: 7, b: 3 });
  });

  it('leaves an untouched, never-set param out of statsOverride after save', async () => {
    const match = { ...MATCH, statsOverride: { shots: { a: 7, b: 3 } } };
    useStore.setState({ matches: [match] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { result.current.openEditStats(); });
    await act(async () => { result.current.handleSaveStats(); });
    // fouls was never touched — stays excluded, still shows as a muted placeholder
    expect(useStore.getState().matches[0].statsOverride?.fouls).toBeUndefined();
  });

  it('includes a param in statsOverride once the user touches it via adjustStat', async () => {
    const match = { ...MATCH, statsOverride: { shots: { a: 7, b: 3 } } };
    useStore.setState({ matches: [match] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { result.current.openEditStats(); });
    await act(async () => { result.current.adjustStat('fouls', 'a', 2, false); });
    await act(async () => { result.current.handleSaveStats(); });
    expect(useStore.getState().matches[0].statsOverride?.fouls).toEqual({ a: 2, b: 0, confidence: undefined });
  });

  it('preserves confidence on an untouched already-set param', async () => {
    const match = { ...MATCH, statsOverride: { shots: { a: 7, b: 3, confidence: 'low' as const } } };
    useStore.setState({ matches: [match] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { result.current.openEditStats(); });
    await act(async () => { result.current.handleSaveStats(); });
    expect(useStore.getState().matches[0].statsOverride?.shots).toEqual({ a: 7, b: 3, confidence: 'low' });
  });

  it('drops confidence once the user manually edits an already-set param', async () => {
    const match = { ...MATCH, statsOverride: { shots: { a: 7, b: 3, confidence: 'low' as const } } };
    useStore.setState({ matches: [match] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { result.current.openEditStats(); });
    await act(async () => { result.current.adjustStat('shots', 'a', 1, false); });
    await act(async () => { result.current.handleSaveStats(); });
    expect(useStore.getState().matches[0].statsOverride?.shots).toEqual({ a: 8, b: 3, confidence: undefined });
  });
});

// ── openEditNote / handleSaveNote ─────────────────────────────────────────────

describe('openEditNote', () => {
  it('pre-fills editNoteValue from match.note', async () => {
    useStore.setState({ matches: [{ ...MATCH, note: 'Great match!' }] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { result.current.openEditNote(); });
    expect(result.current.editNoteValue).toBe('Great match!');
    expect(result.current.editingNote).toBe(true);
  });

  it('uses empty string when match has no note', async () => {
    useStore.setState({ matches: [MATCH] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { result.current.openEditNote(); });
    expect(result.current.editNoteValue).toBe('');
  });
});

describe('handleSaveNote', () => {
  it('saves trimmed note to store and closes editor', async () => {
    useStore.setState({ matches: [MATCH] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { result.current.openEditNote(); });
    await act(async () => { result.current.setEditNoteValue('  Nice game!  '); });
    await act(async () => { result.current.handleSaveNote(); });
    const saved = useStore.getState().matches.find((m) => m.id === 'match-1');
    expect(saved?.note).toBe('Nice game!');
    expect(result.current.editingNote).toBe(false);
  });
});

// ── dialog visibility flags ───────────────────────────────────────────────────

describe('dialog visibility flags', () => {
  it('handleClearStats shows the clear-stats dialog', async () => {
    useStore.setState({ matches: [MATCH] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { result.current.handleClearStats(); });
    expect(result.current.showClearStats).toBe(true);
  });

  it('handleSwapSides shows the swap-sides dialog', async () => {
    useStore.setState({ matches: [MATCH] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { result.current.handleSwapSides(); });
    expect(result.current.showSwapSides).toBe(true);
  });
});

// ── handleAddMedia ─────────────────────────────────────────────────────────────

describe('handleAddMedia', () => {
  it('does nothing if picker is canceled', async () => {
    useStore.setState({ matches: [MATCH] });
    mockPicker.mockResolvedValueOnce({ canceled: true });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleAddMedia(); });
    expect(useStore.getState().matches[0].media).toBeUndefined();
  });

  it('requests images only from the picker — video upload disabled (#59)', async () => {
    useStore.setState({ matches: [MATCH] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleAddMedia(); });
    expect(mockPicker).toHaveBeenCalledWith(
      expect.objectContaining({ mediaTypes: ['images'] }),
    );
  });

  it('saves with remote URL when upload succeeds', async () => {
    useStore.setState({ matches: [MATCH] });
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg', type: 'image' }],
    });
    mockUpload.mockResolvedValueOnce('https://cdn.example.com/photo.jpg');
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleAddMedia(); });
    const media = useStore.getState().matches[0].media;
    expect(media).toHaveLength(1);
    expect(media![0].uri).toBe('https://cdn.example.com/photo.jpg');
    expect(media![0].pendingUpload).toBeUndefined();
  });

  it('saves locally with pendingUpload flag when upload fails', async () => {
    useStore.setState({ matches: [MATCH] });
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg', type: 'image' }],
    });
    mockUpload.mockResolvedValueOnce(null);
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleAddMedia(); });
    const media = useStore.getState().matches[0].media;
    expect(media).toHaveLength(1);
    expect(media![0].uri).toBe('file://photo.jpg');
    expect(media![0].pendingUpload).toBe(true);
  });

  it('#67 — uploads to the nested round/match folder for a live match', async () => {
    useStore.setState({
      matches: [{ ...MATCH, mediaFolder: 'match_3-1_2026-07-03_1432' }],
      roundFolder: 'matchday-2026-07-03_1430',
      tournamentId: 'tour-1',
    });
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg', type: 'image' }],
    });
    mockUpload.mockResolvedValueOnce('https://cdn.example.com/photo.jpg');
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleAddMedia(); });

    expect(mockUpload).toHaveBeenCalledWith('file://photo.jpg', 'image', {
      tournamentId: 'tour-1',
      mediaFolder: 'matchday-2026-07-03_1430/match_3-1_2026-07-03_1432',
    });
  });

  it('#67 — falls back to matchId as the folder for matches predating the layout', async () => {
    useStore.setState({
      matches: [MATCH], // no mediaFolder
      roundFolder: 'matchday-2026-07-03_1430',
      tournamentId: 'tour-1',
    });
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg', type: 'image' }],
    });
    mockUpload.mockResolvedValueOnce('https://cdn.example.com/photo.jpg');
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleAddMedia(); });

    expect(mockUpload).toHaveBeenCalledWith('file://photo.jpg', 'image', {
      tournamentId: 'tour-1',
      mediaFolder: MATCH.id,
    });
  });
});

// ── handleImportStats ─────────────────────────────────────────────────────────

describe('handleImportStats', () => {
  it('does nothing if picker is canceled', async () => {
    useStore.setState({ matches: [MATCH] });
    mockPicker.mockResolvedValueOnce({ canceled: true });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleImportStats(); });
    expect(useStore.getState().matches[0].media).toBeUndefined();
    expect(result.current.showOcrFailed).toBe(false);
    expect(result.current.showInvalidStatsPhoto).toBe(false);
  });

  it('upload fails: saves locally with pendingUpload flag, runs OCR', async () => {
    useStore.setState({ matches: [MATCH] });
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://stats.jpg', type: 'image', base64: 'abc', mimeType: 'image/jpeg' }],
    });
    mockUpload.mockResolvedValueOnce(null);
    mockExtractStats.mockResolvedValueOnce(makeValidStats());
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleImportStats(); });
    // Photo saved locally (no existing media → should save)
    const media = useStore.getState().matches[0].media;
    expect(media).toHaveLength(1);
    expect(media![0].uri).toBe('file://stats.jpg');
    expect(media![0].pendingUpload).toBe(true);
    // OCR still runs — base64 is in memory regardless of upload status
    expect(mockExtractStats).toHaveBeenCalledWith('abc', 'image/jpeg');
    // A valid photo (>= 8 canonical stats) applies silently, no dialog
    expect(result.current.showInvalidStatsPhoto).toBe(false);
  });

  it('upload fails: does NOT add media when match already has photos, but still runs OCR', async () => {
    const matchWithMedia = { ...MATCH, media: [{ uri: 'https://cdn/existing.jpg', type: 'image' as const }] };
    useStore.setState({ matches: [matchWithMedia] });
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://stats.jpg', type: 'image', base64: 'abc', mimeType: 'image/jpeg' }],
    });
    mockUpload.mockResolvedValueOnce(null);
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleImportStats(); });
    // Existing media untouched (new photo not saved since match already has media)
    const media = useStore.getState().matches[0].media;
    expect(media).toHaveLength(1);
    expect(media![0].uri).toBe('https://cdn/existing.jpg');
    // OCR still runs even though upload failed
    expect(mockExtractStats).toHaveBeenCalledWith('abc', 'image/jpeg');
  });

  it('upload succeeds: runs OCR and auto-applies stats without opening modal', async () => {
    useStore.setState({ matches: [MATCH] });
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://stats.jpg', type: 'image', base64: 'abc', mimeType: 'image/jpeg' }],
    });
    mockUpload.mockResolvedValueOnce('https://cdn/stats.jpg');
    mockExtractStats.mockResolvedValueOnce(makeValidStats({ shots: { home: 7, away: 3 } }));
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleImportStats(); });
    expect(mockExtractStats).toHaveBeenCalledWith('abc', 'image/jpeg');
    const saved = useStore.getState().matches[0];
    expect(saved.statsOverride?.shots).toEqual({ a: 7, b: 3, confidence: 'high' });
    expect(useStore.getState().modal).toBeNull();
    expect(result.current.showOcrFailed).toBe(false);
    expect(result.current.showInvalidStatsPhoto).toBe(false);
  });

  it('upload succeeds but OCR recognizes too few params: shows invalid-photo notification, skips media', async () => {
    // #63: a photo below MIN_CANONICAL_STATS (8) — including the old "0 stats
    // found" case — is treated as the wrong screenshot, not just "no stats".
    useStore.setState({ matches: [MATCH] });
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://stats.jpg', type: 'image', base64: 'abc', mimeType: 'image/jpeg' }],
    });
    mockUpload.mockResolvedValueOnce('https://cdn/stats.jpg');
    mockExtractStats.mockResolvedValueOnce([]);
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleImportStats(); });
    expect(result.current.showInvalidStatsPhoto).toBe(true);
    expect(useStore.getState().matches[0].statsOverride).toBeUndefined();
    // Invalid photo never joins match.media, even though upload itself succeeded
    expect(useStore.getState().matches[0].media).toBeUndefined();
  });

  it('upload succeeds but OCR throws: shows ocr-failed notification', async () => {
    useStore.setState({ matches: [MATCH] });
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://stats.jpg', type: 'image', base64: 'abc', mimeType: 'image/jpeg' }],
    });
    mockUpload.mockResolvedValueOnce('https://cdn/stats.jpg');
    mockExtractStats.mockRejectedValueOnce(new Error('OCR service down'));
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleImportStats(); });
    expect(result.current.showOcrFailed).toBe(true);
  });

  it('partial upload failure (one of two fails): saves mixed media, still runs OCR', async () => {
    useStore.setState({ matches: [MATCH] });
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [
        { uri: 'file://a.jpg', type: 'image', base64: 'aaa', mimeType: 'image/jpeg' },
        { uri: 'file://b.jpg', type: 'image', base64: 'bbb', mimeType: 'image/jpeg' },
      ],
    });
    mockUpload
      .mockResolvedValueOnce('https://cdn/a.jpg')
      .mockResolvedValueOnce(null);
    mockExtractStats
      .mockResolvedValueOnce(makeValidStats())
      .mockResolvedValueOnce(makeValidStats());
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleImportStats(); });
    // OCR runs on both photos regardless of partial upload failure
    expect(mockExtractStats).toHaveBeenCalledTimes(2);
    expect(mockExtractStats).toHaveBeenCalledWith('aaa', 'image/jpeg');
    expect(mockExtractStats).toHaveBeenCalledWith('bbb', 'image/jpeg');
    const media = useStore.getState().matches[0].media;
    expect(media).toHaveLength(2);
    expect(media![0].uri).toBe('https://cdn/a.jpg');
    expect(media![0].pendingUpload).toBeUndefined();
    expect(media![1].uri).toBe('file://b.jpg');
    expect(media![1].pendingUpload).toBe(true);
  });

  it('highest-confidence stat wins when multiple photos have same key', async () => {
    useStore.setState({ matches: [MATCH] });
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [
        { uri: 'file://a.jpg', type: 'image', base64: 'aaa', mimeType: 'image/jpeg' },
        { uri: 'file://b.jpg', type: 'image', base64: 'bbb', mimeType: 'image/jpeg' },
      ],
    });
    mockUpload
      .mockResolvedValueOnce('https://cdn/a.jpg')
      .mockResolvedValueOnce('https://cdn/b.jpg');
    mockExtractStats
      .mockResolvedValueOnce(makeValidStats({ shots: { home: 5, away: 2, confidence: 'low' } }))
      .mockResolvedValueOnce(makeValidStats({ shots: { home: 7, away: 3, confidence: 'high' } }));
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleImportStats(); });
    const saved = useStore.getState().matches[0];
    expect(saved.statsOverride?.shots).toEqual({ a: 7, b: 3, confidence: 'high' });
  });
});

describe('#63 — per-photo OCR validation gate', () => {
  it('uploads a rejected (too-few-stats) photo with a "rejected-" filename prefix', async () => {
    useStore.setState({ matches: [MATCH] });
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://bad.jpg', type: 'image', base64: 'xyz', mimeType: 'image/jpeg' }],
    });
    mockUpload.mockResolvedValueOnce('https://cdn/bad.jpg');
    mockExtractStats.mockResolvedValueOnce([
      { key: 'shots', label: 'Shots', home: 1, away: 0, confidence: 'low' },
    ]); // only 1 canonical stat — below MIN_CANONICAL_STATS (8)
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleImportStats(); });

    expect(result.current.showInvalidStatsPhoto).toBe(true);
    // Still uploaded (kept in storage, per #63) but tagged for later cleanup
    expect(mockUpload).toHaveBeenCalledWith(
      'file://bad.jpg',
      'image',
      expect.objectContaining({ filenamePrefix: 'rejected-' }),
    );
  });

  it('does not tag a valid photo\'s filename', async () => {
    useStore.setState({ matches: [MATCH] });
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://good.jpg', type: 'image', base64: 'abc', mimeType: 'image/jpeg' }],
    });
    mockUpload.mockResolvedValueOnce('https://cdn/good.jpg');
    mockExtractStats.mockResolvedValueOnce(makeValidStats());
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleImportStats(); });

    const [, , context] = mockUpload.mock.calls[0];
    expect(context.filenamePrefix).toBeUndefined();
  });

  it('re-scan with an invalid photo leaves existing stats completely untouched', async () => {
    const matchWithStats = {
      ...MATCH,
      media: [{ uri: 'https://cdn/existing.jpg', type: 'image' as const }],
      statsOverride: { shots: { a: 5, b: 2, confidence: 'high' as const } },
    };
    useStore.setState({ matches: [matchWithStats] });
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://bad.jpg', type: 'image', base64: 'xyz', mimeType: 'image/jpeg' }],
    });
    mockUpload.mockResolvedValueOnce('https://cdn/bad.jpg');
    mockExtractStats.mockResolvedValueOnce([]); // 0 canonical stats — invalid
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleImportStats(); });

    const saved = useStore.getState().matches[0];
    expect(saved.statsOverride).toEqual({ shots: { a: 5, b: 2, confidence: 'high' } });
    expect(saved.media).toEqual([{ uri: 'https://cdn/existing.jpg', type: 'image' }]);
    expect(result.current.showInvalidStatsPhoto).toBe(true);
  });
});

// ── Bug hunt ─────────────────────────────────────────────────────────────────

describe('Bug 11 — handleImportStats: picker throws → importingStatsRef stuck true forever', () => {
  it('second call succeeds after first call where picker throws', async () => {
    useStore.setState({ matches: [MATCH] });
    mockPicker
      .mockRejectedValueOnce(new Error('permission denied'))
      .mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://s.jpg', type: 'image', base64: 'abc', mimeType: 'image/jpeg' }],
      });
    mockUpload.mockResolvedValueOnce('https://cdn/s.jpg');
    mockExtractStats.mockResolvedValueOnce(makeValidStats({ shots: { home: 5, away: 2 } }));
    const { result } = await renderHook(() => useMatchDetail());

    // First call: picker throws (permission denied) → ref should be released
    await act(async () => {
      try { await result.current.handleImportStats(); } catch {}
    });

    // Bug: importingStatsRef.current stays true → second call silently returns
    await act(async () => { await result.current.handleImportStats(); });

    const saved = useStore.getState().matches[0];
    expect(saved.statsOverride?.shots).toEqual({ a: 5, b: 2, confidence: 'high' });
  });
});

describe('Bug 9 — handleImportStats: upload throw loses photos (not saved locally)', () => {
  it('saves with pendingUpload=true and shows uploadFailed alert when upload rejects', async () => {
    useStore.setState({ matches: [MATCH] });
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://s.jpg', type: 'image', base64: 'abc', mimeType: 'image/jpeg' }],
    });
    // uploadMediaItem THROWS (not returns null) — simulates unexpected network error
    mockUpload.mockRejectedValueOnce(new Error('network timeout'));
    mockExtractStats.mockResolvedValueOnce(makeValidStats());
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleImportStats(); });

    // Bug: Promise.all rejects → outer catch fires → shows ocrFailed alert, photos NOT saved
    // Fix: per-upload catch should treat throw as null (save locally with pendingUpload)
    const media = useStore.getState().matches[0].media;
    expect(media).toHaveLength(1);
    expect(media![0].pendingUpload).toBe(true);
    expect(result.current.showOcrFailed).toBe(false);
  });
});

describe('Bug 1 — handleImportStats: upload throws → importingStats stuck at true', () => {
  it('resets importingStats to false even when uploadMediaItem rejects', async () => {
    useStore.setState({ matches: [MATCH] });
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://stats.jpg', type: 'image', base64: 'abc', mimeType: 'image/jpeg' }],
    });
    // uploadMediaItem rejects (throws) rather than returning null
    mockUpload.mockRejectedValueOnce(new Error('network error'));
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => {
      try { await result.current.handleImportStats(); } catch { /* expected throw */ }
    });
    // Bug: setImportingStats(false) is never called → spinner stuck at true
    expect(result.current.importingStats).toBe(false);
  });
});

describe('Bug 2 — handleAddMedia: stale match.media snapshot overwrites sync update', () => {
  it('appends to current store media, not the closure snapshot from before sync', async () => {
    // Start with an existing media item
    const matchWithOne = { ...MATCH, media: [{ uri: 'https://cdn/old.jpg', type: 'image' as const }] };
    useStore.setState({ matches: [matchWithOne] });
    const { result } = await renderHook(() => useMatchDetail());

    // Capture the callback NOW (it holds a closure over match.media = [old.jpg])
    const { handleAddMedia } = result.current;

    // Sync fires BEFORE we call handleAddMedia: adds a second photo
    await act(async () => {
      useStore.setState({
        matches: [{ ...matchWithOne, media: [
          { uri: 'https://cdn/old.jpg', type: 'image' as const },
          { uri: 'https://cdn/synced.jpg', type: 'image' as const },
        ] }],
      });
    });

    // Call the stale callback: its closure still sees match.media = [old.jpg]
    mockUpload.mockResolvedValueOnce('https://cdn/new.jpg');
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://new.jpg', type: 'image' }],
    });
    await act(async () => { await handleAddMedia(); });

    // Expected: [old.jpg, synced.jpg, new.jpg] — all 3 present
    // Bug: stale closure writes [...[old.jpg], new.jpg] → synced.jpg is LOST
    const media = useStore.getState().matches[0].media;
    expect(media).toHaveLength(3);
    expect(media!.some((m) => m.uri === 'https://cdn/synced.jpg')).toBe(true);
  });
});

describe('Bug 3 — handleAddMedia: double-tap: ref guard blocks second call', () => {
  it('second concurrent call is a no-op — first result is preserved, not clobbered', async () => {
    useStore.setState({ matches: [MATCH] });
    mockPicker
      .mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'file://a.jpg', type: 'image' }] })
      .mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'file://b.jpg', type: 'image' }] });
    mockUpload
      .mockResolvedValueOnce('https://cdn/a.jpg')
      .mockResolvedValueOnce('https://cdn/b.jpg');

    const { result } = await renderHook(() => useMatchDetail());
    const { handleAddMedia } = result.current;

    await act(async () => {
      await Promise.all([handleAddMedia(), handleAddMedia()]);
    });

    // Ref guard blocks second call immediately — only first upload is saved
    const media = useStore.getState().matches[0].media;
    expect(media).toHaveLength(1);
    expect(media![0].uri).toBe('https://cdn/a.jpg');
  });
});

describe('Bug 4 — handleImportStats: stale noExistingMedia overwrites synced media', () => {
  it('does not clobber media added by sync while handleImportStats was running', async () => {
    useStore.setState({ matches: [MATCH] }); // no media initially

    const { result } = await renderHook(() => useMatchDetail());

    // Capture callback — it sees noExistingMedia = true (match.media = [])
    const { handleImportStats } = result.current;

    // Sync fires and adds a photo BEFORE we call handleImportStats
    await act(async () => {
      useStore.setState({
        matches: [{ ...MATCH, media: [{ uri: 'https://cdn/synced.jpg', type: 'image' as const }] }],
      });
    });

    // Call stale callback: noExistingMedia is STILL true in its closure
    mockUpload.mockResolvedValueOnce('https://cdn/stats.jpg');
    mockExtractStats.mockResolvedValueOnce([
      { key: 'shots', label: 'Shots', home: 5, away: 2, confidence: 'high' },
    ]);
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://stats.jpg', type: 'image', base64: 'abc', mimeType: 'image/jpeg' }],
    });
    await act(async () => { await handleImportStats(); });

    // Bug: stale noExistingMedia=true → overwrites [synced.jpg] with [stats.jpg] → synced.jpg LOST
    const media = useStore.getState().matches[0].media;
    expect(media!.some((m) => m.uri === 'https://cdn/synced.jpg')).toBe(true);
  });
});

describe('Bug 5 — handleAddMedia: uploadMediaItem throws → uploadingMedia stuck, future calls blocked', () => {
  it('resets uploadingMedia to false even when uploadMediaItem throws', async () => {
    useStore.setState({ matches: [MATCH] });
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://photo.jpg', type: 'image' }],
    });
    mockUpload.mockRejectedValueOnce(new Error('network timeout'));
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => {
      try { await result.current.handleAddMedia(); } catch { /* expected throw */ }
    });
    // Bug: uploadingMedia stays true → next call hits guard and silently returns
    expect(result.current.uploadingMedia).toBe(false);
  });

  it('allows subsequent call after upload throws (first saved locally, second saved remotely)', async () => {
    useStore.setState({ matches: [MATCH] });
    mockPicker
      .mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'file://a.jpg', type: 'image' }] })
      .mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'file://b.jpg', type: 'image' }] });
    mockUpload
      .mockRejectedValueOnce(new Error('network timeout'))
      .mockResolvedValueOnce('https://cdn/b.jpg');
    const { result } = await renderHook(() => useMatchDetail());

    // First call: upload throws → a.jpg saved locally with pendingUpload (Bug 10 fix)
    await act(async () => { await result.current.handleAddMedia(); });
    // Second call must not be blocked (Bug 5 fix)
    await act(async () => { await result.current.handleAddMedia(); });

    const media = useStore.getState().matches[0].media;
    // Both items saved: a.jpg local (pendingUpload) + b.jpg remote
    expect(media).toHaveLength(2);
    expect(media!.find((m) => m.uri === 'file://a.jpg')?.pendingUpload).toBe(true);
    expect(media!.find((m) => m.uri === 'https://cdn/b.jpg')?.pendingUpload).toBeUndefined();
  });
});

describe('Bug 10 — handleAddMedia: upload throws → photo lost (not saved locally)', () => {
  it('saves with pendingUpload=true and shows uploadFailed alert when upload rejects', async () => {
    useStore.setState({ matches: [MATCH] });
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://s.jpg', type: 'image' }],
    });
    // uploadMediaItem THROWS (not returns null)
    mockUpload.mockRejectedValueOnce(new Error('network timeout'));
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleAddMedia(); });

    // Bug: upload throws → inner try propagates to outer finally → photo NOT saved
    // Fix: catch upload throw and treat as null (save locally with pendingUpload)
    const media = useStore.getState().matches[0].media;
    expect(media).toHaveLength(1);
    expect(media![0].uri).toBe('file://s.jpg');
    expect(media![0].pendingUpload).toBe(true);
  });
});

describe('Bug 6 — handleImportStats: no concurrency guard, double-trigger runs twice', () => {
  it('second call while importingStats=true is a no-op', async () => {
    useStore.setState({ matches: [MATCH] });
    let resolveFirst!: (v: string) => void;
    mockUpload.mockImplementationOnce(() => new Promise((res) => { resolveFirst = res; }));
    mockPicker.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://s.jpg', type: 'image', base64: 'abc', mimeType: 'image/jpeg' }],
    });
    mockExtractStats.mockResolvedValue([
      { key: 'shots', label: 'Shots', home: 5, away: 2, confidence: 'high' },
    ]);

    const { result } = await renderHook(() => useMatchDetail());

    // Start first call (upload hangs) and flush its synchronous state update
    // (#65: importingStats/importStatsStep are now set before the picker await)
    // via a follow-up act(), matching the existing pattern for uninitiated async calls.
    const firstCall = result.current.handleImportStats();
    await act(async () => { await Promise.resolve(); });

    // While first is in progress, importingStats should now be true — second call should be blocked
    // But there's no guard! Both calls proceed:
    mockUpload.mockResolvedValueOnce('https://cdn/s2.jpg');
    await act(async () => { await result.current.handleImportStats(); });

    // Resolve first
    await act(async () => {
      resolveFirst('https://cdn/s1.jpg');
      await firstCall;
    });

    // extractStatsFromPhoto should have been called exactly once (second call was a no-op)
    expect(mockExtractStats).toHaveBeenCalledTimes(1);
  });
});

// Bug 8's old assertion ("importingStats stays false while the picker is open") is no
// longer true by design: #65 now shows a "preparing" state from the moment the picker is
// invoked, to cover the OS's iCloud-download wait that happens inside that single await
// with no progress signal of its own. Per project policy this native/picker-touching flow
// isn't covered by new mocked Jest tests (see feedback_no_tests memory) — verified manually
// on a Release build on device instead, not re-covered here.

describe('visibleMedia — video items hidden until playback is fixed (#59)', () => {
  it('filters out video items but keeps their original index for delete/view', async () => {
    useStore.setState({
      matches: [{
        ...MATCH,
        media: [
          { uri: 'https://cdn.example.com/photo1.jpg', type: 'image' },
          { uri: 'https://cdn.example.com/clip.mp4', type: 'video' },
          { uri: 'https://cdn.example.com/photo2.jpg', type: 'image' },
        ],
      }],
    });
    const { result } = await renderHook(() => useMatchDetail());
    expect(result.current.visibleMedia).toEqual([
      { item: { uri: 'https://cdn.example.com/photo1.jpg', type: 'image' }, originalIndex: 0 },
      { item: { uri: 'https://cdn.example.com/photo2.jpg', type: 'image' }, originalIndex: 2 },
    ]);
  });

  it('hasMediaFiles is false when only video items are attached', async () => {
    useStore.setState({
      matches: [{
        ...MATCH,
        media: [{ uri: 'https://cdn.example.com/clip.mp4', type: 'video' }],
      }],
    });
    const { result } = await renderHook(() => useMatchDetail());
    expect(result.current.visibleMedia).toEqual([]);
    expect(result.current.hasMediaFiles).toBe(false);
  });
});

describe('Bug 7 — handleImportStats: per-photo OCR throw discards stats from earlier photos', () => {
  it('applies stats from photos that succeeded OCR even if a later photo throws', async () => {
    useStore.setState({ matches: [MATCH] });
    mockPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [
        { uri: 'file://a.jpg', type: 'image', base64: 'aaa', mimeType: 'image/jpeg' },
        { uri: 'file://b.jpg', type: 'image', base64: 'bbb', mimeType: 'image/jpeg' },
      ],
    });
    mockUpload
      .mockResolvedValueOnce('https://cdn/a.jpg')
      .mockResolvedValueOnce('https://cdn/b.jpg');
    mockExtractStats
      .mockResolvedValueOnce(makeValidStats({ shots: { home: 7, away: 3 } }))
      .mockRejectedValueOnce(new Error('OCR service error on photo b'));

    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { await result.current.handleImportStats(); });

    // Bug: outer catch fires, stats from photo A (shots) are DISCARDED
    // Expected: shots should be applied from photo A even though photo B failed
    const saved = useStore.getState().matches[0];
    expect(saved.statsOverride?.shots).toEqual({ a: 7, b: 3, confidence: 'high' });
    // OCR failed notification should NOT have shown (partial success is fine)
    expect(result.current.showOcrFailed).toBe(false);
  });
});
