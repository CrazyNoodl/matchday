import { countPendingMedia } from '../pendingSync';
import type { Match, ArchivedRound } from '@/store/types';

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

const makeRound = (matches: Match[], overrides: Partial<ArchivedRound> = {}): ArchivedRound => ({
  id: 'round-1',
  n: 1,
  date: '2026-07-09',
  winner: 'p1',
  games: matches.length,
  ranked: true,
  name: 'Round 1',
  matches,
  ...overrides,
});

describe('countPendingMedia', () => {
  it('returns 0 when nothing is pending anywhere', () => {
    const matches = [makeMatch({ media: [{ uri: 'https://cdn/a.jpg', type: 'image' }] })];
    expect(countPendingMedia(matches, [])).toBe(0);
  });

  it('counts pendingUpload items in the open round', () => {
    const matches = [
      makeMatch({
        media: [
          { uri: 'file:///tmp/a.jpg', type: 'image', pendingUpload: true },
          { uri: 'https://cdn/b.jpg', type: 'image' },
        ],
      }),
      makeMatch({ id: 'match-2', media: [{ uri: 'file:///tmp/c.jpg', type: 'image', pendingUpload: true }] }),
    ];
    expect(countPendingMedia(matches, [])).toBe(2);
  });

  it('counts pendingUpload items nested inside archived rounds too', () => {
    const archivedRounds = [
      makeRound([
        makeMatch({ media: [{ uri: 'file:///tmp/a.jpg', type: 'image', pendingUpload: true }] }),
      ]),
      makeRound([
        makeMatch({ id: 'match-2' }),
        makeMatch({
          id: 'match-3',
          media: [{ uri: 'file:///tmp/b.jpg', type: 'image', pendingUpload: true }],
        }),
      ]),
    ];
    expect(countPendingMedia([], archivedRounds)).toBe(2);
  });

  it('ignores matches with no media field', () => {
    expect(countPendingMedia([makeMatch()], [])).toBe(0);
  });
});
