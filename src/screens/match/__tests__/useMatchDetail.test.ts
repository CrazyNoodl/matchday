jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({ getString: () => null, set: jest.fn(), remove: jest.fn() }),
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
}));

jest.mock('@/utils/extractStats', () => ({
  extractStatsFromPhoto: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { All: 'All' },
}));

import { renderHook, act } from '@testing-library/react-native';
import { useMatchDetail } from '../useMatchDetail';
import { useStore } from '@/store';
import type { Match, ArchivedRound, ClosedTournament } from '@/store/types';

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
  jest.clearAllMocks();
  useStore.getState().resetStore();
});

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
    await act(async () => { result.current.adjustStat('shots', 'a', 3); });
    expect(result.current.editValues['shots']?.a).toBe(3);
  });

  it('decrements stat value', async () => {
    useStore.setState({ matches: [MATCH] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => {
      result.current.adjustStat('shots', 'a', 5);
      result.current.adjustStat('shots', 'a', -2);
    });
    expect(result.current.editValues['shots']?.a).toBe(3);
  });

  it('clamps at zero — never goes negative', async () => {
    useStore.setState({ matches: [MATCH] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => { result.current.adjustStat('fouls', 'b', -10); });
    expect(result.current.editValues['fouls']?.b).toBe(0);
  });

  it('tracks side A and side B independently', async () => {
    useStore.setState({ matches: [MATCH] });
    const { result } = await renderHook(() => useMatchDetail());
    await act(async () => {
      result.current.adjustStat('passes', 'a', 10);
      result.current.adjustStat('passes', 'b', 7);
    });
    expect(result.current.editValues['passes']?.a).toBe(10);
    expect(result.current.editValues['passes']?.b).toBe(7);
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
