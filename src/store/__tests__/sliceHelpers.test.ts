import { matchMediaFolder } from '../sliceHelpers';
import type { Match } from '../types';

const makeMatch = (overrides: Partial<Match> = {}): Match => ({
  id: 'match-1',
  aId: 'p1',
  bId: 'p2',
  aScore: 2,
  bScore: 1,
  aTeam: 'JUV',
  bTeam: 'BAR',
  ...overrides,
});

describe('matchMediaFolder', () => {
  it('nests the match folder under the round folder when both are known', () => {
    const match = makeMatch({ mediaFolder: 'match_2-1_2026-07-03_1200' });
    expect(matchMediaFolder('matchday-2026-07-03_1100', match)).toBe(
      'matchday-2026-07-03_1100/match_2-1_2026-07-03_1200',
    );
  });

  it('falls back to the bare match folder when the round has no folder yet (round predates #67)', () => {
    const match = makeMatch({ mediaFolder: 'match_2-1_2026-07-03_1200' });
    expect(matchMediaFolder(undefined, match)).toBe('match_2-1_2026-07-03_1200');
  });

  it('falls back to the match id when the match itself has no mediaFolder (match predates #67)', () => {
    const match = makeMatch({ mediaFolder: undefined });
    expect(matchMediaFolder('matchday-2026-07-03_1100', match)).toBe('match-1');
    expect(matchMediaFolder(undefined, match)).toBe('match-1');
  });
});
