import { buildSharedRoundUrl } from '../sharedRoundUrl';

describe('buildSharedRoundUrl', () => {
  it('builds a ?shared=<id> query url under the given base url', () => {
    expect(buildSharedRoundUrl('/matchday', 'abc-123')).toBe('/matchday/?shared=abc-123');
  });

  it('works with an empty base url (native/local dev)', () => {
    expect(buildSharedRoundUrl('', 'abc-123')).toBe('/?shared=abc-123');
  });
});
