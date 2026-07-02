import { test, expect } from './fixtures';

test.describe('Home screen', () => {
  test('shows MATCHDAY logo and empty state when no tournament', async ({ authedPage: page }) => {
    await expect(page.getByText('MATCHDAY')).toBeVisible();
    await expect(page.getByText('NO ACTIVE TOURNAMENT')).toBeVisible();
    await expect(page.getByText('START NEW TOURNAMENT')).toBeVisible();
  });

  test('NEW MATCH DAY button is disabled when no tournament', async ({ authedPage: page }) => {
    const btn = page.getByText('NEW MATCH DAY');
    await expect(btn).toBeVisible();

    // Clicking disabled button should not navigate away
    await btn.click({ force: true });
    await expect(page).toHaveURL('/');
  });

  test('navigates to setup screen on "START NEW TOURNAMENT" @smoke', async ({ authedPage: page }) => {
    await page.getByText('START NEW TOURNAMENT').click();
    await expect(page).toHaveURL(/.*setup/);
  });
});
