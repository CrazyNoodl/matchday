import { parseRecoveryTokens } from '../authRecovery';

describe('parseRecoveryTokens', () => {
  it('extracts access_token and refresh_token from a recovery URL', () => {
    const url =
      'matchday://reset-password#access_token=abc123&refresh_token=def456&type=recovery&expires_in=3600';
    expect(parseRecoveryTokens(url)).toEqual({
      accessToken: 'abc123',
      refreshToken: 'def456',
    });
  });

  it('works with an http(s) redirect URL', () => {
    const url =
      'https://example.com/matchday/reset-password#access_token=abc&refresh_token=def&type=recovery';
    expect(parseRecoveryTokens(url)).toEqual({ accessToken: 'abc', refreshToken: 'def' });
  });

  it('returns null when there is no fragment', () => {
    expect(parseRecoveryTokens('matchday://reset-password')).toBeNull();
  });

  it('returns null when type is not "recovery"', () => {
    const url = 'matchday://callback#access_token=abc&refresh_token=def&type=signup';
    expect(parseRecoveryTokens(url)).toBeNull();
  });

  it('returns null when access_token is missing', () => {
    const url = 'matchday://reset-password#refresh_token=def&type=recovery';
    expect(parseRecoveryTokens(url)).toBeNull();
  });

  it('returns null when refresh_token is missing', () => {
    const url = 'matchday://reset-password#access_token=abc&type=recovery';
    expect(parseRecoveryTokens(url)).toBeNull();
  });

  it('returns null for an unrelated deep link URL', () => {
    expect(parseRecoveryTokens('matchday://round/123')).toBeNull();
  });
});
