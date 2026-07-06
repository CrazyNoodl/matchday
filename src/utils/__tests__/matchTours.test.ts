import { Match } from '@/store/types';
import { groupMatchesByTour, getCurrentTourMatches, getPlayedPartnerIds } from '../matchTours';

function makeMatch(id: string, aId: string, bId: string): Match {
  return { id, aId, bId, aTeam: 'A', bTeam: 'B', aScore: 0, bScore: 0 };
}

describe('groupMatchesByTour', () => {
  it('groups matches into blocks of tourSize for a full round-robin', () => {
    // 3 players -> tourSize 3
    const matches = [
      makeMatch('m1', 'p1', 'p2'),
      makeMatch('m2', 'p1', 'p3'),
      makeMatch('m3', 'p2', 'p3'),
      makeMatch('m4', 'p1', 'p2'),
    ];
    const groups = groupMatchesByTour(matches, 3);
    expect(groups).toHaveLength(2);
    expect(groups[0].matches).toHaveLength(3);
    expect(groups[1].matches).toHaveLength(1);
  });

  it('returns a single group when playerCount <= 1', () => {
    const matches = [makeMatch('m1', 'p1', 'p2')];
    const groups = groupMatchesByTour(matches, 1);
    expect(groups).toEqual([{ tourNumber: 1, matches }]);
  });

  it('returns a single empty group when there are no matches', () => {
    const groups = groupMatchesByTour([], 3);
    expect(groups).toEqual([{ tourNumber: 1, matches: [] }]);
  });
});

describe('getCurrentTourMatches', () => {
  it('returns an empty array when no matches have been played', () => {
    expect(getCurrentTourMatches([], 3)).toEqual([]);
  });

  it('returns an empty array when the last tour just completed', () => {
    const matches = [
      makeMatch('m1', 'p1', 'p2'),
      makeMatch('m2', 'p1', 'p3'),
      makeMatch('m3', 'p2', 'p3'),
    ];
    expect(getCurrentTourMatches(matches, 3)).toEqual([]);
  });

  it('returns only the tail matches of an in-progress tour', () => {
    const matches = [
      makeMatch('m1', 'p1', 'p2'),
      makeMatch('m2', 'p1', 'p3'),
      makeMatch('m3', 'p2', 'p3'),
      makeMatch('m4', 'p1', 'p2'),
    ];
    const current = getCurrentTourMatches(matches, 3);
    expect(current).toEqual([matches[3]]);
  });

  it('returns an empty array when playerCount <= 1', () => {
    expect(getCurrentTourMatches([makeMatch('m1', 'p1', 'p2')], 1)).toEqual([]);
  });
});

describe('getPlayedPartnerIds', () => {
  it('returns opponents for a player who appears as aId or bId', () => {
    const matches = [
      makeMatch('m1', 'p1', 'p2'),
      makeMatch('m2', 'p3', 'p1'),
    ];
    expect(getPlayedPartnerIds(matches, 'p1')).toEqual(new Set(['p2', 'p3']));
  });

  it('returns an empty set when the player has not played yet', () => {
    const matches = [makeMatch('m1', 'p2', 'p3')];
    expect(getPlayedPartnerIds(matches, 'p1')).toEqual(new Set());
  });
});
