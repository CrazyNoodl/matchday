// Unit tests for src/supabase/client.ts — the MMKV-backed auth storage adapter
// that lets a login session survive an app restart (issue #54).

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    EXPO_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

function mockPlatform(os: 'ios' | 'web') {
  jest.doMock('react-native', () => ({ Platform: { OS: os } }));
}

function mockCreateClient() {
  const createClient = jest.fn(() => ({}));
  jest.doMock('@supabase/supabase-js', () => ({ createClient }));
  return createClient;
}

function loadAuthOptions(createClient: jest.Mock) {
  require('../client');
  return createClient.mock.calls[0][2].auth;
}

describe('supabase auth storage adapter', () => {
  it('wires an MMKV-backed storage adapter on native', () => {
    const mmkvStore = new Map<string, string>();
    jest.doMock('react-native-mmkv', () => ({
      createMMKV: jest.fn(() => ({
        getString: (key: string) => mmkvStore.get(key),
        set: (key: string, value: string) => mmkvStore.set(key, value),
        remove: (key: string) => mmkvStore.delete(key),
      })),
    }));
    mockPlatform('ios');
    const createClient = mockCreateClient();

    const { storage } = loadAuthOptions(createClient);
    expect(storage).toBeDefined();

    storage.setItem('sb-session', 'token-value');
    expect(mmkvStore.get('sb-session')).toBe('token-value');
    expect(storage.getItem('sb-session')).toBe('token-value');

    storage.removeItem('sb-session');
    expect(storage.getItem('sb-session')).toBeNull();
  });

  it('leaves storage undefined on web so the default localStorage adapter is used', () => {
    jest.doMock('react-native-mmkv', () => ({ createMMKV: jest.fn() }));
    mockPlatform('web');
    const createClient = mockCreateClient();

    const { storage } = loadAuthOptions(createClient);
    expect(storage).toBeUndefined();
  });

  it('falls back to an in-memory store when the native MMKV module is unavailable', () => {
    jest.doMock('react-native-mmkv', () => ({
      createMMKV: jest.fn(() => {
        throw new Error('native module not linked');
      }),
    }));
    mockPlatform('ios');
    const createClient = mockCreateClient();

    const { storage } = loadAuthOptions(createClient);
    storage.setItem('key', 'value');
    expect(storage.getItem('key')).toBe('value');

    storage.removeItem('key');
    expect(storage.getItem('key')).toBeNull();
  });

  it('keeps persistSession and autoRefreshToken enabled regardless of platform', () => {
    jest.doMock('react-native-mmkv', () => ({
      createMMKV: jest.fn(() => ({ getString: jest.fn(), set: jest.fn(), remove: jest.fn() })),
    }));
    mockPlatform('ios');
    const createClient = mockCreateClient();

    const auth = loadAuthOptions(createClient);
    expect(auth.persistSession).toBe(true);
    expect(auth.autoRefreshToken).toBe(true);
  });
});
