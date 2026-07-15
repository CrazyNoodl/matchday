import { Platform } from 'react-native';
import { useStore, syncSuppressionRef } from '@/store';
import type { RootState } from '@/store';
import { getCurrentUserId } from '@/supabase/auth';
import type {
  RealDataBackup,
  Player,
  Team,
  Match,
  ArchivedRound,
  ClosedTournament,
} from '@/store/types';
import type { ThemePreference } from '@/theme/colors';
import type { Language } from '@/i18n';

// Native module access is dynamic (`await import(...)`) so the web bundle
// never evaluates expo-file-system/expo-document-picker, matching the
// existing convention for platform-touchy native modules (see
// src/components/ShareRoundModal/ShareRoundModal.tsx).
type FileSystemModule = typeof import('expo-file-system');
type SharingModule = typeof import('expo-sharing');
type DocumentPickerModule = typeof import('expo-document-picker');

export const BACKUP_SCHEMA_VERSION = 1;

// Reuses RealDataBackup (the same "what counts as real data" shape the
// demo-mode swap already relies on) plus the display settings a user would
// actually want restored. Deliberately excludes pendingSyncTables/demoMode —
// transient/session state, not data worth backing up.
export interface BackupData extends RealDataBackup {
  showNick: boolean;
  showTeamLogo: boolean;
  colorScheme: ThemePreference;
  language: Language;
}

export interface BackupFile {
  schemaVersion: number;
  exportedAt: string;
  data: BackupData;
}

export interface BackupMeta {
  fileName: string;
  uri: string;
  exportedAt: string;
  sizeBytes?: number;
}

export type BackupValidationResult =
  | { valid: true; file: BackupFile }
  | { valid: false; reason: 'invalidFormat' | 'unsupportedVersion' | 'missingFields' };

// ---------------------------------------------------------------------------
// Filename <-> userId/exportedAt encoding
//
// Filenames double as the sort key and the metadata source for listBackups()
// (no file content needs reading just to show a date), so the timestamp
// encoding must be a lossless, order-preserving transform of the ISO
// timestamp: colons aren't valid in filenames, hyphens are, and swapping
// them keeps the year-month-day-hour-min-sec fields in the same zero-padded
// order, so lexicographic filename sort == chronological order.
//
// The signed-in user's id is embedded too (see #79 — local backups used to
// have no account association at all, so switching accounts on the same
// device surfaced the previous account's backups). 'local' is used as the
// scoping key when there's no signed-in user (offline/no-Supabase usage) —
// there's no other account to leak into on this device in that case.
// ---------------------------------------------------------------------------

const LOCAL_BACKUP_USER_ID = 'local';

async function currentBackupUserId(): Promise<string> {
  return (await getCurrentUserId()) ?? LOCAL_BACKUP_USER_ID;
}

function isoToFileSafe(iso: string): string {
  return iso.replace(/:/g, '-');
}

function fileSafeToIso(safe: string): string | null {
  const m = safe.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})(\.\d+)?Z$/);
  if (!m) return null;
  const [, datePart, hh, mm, ss, msPart] = m;
  return `${datePart}T${hh}:${mm}:${ss}${msPart ?? ''}Z`;
}

export function backupFileName(userId: string, date: Date = new Date()): string {
  return `matchday-backup-${userId}-${isoToFileSafe(date.toISOString())}.json`;
}

const FILE_NAME_RE =
  /^matchday-backup-(.+)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}(?:\.\d+)?Z)\.json$/;

// Backups created before #79 (no userId in the filename) never match this
// pattern and are intentionally excluded from listBackups() — they can't be
// safely attributed to an account, and the whole point of this scoping is to
// never show a backup that isn't provably the current account's.
function parseBackupFileName(fileName: string): { userId: string; exportedAt: string } | null {
  const m = fileName.match(FILE_NAME_RE);
  if (!m) return null;
  const exportedAt = fileSafeToIso(m[2]);
  if (!exportedAt) return null;
  return { userId: m[1], exportedAt };
}

// ---------------------------------------------------------------------------
// Strip media links — player photos, team logos, and match photos/videos are
// cloud-storage URLs. A backup can be restored long after it was created, by
// which point a "Reset All Data" may have wiped the cloud project those URLs
// pointed at, leaving dead links baked into the file. Backups deliberately
// carry none of these fields at all, so a restore never reintroduces a
// broken image/video reference.
// ---------------------------------------------------------------------------

function stripPlayerMedia(player: Player): Player {
  const { photo: _photo, ...rest } = player;
  return rest;
}

function stripTeamMedia(team: Team): Team {
  const { logo: _logo, ...rest } = team;
  return rest;
}

function stripMatchMedia(match: Match): Match {
  const { media: _media, ...rest } = match;
  return rest;
}

function stripRoundMedia(round: ArchivedRound): ArchivedRound {
  return { ...round, matches: round.matches.map(stripMatchMedia) };
}

function stripClosedTournamentMedia(tournament: ClosedTournament): ClosedTournament {
  return { ...tournament, rounds: tournament.rounds.map(stripRoundMedia) };
}

// ---------------------------------------------------------------------------
// Build / serialize / validate — pure
// ---------------------------------------------------------------------------

export function buildBackupPayload(state: RootState): BackupFile {
  const data: BackupData = {
    tournamentId: state.tournamentId,
    hasTournament: state.hasTournament,
    tournamentName: state.tournamentName,
    round: state.round,
    roundOpen: state.roundOpen,
    tournamentRanked: state.tournamentRanked,
    tournamentRounds: state.tournamentRounds,
    tournamentPlayers: state.tournamentPlayers,
    roundPlayers: state.roundPlayers,
    matches: state.matches.map(stripMatchMedia),
    archivedRounds: state.archivedRounds.map(stripRoundMedia),
    closedTournaments: state.closedTournaments.map(stripClosedTournamentMedia),
    players: state.players.map(stripPlayerMedia),
    teams: state.teams.map(stripTeamMedia),
    showNick: state.showNick,
    showTeamLogo: state.showTeamLogo,
    colorScheme: state.colorScheme,
    language: state.language,
  };
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function serializeBackup(file: BackupFile): string {
  return JSON.stringify(file, null, 2);
}

const STRING_FIELDS = ['tournamentId', 'tournamentName', 'colorScheme', 'language'] as const;
const BOOLEAN_FIELDS = [
  'hasTournament',
  'roundOpen',
  'tournamentRanked',
  'showNick',
  'showTeamLogo',
] as const;
const NUMBER_FIELDS = ['round', 'tournamentRounds'] as const;
const ARRAY_FIELDS = [
  'tournamentPlayers',
  'roundPlayers',
  'matches',
  'archivedRounds',
  'closedTournaments',
  'players',
  'teams',
] as const;

export function validateBackupFile(raw: unknown): BackupValidationResult {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { valid: false, reason: 'invalidFormat' };
  }
  const file = raw as Record<string, unknown>;

  if (typeof file.schemaVersion !== 'number') {
    return { valid: false, reason: 'invalidFormat' };
  }
  if (file.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    return { valid: false, reason: 'unsupportedVersion' };
  }
  if (typeof file.exportedAt !== 'string' || typeof file.data !== 'object' || file.data === null) {
    return { valid: false, reason: 'invalidFormat' };
  }

  const data = file.data as Record<string, unknown>;
  for (const f of STRING_FIELDS)
    if (typeof data[f] !== 'string') return { valid: false, reason: 'missingFields' };
  for (const f of BOOLEAN_FIELDS)
    if (typeof data[f] !== 'boolean') return { valid: false, reason: 'missingFields' };
  for (const f of NUMBER_FIELDS)
    if (typeof data[f] !== 'number') return { valid: false, reason: 'missingFields' };
  for (const f of ARRAY_FIELDS)
    if (!Array.isArray(data[f])) return { valid: false, reason: 'missingFields' };

  return { valid: true, file: file as unknown as BackupFile };
}

// ---------------------------------------------------------------------------
// Apply locally — the only function that mutates the store. Brackets the
// mutation with syncSuppressionRef exactly like resetStore() does, so
// useSyncManager's dirty-tracking subscriber never sees this as an edit to
// push — restoring an old/smaller backup is the same class of risk that
// caused the 2026-07-06 sync data-loss incident.
// ---------------------------------------------------------------------------

export function applyBackupLocally(data: BackupData): void {
  syncSuppressionRef.current = true;
  useStore.setState({
    ...data,
    pendingSyncTables: [],
    modal: null,
    selectedMatchId: null,
    viewingRound: null,
    viewingTournament: null,
  });
  syncSuppressionRef.current = false;
}

// ---------------------------------------------------------------------------
// Platform-branching I/O
// ---------------------------------------------------------------------------

export async function createBackup(): Promise<
  { ok: true; meta: BackupMeta } | { ok: false; reason: 'writeFailed' }
> {
  const file = buildBackupPayload(useStore.getState());
  const json = serializeBackup(file);
  const userId = await currentBackupUserId();
  const fileName = backupFileName(userId, new Date(file.exportedAt));

  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(fileName, json);
      return {
        ok: true,
        meta: { fileName, uri: fileName, exportedAt: file.exportedAt, sizeBytes: json.length },
      };
    }
    const { File, Directory, Paths } = (await import('expo-file-system')) as FileSystemModule;
    const f = new File(new Directory(Paths.document, 'backups'), fileName);
    f.create({ intermediates: true, overwrite: true });
    f.write(json);
    return {
      ok: true,
      meta: { fileName, uri: f.uri, exportedAt: file.exportedAt, sizeBytes: f.size },
    };
  } catch {
    return { ok: false, reason: 'writeFailed' };
  }
}

export async function listBackups(): Promise<BackupMeta[]> {
  const userId = await currentBackupUserId();

  if (Platform.OS === 'web') {
    const metas: BackupMeta[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const parsed = parseBackupFileName(key);
      if (!parsed || parsed.userId !== userId) continue;
      const value = localStorage.getItem(key) ?? '';
      metas.push({
        fileName: key,
        uri: key,
        exportedAt: parsed.exportedAt,
        sizeBytes: value.length,
      });
    }
    return metas.sort((a, b) => (a.fileName < b.fileName ? 1 : -1));
  }

  try {
    const { Directory, File, Paths } = (await import('expo-file-system')) as FileSystemModule;
    const dir = new Directory(Paths.document, 'backups');
    if (!dir.exists) return [];
    const metas: BackupMeta[] = [];
    for (const entry of dir.list()) {
      if (!(entry instanceof File)) continue;
      const parsed = parseBackupFileName(entry.name);
      if (!parsed || parsed.userId !== userId) continue;
      metas.push({
        fileName: entry.name,
        uri: entry.uri,
        exportedAt: parsed.exportedAt,
        sizeBytes: entry.size,
      });
    }
    return metas.sort((a, b) => (a.fileName < b.fileName ? 1 : -1));
  } catch {
    return [];
  }
}

export async function shareBackup(
  meta: BackupMeta,
  dialogTitle?: string,
): Promise<{ ok: true } | { ok: false; reason: 'shareFailed' | 'notAvailable' }> {
  try {
    if (Platform.OS === 'web') {
      const json = localStorage.getItem(meta.fileName);
      if (json == null) return { ok: false, reason: 'shareFailed' };
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = meta.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { ok: true };
    }
    const Sharing = (await import('expo-sharing')) as SharingModule;
    if (!(await Sharing.isAvailableAsync())) return { ok: false, reason: 'notAvailable' };
    await Sharing.shareAsync(meta.uri, { mimeType: 'application/json', dialogTitle });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'shareFailed' };
  }
}

export async function deleteBackup(meta: BackupMeta): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(meta.fileName);
    return;
  }
  try {
    const { File } = (await import('expo-file-system')) as FileSystemModule;
    new File(meta.uri).delete();
  } catch {
    // Already gone or inaccessible — nothing further to do.
  }
}

// Reads the content of one of listBackups()'s own entries directly, so
// restoring from the on-screen list doesn't require re-picking the same
// file through the OS document picker.
export async function readBackupMeta(
  meta: BackupMeta,
): Promise<{ ok: true; raw: unknown } | { ok: false; reason: 'readError' | 'parseError' }> {
  let text: string;
  try {
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem(meta.fileName);
      if (stored == null) throw new Error('missing');
      text = stored;
    } else {
      const { File } = (await import('expo-file-system')) as FileSystemModule;
      text = await new File(meta.uri).text();
    }
  } catch {
    return { ok: false, reason: 'readError' };
  }
  try {
    return { ok: true, raw: JSON.parse(text) };
  } catch {
    return { ok: false, reason: 'parseError' };
  }
}

// Imports an arbitrary file (not necessarily one from listBackups() — e.g. a
// backup saved elsewhere or received from another device) via the OS
// document picker (native) or a file input (web). Returns unvalidated JSON
// so validateBackupFile() stays independently testable.
export async function pickAndReadBackupFile(): Promise<
  | { ok: true; raw: unknown; fileName: string }
  | { ok: false; reason: 'canceled' | 'parseError' | 'readError' }
> {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      // Cross-browser cancel detection is best-effort: the 'cancel' event is
      // only supported on newer Chromium/Firefox — older browsers fire
      // neither 'change' nor 'cancel' when the user dismisses the picker.
      input.oncancel = () => resolve({ ok: false, reason: 'canceled' });
      input.onchange = () => {
        const f = input.files?.[0];
        if (!f) {
          resolve({ ok: false, reason: 'canceled' });
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          try {
            resolve({ ok: true, raw: JSON.parse(reader.result as string), fileName: f.name });
          } catch {
            resolve({ ok: false, reason: 'parseError' });
          }
        };
        reader.onerror = () => resolve({ ok: false, reason: 'readError' });
        reader.readAsText(f);
      };
      input.click();
    });
  }

  let result: Awaited<ReturnType<DocumentPickerModule['getDocumentAsync']>>;
  try {
    const DocumentPicker = (await import('expo-document-picker')) as DocumentPickerModule;
    result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
  } catch {
    return { ok: false, reason: 'readError' };
  }
  if (result.canceled || !result.assets?.[0]) return { ok: false, reason: 'canceled' };

  let text: string;
  try {
    const { File } = (await import('expo-file-system')) as FileSystemModule;
    text = await new File(result.assets[0].uri).text();
  } catch {
    return { ok: false, reason: 'readError' };
  }
  try {
    return { ok: true, raw: JSON.parse(text), fileName: result.assets[0].name };
  } catch {
    return { ok: false, reason: 'parseError' };
  }
}
