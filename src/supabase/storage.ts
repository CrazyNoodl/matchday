import * as Sentry from '@sentry/react-native';
import { supabase } from './client';
import { getCurrentUserId } from './auth';
import type { MediaItem, MediaType } from '../store/types';

const BUCKET = 'match-media';

// ---------------------------------------------------------------------------
// Upload a single media file, return public URL or null on failure
// ---------------------------------------------------------------------------

export async function uploadMediaItem(
  localUri: string,
  type: MediaType,
  context?: { tournamentId: string; mediaFolder: string; filenamePrefix?: string },
): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  try {
    const ext = type === 'video' ? 'mp4' : 'jpg';
    const filename = `${context?.filenamePrefix ?? ''}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path =
      context?.tournamentId && context?.mediaFolder
        ? `${userId}/${context.tournamentId}/${context.mediaFolder}/${filename}`
        : `${userId}/${filename}`;
    const mimeType = type === 'video' ? 'video/mp4' : 'image/jpeg';

    const ok = await uploadViaFetch(localUri, path, mimeType);
    if (!ok) return null;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? null;
  } catch (e) {
    console.warn('[storage] upload error:', e);
    Sentry.captureException(e, { tags: { storageOp: 'uploadMediaItem' } });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Upload a team logo, return public URL or null on failure
// ---------------------------------------------------------------------------

export async function uploadTeamLogo(localUri: string): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  try {
    const path = `${userId}/team-logos/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

    const ok = await uploadViaFetch(localUri, path, 'image/jpeg');
    if (!ok) return null;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? null;
  } catch (e) {
    console.warn('[storage] team logo upload error:', e);
    Sentry.captureException(e, { tags: { storageOp: 'uploadTeamLogo' } });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Upload multiple items, return MediaItem[] with remote URLs
// Items that fail upload are marked pendingUpload so the caller can retry
// later (same pattern as useMatchDetail.ts's handleAddMedia/handleRetryUpload)
// ---------------------------------------------------------------------------

export async function uploadMediaItems(
  items: MediaItem[],
  context?: { tournamentId: string; mediaFolder: string },
): Promise<MediaItem[]> {
  return Promise.all(
    items.map(async (item) => {
      if (isRemoteUrl(item.uri)) return item; // already uploaded
      const remoteUrl = await uploadMediaItem(item.uri, item.type, context);
      return remoteUrl ? { uri: remoteUrl, type: item.type } : { ...item, pendingUpload: true };
    }),
  );
}

// ---------------------------------------------------------------------------
// Delete a file from storage by its public URL
// ---------------------------------------------------------------------------

export async function deleteMediaItem(publicUrl: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId || !isRemoteUrl(publicUrl)) return;

  try {
    const path = extractStoragePath(publicUrl);
    if (!path) return;
    await supabase.storage.from(BUCKET).remove([path]);
  } catch (e) {
    console.warn('[storage] delete error:', e);
    Sentry.captureException(e, { tags: { storageOp: 'deleteMediaItem' } });
  }
}

// ---------------------------------------------------------------------------
// Delete every file under a storage prefix (e.g. a round or match folder).
// Supabase Storage has no recursive folder delete — list() only returns one
// level at a time, with sub-folders coming back as entries with id === null —
// so we walk the tree ourselves before batching remove() calls.
// ---------------------------------------------------------------------------

export async function deleteStorageFolder(prefix: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  try {
    const paths = await collectFilePaths(`${userId}/${prefix}`);
    if (paths.length === 0) return;

    const BATCH_SIZE = 100;
    for (let i = 0; i < paths.length; i += BATCH_SIZE) {
      await supabase.storage.from(BUCKET).remove(paths.slice(i, i + BATCH_SIZE));
    }
  } catch (e) {
    console.warn('[storage] delete folder error:', e);
    Sentry.captureException(e, { tags: { storageOp: 'deleteStorageFolder' } });
  }
}

async function collectFilePaths(prefix: string): Promise<string[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error || !data) return [];

  const paths: string[] = [];
  for (const entry of data) {
    const entryPath = `${prefix}/${entry.name}`;
    if (entry.id === null) {
      paths.push(...(await collectFilePaths(entryPath)));
    } else {
      paths.push(entryPath);
    }
  }
  return paths;
}

// ---------------------------------------------------------------------------
// Folder-naming — round and match folders are generated once and reused for
// the lifetime of the round/match (see #67). Uses local time so folder names
// match what the user saw on-device when the round/match was created.
// ---------------------------------------------------------------------------

export function buildRoundFolder(date: Date): string {
  return `matchday-${formatFolderStamp(date)}`;
}

export function buildMatchFolder(aScore: number, bScore: number, date: Date): string {
  return `match_${aScore}-${bScore}_${formatFolderStamp(date)}`;
}

function formatFolderStamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}_${hh}${mm}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isRemoteUrl(uri: string): boolean {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

function extractStoragePath(publicUrl: string): string | null {
  // URL format: https://{project}.supabase.co/storage/v1/object/public/match-media/{path}
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

// Bypasses supabase-js storage client to avoid internal new Blob() calls
// that Hermes (iOS 26+) does not support. Uses the Supabase REST API directly
// with a native blob body — React Native's networking layer handles it natively.
async function uploadViaFetch(localUri: string, path: string, mimeType: string): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return false;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

  const arrayBuffer = await fetch(localUri).then((r) => r.arrayBuffer());

  const response = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
      'Content-Type': mimeType,
    },
    body: arrayBuffer,
  });

  if (!response.ok) {
    const text = await response.text();
    console.warn('[storage] upload failed:', text);
    Sentry.captureMessage('storage: upload failed', {
      level: 'warning',
      extra: { status: response.status, body: text.slice(0, 200) },
    });
  }
  return response.ok;
}
