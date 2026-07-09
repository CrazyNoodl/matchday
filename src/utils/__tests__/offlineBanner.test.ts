import { resolveOfflineBannerVariant } from '../offlineBanner';

describe('resolveOfflineBannerVariant', () => {
  it('returns null when online and sync is fine (idle or syncing)', () => {
    expect(resolveOfflineBannerVariant(true, 'idle')).toBeNull();
    expect(resolveOfflineBannerVariant(true, 'syncing')).toBeNull();
  });

  it('returns the offline copy when there is no network at all', () => {
    expect(resolveOfflineBannerVariant(false, 'idle')).toEqual({
      titleKey: 'offline.bannerTitle',
      subKey: 'offline.bannerSub',
    });
  });

  it('returns the offline copy (not the sync-error copy) when offline and also erroring', () => {
    // Being offline is the more actionable/understandable state to report —
    // a push failing while there's no network isn't a distinct problem.
    expect(resolveOfflineBannerVariant(false, 'error')).toEqual({
      titleKey: 'offline.bannerTitle',
      subKey: 'offline.bannerSub',
    });
  });

  it('returns the distinct sync-error copy when online but the server push/pull is failing', () => {
    expect(resolveOfflineBannerVariant(true, 'error')).toEqual({
      titleKey: 'offline.syncErrorTitle',
      subKey: 'offline.syncErrorSub',
    });
  });
});
