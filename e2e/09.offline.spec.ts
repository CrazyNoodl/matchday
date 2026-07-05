import { test, expect } from './fixtures';

test.describe('Offline handling', () => {
  test('shows the offline banner without blocking the app, and clears it when back online @smoke', async ({ authedPage: page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('NO INTERNET CONNECTION')).not.toBeVisible();

    await page.context().setOffline(true);
    await expect(page.getByText('NO INTERNET CONNECTION')).toBeVisible();

    // Regression check: the banner must never intercept taps on the UI beneath it
    // (previously position:absolute + no pointerEvents="none" swallowed clicks on
    // bottom-anchored buttons like "START TOURNAMENT").
    await page.getByText('START NEW TOURNAMENT').click();
    await expect(page).toHaveURL(/.*setup/);

    await page.context().setOffline(false);
    await expect(page.getByText('NO INTERNET CONNECTION')).not.toBeVisible();
  });
});
