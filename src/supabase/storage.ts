import { supabase } from './client';
import { getCurrentUserId } from './auth';
import type { MediaItem } from '../store/types';

const BUCKET = 'match-media';

// ---------------------------------------------------------------------------
// Upload a single media file, return public URL or null on failure
// ---------------------------------------------------------------------------

export async function uploadMediaItem(
  localUri: string,
  type: 'image' | 'video',
): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  try {
    const blob = await uriToBlob(localUri);
    const ext = type === 'video' ? 'mp4' : 'jpg';
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const mimeType = type === 'video' ? 'video/mp4' : 'image/jpeg';

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: mimeType, upsert: false });

    if (error) {
      console.warn('[storage] upload failed:', error.message);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? null;
  } catch (e) {
    console.warn('[storage] upload error:', e);
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
    const blob = await uriToBlob(localUri);
    const path = `${userId}/team-logos/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: 'image/jpeg', upsert: false });

    if (error) {
      console.warn('[storage] team logo upload failed:', error.message);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? null;
  } catch (e) {
    console.warn('[storage] team logo upload error:', e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Upload multiple items, return MediaItem[] with remote URLs
// Items that fail upload are kept with their local URI as fallback
// ---------------------------------------------------------------------------

export async function uploadMediaItems(items: MediaItem[]): Promise<MediaItem[]> {
  return Promise.all(
    items.map(async (item) => {
      if (isRemoteUrl(item.uri)) return item; // already uploaded
      const remoteUrl = await uploadMediaItem(item.uri, item.type);
      return { ...item, uri: remoteUrl ?? item.uri };
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
  }
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

async function uriToBlob(uri: string): Promise<Blob> {
  // Works on web (fetch) and React Native (fetch also works for local file URIs)
  const response = await fetch(uri);
  return response.blob();
}
