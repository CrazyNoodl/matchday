import { getPlayerDisplayName } from '../playerDisplay';

describe('getPlayerDisplayName', () => {
  it('returns nick when showNick is true and nick exists', () => {
    expect(getPlayerDisplayName({ name: 'Alice', nick: 'ali' }, true)).toBe('ali');
  });

  it('returns name when showNick is true but player has no nick', () => {
    expect(getPlayerDisplayName({ name: 'Alice', nick: undefined }, true)).toBe('Alice');
  });

  it('returns name when showNick is false regardless of nick', () => {
    expect(getPlayerDisplayName({ name: 'Alice', nick: 'ali' }, false)).toBe('Alice');
  });

  it('returns name when showNick is false and no nick', () => {
    expect(getPlayerDisplayName({ name: 'Bob' }, false)).toBe('Bob');
  });

  it('returns default fallback when player is undefined', () => {
    expect(getPlayerDisplayName(undefined, true)).toBe('Unknown');
    expect(getPlayerDisplayName(undefined, false)).toBe('Unknown');
  });

  it('returns custom fallback when player is undefined', () => {
    expect(getPlayerDisplayName(undefined, true, 'N/A')).toBe('N/A');
  });

  it('returns name (not fallback) when player exists but nick is empty string and showNick is true', () => {
    expect(getPlayerDisplayName({ name: 'Alice', nick: '' }, true)).toBe('Alice');
  });
});
