import { filterRoundsByRanked, countChampDaysWon } from '../seasonStatsAggregation';
import { type ArchivedRound } from '../../store/types';

const round = (id: string, ranked: boolean, winner = ''): ArchivedRound => ({
  id,
  n: 1,
  date: '2026-01-01',
  winner,
  games: 0,
  ranked,
  matches: [],
  name: 'Round',
});

describe('filterRoundsByRanked', () => {
  const rounds = [round('r1', true), round('r2', false), round('r3', true)];

  it('returns only ranked rounds for "Rated"', () => {
    expect(filterRoundsByRanked(rounds, 'Rated').map((r) => r.id)).toEqual(['r1', 'r3']);
  });

  it('returns only unranked rounds for "Friendly"', () => {
    expect(filterRoundsByRanked(rounds, 'Friendly').map((r) => r.id)).toEqual(['r2']);
  });

  it('returns every round for "Both"', () => {
    expect(filterRoundsByRanked(rounds, 'Both')).toEqual(rounds);
  });

  it('returns an empty array when there are no rounds', () => {
    expect(filterRoundsByRanked([], 'Both')).toEqual([]);
  });
});

describe('countChampDaysWon', () => {
  it('returns 0 when the champion never won a round in the given set', () => {
    const rounds = [round('r1', true, 'p2'), round('r2', true, 'p2')];
    expect(countChampDaysWon(rounds, 'p1')).toBe(0);
  });

  it('counts rounds where winner matches champId', () => {
    const rounds = [round('r1', true, 'p1'), round('r2', true, 'p2'), round('r3', true, 'p1')];
    expect(countChampDaysWon(rounds, 'p1')).toBe(2);
  });

  it('does not count a true-draw round (empty winner string)', () => {
    const rounds = [round('r1', true, ''), round('r2', true, 'p1')];
    expect(countChampDaysWon(rounds, 'p1')).toBe(1);
  });

  it('still counts a friendly round win by the champion when passed friendly rounds — current behavior, not gated by ranked', () => {
    // Documents the existing quirk: countChampDaysWon has no knowledge of
    // `ranked` — filtering by ranked/friendly is the caller's job
    // (filterRoundsByRanked). Passing it a friendly round the champ won
    // still counts it, even though the championship itself is decided from
    // ranked rounds only (see closeTournament() in tournamentSlice.ts).
    const friendlyWin = round('r1', false, 'p1');
    expect(countChampDaysWon([friendlyWin], 'p1')).toBe(1);
  });
});
