/**
 * Tests for the local JSON backup feature — pure payload building/validation,
 * the syncSuppressionRef-guarded local apply, and the web storage I/O path
 * (localStorage only). Native file/share/document-picker paths and the web
 * <input type=file>/<a download> DOM interactions are exercised manually per
 * the feature's plan — this repo's convention is not to unit-test native
 * file/upload flows (see src/store/__tests__/ for the pattern of what's
 * tested vs not).
 */

import { useStore, syncSuppressionRef } from '@/store';
import type { Player, Team, Match, ArchivedRound, ClosedTournament } from '@/store/types';
import {
  BACKUP_SCHEMA_VERSION,
  backupFileName,
  buildBackupPayload,
  serializeBackup,
  validateBackupFile,
  applyBackupLocally,
  createBackup,
  listBackups,
  deleteBackup,
  readBackupMeta,
  type BackupData,
} from '../backup';

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: () => null,
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

// Minimal in-memory Web Storage polyfill — the Jest "node" test environment
// has no real localStorage, but backup.ts's web branch calls the same API a
// real browser would.
class MemoryLocalStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  get length(): number {
    return this.store.size;
  }
}

const REAL_PLAYER: Player = { id: 'p1', name: 'Player One', teamCode: 'JUV' };
const REAL_TEAM: Team = { code: 'JUV', name: 'Juventus', short: 'JUV', color: '#000000' };

function freshStore() {
  useStore.getState().resetStore();
  useStore.getState().addPlayer(REAL_PLAYER);
  useStore.getState().addTeam(REAL_TEAM);
}

beforeEach(() => {
  (global as unknown as { localStorage: Storage }).localStorage =
    new MemoryLocalStorage() as unknown as Storage;
  freshStore();
});

describe('backupFileName', () => {
  it('produces a filesystem-safe, chronologically-sortable name', () => {
    const name = backupFileName(new Date('2026-07-06T14:32:05.123Z'));
    expect(name).toBe('matchday-backup-2026-07-06T14-32-05.123Z.json');
    expect(name).not.toMatch(/:/);
  });
});

describe('buildBackupPayload', () => {
  it('includes exactly the expected data fields and excludes transient state', () => {
    const file = buildBackupPayload(useStore.getState());

    expect(file.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(new Date(file.exportedAt).toString()).not.toBe('Invalid Date');
    expect(file.data.players).toEqual([REAL_PLAYER]);
    expect(file.data.teams).toEqual([REAL_TEAM]);
    expect(file.data).not.toHaveProperty('pendingSyncTables');
    expect(file.data).not.toHaveProperty('demoMode');
    expect(file.data).not.toHaveProperty('realDataBackup');
  });

  it('strips player photos, team logos, and match media — those are cloud-storage links that can go stale', () => {
    const playerWithPhoto: Player = { ...REAL_PLAYER, photo: 'https://cloud.example/p1.jpg' };
    const teamWithLogo: Team = { ...REAL_TEAM, logo: 'https://cloud.example/juv.png' };
    const matchWithMedia: Match = {
      id: 'm1',
      aId: 'p1',
      bId: 'other',
      aTeam: 'JUV',
      bTeam: 'GAL',
      aScore: 1,
      bScore: 0,
      media: [{ uri: 'https://cloud.example/m1.jpg', type: 'image' }],
    };
    const archivedRound: ArchivedRound = {
      id: 'r1',
      n: 1,
      date: '2026-01-01T00:00:00.000Z',
      winner: 'p1',
      games: 1,
      ranked: true,
      matches: [matchWithMedia],
      name: 'Round 1',
    };
    const closedTournament: ClosedTournament = {
      id: 't1',
      name: 'Tournament 1',
      date: '2026-01-01T00:00:00.000Z',
      rounds: [archivedRound],
      champId: 'p1',
      champName: 'Player One',
      champColor: '#ff0000',
      champInit: 'P',
      players: ['p1'],
    };

    useStore.setState({
      players: [playerWithPhoto],
      teams: [teamWithLogo],
      matches: [matchWithMedia],
      archivedRounds: [archivedRound],
      closedTournaments: [closedTournament],
    });

    const file = buildBackupPayload(useStore.getState());

    expect(file.data.players[0]).not.toHaveProperty('photo');
    expect(file.data.teams[0]).not.toHaveProperty('logo');
    expect(file.data.matches[0]).not.toHaveProperty('media');
    expect(file.data.archivedRounds[0].matches[0]).not.toHaveProperty('media');
    expect(file.data.closedTournaments[0].rounds[0].matches[0]).not.toHaveProperty('media');
  });
});

describe('serializeBackup', () => {
  it('round-trips through JSON.parse back to a deep-equal object', () => {
    const file = buildBackupPayload(useStore.getState());
    const parsed = JSON.parse(serializeBackup(file));
    expect(parsed).toEqual(file);
  });
});

describe('validateBackupFile', () => {
  const validFile = () => buildBackupPayload(useStore.getState());

  it('accepts a valid full file', () => {
    const file = validFile();
    expect(validateBackupFile(file)).toEqual({ valid: true, file });
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'not an object'],
  ])('rejects %s as invalidFormat', (_label, raw) => {
    expect(validateBackupFile(raw)).toEqual({ valid: false, reason: 'invalidFormat' });
  });

  it('rejects a missing schemaVersion as invalidFormat', () => {
    const { schemaVersion: _schemaVersion, ...rest } = validFile();
    expect(validateBackupFile(rest)).toEqual({ valid: false, reason: 'invalidFormat' });
  });

  it('rejects an unknown schemaVersion as unsupportedVersion', () => {
    expect(validateBackupFile({ ...validFile(), schemaVersion: 999 })).toEqual({
      valid: false,
      reason: 'unsupportedVersion',
    });
  });

  it('rejects a missing array field as missingFields', () => {
    const file = validFile();
    const { players: _players, ...restData } = file.data;
    expect(validateBackupFile({ ...file, data: restData })).toEqual({
      valid: false,
      reason: 'missingFields',
    });
  });

  it('rejects a wrong-typed scalar field as missingFields', () => {
    const file = validFile();
    expect(validateBackupFile({ ...file, data: { ...file.data, hasTournament: 'yes' } })).toEqual({
      valid: false,
      reason: 'missingFields',
    });
  });
});

describe('applyBackupLocally', () => {
  it('brackets the mutation with syncSuppressionRef and fully replaces state', () => {
    const otherPlayer: Player = { id: 'other', name: 'Other', teamCode: 'GAL' };
    const backupData: BackupData = {
      ...buildBackupPayload(useStore.getState()).data,
      players: [otherPlayer],
    };

    let suppressedDuringMutation = false;
    const unsubscribe = useStore.subscribe(() => {
      suppressedDuringMutation = syncSuppressionRef.current;
    });

    applyBackupLocally(backupData);
    unsubscribe();

    expect(suppressedDuringMutation).toBe(true);
    expect(syncSuppressionRef.current).toBe(false);
    expect(useStore.getState().players).toEqual([otherPlayer]);
    expect(useStore.getState().pendingSyncTables).toEqual([]);
  });
});

describe('web storage I/O', () => {
  it('creates a backup, lists it, reads it back, and deletes it', async () => {
    const created = await createBackup();
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const list = await listBackups();
    expect(list).toHaveLength(1);
    expect(list[0].fileName).toBe(created.meta.fileName);

    const read = await readBackupMeta(created.meta);
    expect(read.ok).toBe(true);
    if (read.ok) {
      expect(validateBackupFile(read.raw).valid).toBe(true);
    }

    await deleteBackup(created.meta);
    expect(await listBackups()).toEqual([]);
  });

  it('sorts backups newest first by filename', async () => {
    const older = backupFileName(new Date('2026-01-01T00:00:00.000Z'));
    const newer = backupFileName(new Date('2026-06-01T00:00:00.000Z'));
    localStorage.setItem(older, serializeBackup(buildBackupPayload(useStore.getState())));
    localStorage.setItem(newer, serializeBackup(buildBackupPayload(useStore.getState())));

    const list = await listBackups();
    expect(list.map((b) => b.fileName)).toEqual([newer, older]);
  });
});
