const ORIGINAL_ENV = process.env;

function setConfiguredEnv() {
  process.env = {
    ...ORIGINAL_ENV,
    EXPO_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  };
}

beforeEach(() => {
  jest.resetModules();
  setConfiguredEnv();
  jest.doMock('@supabase/supabase-js', () => ({ createClient: jest.fn(() => ({})) }));
  jest.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

function mockFetch(impl: jest.Mock) {
  (global as unknown as { fetch: jest.Mock }).fetch = impl;
}

describe('pingSupabase', () => {
  it('resolves true when the health endpoint responds ok', async () => {
    mockFetch(jest.fn().mockResolvedValue({ ok: true }));
    const { pingSupabase } = require('../health');
    await expect(pingSupabase()).resolves.toBe(true);
  });

  it('resolves false when the health endpoint responds with an error status', async () => {
    mockFetch(jest.fn().mockResolvedValue({ ok: false }));
    const { pingSupabase } = require('../health');
    await expect(pingSupabase()).resolves.toBe(false);
  });

  it('resolves false when the request throws (network error)', async () => {
    mockFetch(jest.fn().mockRejectedValue(new Error('network error')));
    const { pingSupabase } = require('../health');
    await expect(pingSupabase()).resolves.toBe(false);
  });

  it('sends the anon key as the apikey header', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    mockFetch(fetchMock);
    const { pingSupabase } = require('../health');
    await pingSupabase();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://test.supabase.co/auth/v1/health',
      expect.objectContaining({ headers: { apikey: 'anon-key' } }),
    );
  });

  it('aborts and resolves false if the request exceeds the timeout', async () => {
    jest.useFakeTimers();
    mockFetch(
      jest.fn(
        (_url: string, init: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener('abort', () => reject(new Error('aborted')));
          }),
      ),
    );
    const { pingSupabase } = require('../health');
    const promise = pingSupabase(1000);
    await jest.advanceTimersByTimeAsync(1000);
    await expect(promise).resolves.toBe(false);
    jest.useRealTimers();
  });

  it('resolves true without making a request when Supabase is not configured', async () => {
    process.env = {
      ...ORIGINAL_ENV,
      EXPO_PUBLIC_SUPABASE_URL: '',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: '',
    };
    const fetchMock = jest.fn();
    mockFetch(fetchMock);
    const { pingSupabase } = require('../health');
    await expect(pingSupabase()).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
