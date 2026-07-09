type SyncStatus = 'idle' | 'syncing' | 'error';

export interface OfflineBannerVariant {
  titleKey: string;
  subKey: string;
}

// No network at all, vs. reachable network but the server push/pull itself
// is failing (auth issue, RLS, etc) — two distinct problems that look the
// same to a user unless called out with different copy (#73).
export function resolveOfflineBannerVariant(
  isOnline: boolean,
  syncStatus: SyncStatus,
): OfflineBannerVariant | null {
  if (isOnline && syncStatus !== 'error') return null;
  return isOnline
    ? { titleKey: 'offline.syncErrorTitle', subKey: 'offline.syncErrorSub' }
    : { titleKey: 'offline.bannerTitle', subKey: 'offline.bannerSub' };
}
