import { hasAnyRecordedMatch } from '../tournamentGuards';
import { type ArchivedRound, type Match } from '../../store/types';

const match = (id: string): Match => ({
  id,
  aId: 'p1',
  bId: 'p2',
  aTeam: 'JUV',
  bTeam: 'BAR',
  aScore: 1,
  bScore: 0,
});

const round = (id: string, matches: Match[]): ArchivedRound => ({
  id,
  n: 1,
  date: '',
  winner: '',
  games: matches.length,
  ranked: true,
  matches,
  name: 'Round 1',
});

describe('hasAnyRecordedMatch', () => {
  it('is false when there are no matches and no archived rounds', () => {
    expect(hasAnyRecordedMatch([], [])).toBe(false);
  });

  it('is false for a started round with no matches yet', () => {
    expect(hasAnyRecordedMatch([], [])).toBe(false);
  });

  it('is true when the current (possibly open) round has matches', () => {
    expect(hasAnyRecordedMatch([match('m1')], [])).toBe(true);
  });

  it('is true when an archived round has matches, even if current matches is empty', () => {
    expect(hasAnyRecordedMatch([], [round('r1', [match('m1')])])).toBe(true);
  });

  it('is false when archived rounds exist but are all empty', () => {
    expect(hasAnyRecordedMatch([], [round('r1', [])])).toBe(false);
  });
});
