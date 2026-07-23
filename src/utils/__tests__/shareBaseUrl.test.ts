import { SHARE_BASE_URL } from '../shareBaseUrl';

describe('SHARE_BASE_URL', () => {
  it('is an absolute URL, not derived from the web-only experiments.baseUrl', () => {
    expect(SHARE_BASE_URL).toBe('https://crazynoodl.github.io/matchday');
  });
});
