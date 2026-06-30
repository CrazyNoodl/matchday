import { test, expect } from './fixtures';

test.describe('Teams screen', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto('/settings/teams');
    await page.waitForLoadState('networkidle');
  });

  test('shows empty state when no teams', async ({ authedPage: page }) => {
    await expect(page.getByText('TEAMS').last()).toBeVisible();
    await expect(page.getByText('No teams yet. Create a team to assign players.')).toBeVisible();
  });

  test('opens create form on "+ ADD"', async ({ authedPage: page }) => {
    await page.getByText('+ ADD').click();
    await expect(page.getByText('NEW TEAM')).toBeVisible();
    await expect(page.getByPlaceholder('e.g. Manchester City')).toBeVisible();
    await expect(page.getByPlaceholder('e.g. MCI')).toBeVisible();
  });

  test('creates a team and shows it in the list @smoke', async ({ authedPage: page }) => {
    await page.getByText('+ ADD').click();
    await expect(page.getByText('NEW TEAM')).toBeVisible();

    await page.getByPlaceholder('e.g. Manchester City').fill('Liverpool');
    await page.getByPlaceholder('e.g. MCI').fill('LIV');
    await page.getByText('ADD TEAM', { exact: true }).click();

    await expect(page.getByText('Liverpool', { exact: true })).toBeVisible();
    await expect(page.getByText('LIV', { exact: true }).last()).toBeVisible();
  });

  test('ADD TEAM is disabled without required fields', async ({ authedPage: page }) => {
    await page.getByText('+ ADD').click();
    await expect(page.getByText('NEW TEAM')).toBeVisible();

    // Only name filled — short code missing
    await page.getByPlaceholder('e.g. Manchester City').fill('Liverpool');
    const saveBtn = page.getByText('ADD TEAM', { exact: true });
    await saveBtn.click({ force: true });

    // Sheet should still be open (save didn't happen)
    await expect(page.getByText('NEW TEAM')).toBeVisible();
  });
});
