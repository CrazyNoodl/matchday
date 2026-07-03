import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Regular match media (no OCR involved) — plenty for MediaSlider and share images.
export const MEDIA_MAX_DIMENSION = 2000;
// Base64 payload sent to the OCR/AI provider — light downscale, stays legible for text extraction.
export const OCR_PAYLOAD_MAX_DIMENSION = 2000;
// Persisted copy of a photo that went through the OCR flow — nobody zooms into a stat
// screenshot in the match gallery, so this can be compressed much harder than OCR_PAYLOAD_MAX_DIMENSION.
export const STAT_PHOTO_STORAGE_MAX_DIMENSION = 1200;
// Team logo — displayed only as a small badge (TeamBadge imageXs/md/lg).
export const TEAM_LOGO_MAX_DIMENSION = 600;

export interface ResizedImage {
  uri: string;
  base64?: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

interface ResizeImageOptions {
  compress?: number;
  base64?: boolean;
}

// Resizes `uri` so its longest edge is at most `maxDimension`, preserving aspect ratio.
// No-ops (returns the original uri untouched) if the source is already within the cap —
// callers should fall back to whatever base64 the picker already produced in that case.
export async function resizeImage(
  uri: string,
  { width, height }: ImageDimensions,
  maxDimension: number,
  { compress = 0.85, base64 = false }: ResizeImageOptions = {},
): Promise<ResizedImage> {
  if (Math.max(width, height) <= maxDimension) {
    return { uri };
  }

  const resizeAction = width >= height ? { width: maxDimension } : { height: maxDimension };
  const image = await ImageManipulator.manipulate(uri).resize(resizeAction).renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress, base64 });
  return { uri: result.uri, base64: result.base64 };
}
