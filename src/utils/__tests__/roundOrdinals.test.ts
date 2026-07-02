import { getRankedRoundOrdinals } from '../roundOrdinals';
import type { ArchivedRound } from '@/store/types';

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
