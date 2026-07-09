import { matchMediaFolder, stripUploadingMedia } from '../sliceHelpers';
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

describe('stripUploadingMedia', () => {
  it('drops uploading:true items (upload was mid-flight when the app died)', () => {
    const match = makeMatch({
      media: [
        { uri: 'file:///tmp/a.jpg', type: 'image', uploading: true },
        { uri: 'https://cdn/b.jpg', type: 'image' },
      ],
    });
    const [result] = stripUploadingMedia([match]);
    expect(result.media).toEqual([{ uri: 'https://cdn/b.jpg', type: 'image' }]);
  });

  it('keeps pendingUpload:true items so a failed upload survives a restart for later retry', () => {
    const match = makeMatch({
      media: [{ uri: 'file:///tmp/a.jpg', type: 'image', pendingUpload: true }],
    });
    const [result] = stripUploadingMedia([match]);
    expect(result.media).toEqual([
      { uri: 'file:///tmp/a.jpg', type: 'image', pendingUpload: true },
    ]);
  });

  it('leaves a match with no transient media untouched (same reference)', () => {
    const match = makeMatch({ media: [{ uri: 'https://cdn/b.jpg', type: 'image' }] });
    const [result] = stripUploadingMedia([match]);
    expect(result).toBe(match);
  });

  it('handles a match with no media at all', () => {
    const match = makeMatch();
    expect(stripUploadingMedia([match])).toEqual([match]);
  });
});
