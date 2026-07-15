import { renderHook } from '@testing-library/react-native';
import { getRankedRoundOrdinals, EMPTY_ROUNDS } from '../roundOrdinals';
import { useStore } from '@/store';
import type { ArchivedRound } from '@/store/types';

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({ getString: () => null, set: jest.fn(), remove: jest.fn() }),
}));

const makeRound = (id: string, ranked: boolean): ArchivedRound => ({
  id,
  n: 0,
  date: '',
  winner: '',
  games: 1,
  ranked,
  matches: [],
  name: 'R',
});

describe('getRankedRoundOrdinals', () => {
  it('numbers ranked rounds sequentially starting at 1', () => {
    const rounds = [makeRound('r1', true), makeRound('r2', true), makeRound('r3', true)];
    expect(getRankedRoundOrdinals(rounds)).toEqual({ r1: 1, r2: 2, r3: 3 });
  });

  it('skips friendly rounds instead of counting them', () => {
    const rounds = [makeRound('r1', true), makeRound('r2', false), makeRound('r3', true)];
    const ordinals = getRankedRoundOrdinals(rounds);
    expect(ordinals).toEqual({ r1: 1, r3: 2 });
    expect(ordinals.r2).toBeUndefined();
  });

  it('returns an empty map when there are no ranked rounds', () => {
    const rounds = [makeRound('r1', false), makeRound('r2', false)];
    expect(getRankedRoundOrdinals(rounds)).toEqual({});
  });

  it('returns an empty map for an empty array', () => {
    expect(getRankedRoundOrdinals([])).toEqual({});
  });
});

// Regression test for #77: "Maximum update depth exceeded" crash on
// archive-day. A Zustand selector fell back to a fresh `[]` literal whenever
// `viewingTournament` was null. useSyncExternalStore (which Zustand uses
// under the hood) requires a referentially stable snapshot between calls
// with unchanged state — a brand-new array every read never satisfies that
// equality check, so React re-renders forever. `EMPTY_ROUNDS` fixes this by
// giving the fallback a single stable reference.
describe('EMPTY_ROUNDS (selector reference stability, #77)', () => {
  it('is the same reference across reads', () => {
    expect(EMPTY_ROUNDS).toBe(EMPTY_ROUNDS);
  });

  it('does not cause an infinite update-depth loop when used as a selector fallback', () => {
    useStore.setState({ viewingTournament: null });

    // Mirrors app/archive-day.tsx's `roundsForOrdinal` selector shape.
    // Before the fix this used `s.viewingTournament?.rounds ?? []`, which
    // synchronously threw "Maximum update depth exceeded" on mount because
    // useSyncExternalStore never saw a stable snapshot.
    expect(() =>
      renderHook(() => useStore((s) => s.viewingTournament?.rounds ?? EMPTY_ROUNDS)),
    ).not.toThrow();
  });
});
