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
    await page.getByTestId('teams-add-button').click();
    await expect(page.getByText('NEW TEAM')).toBeVisible();
    await expect(page.getByTestId('team-edit-name-input')).toBeVisible();
    await expect(page.getByTestId('team-edit-short-input')).toBeVisible();
  });

  test('ADD TEAM is disabled without required fields', async ({ authedPage: page }) => {
    await page.getByTestId('teams-add-button').click();
    await expect(page.getByText('NEW TEAM')).toBeVisible();

    // Only name filled — short code missing
    await page.getByTestId('team-edit-name-input').fill('Liverpool');
    const saveBtn = page.getByTestId('team-edit-save-button');
    await saveBtn.click({ force: true });

    // Sheet should still be open (save didn't happen)
    await expect(page.getByText('NEW TEAM')).toBeVisible();
  });

  test('creates a team and shows it in the list @smoke', async ({ authedPage: page }) => {
    await page.getByTestId('teams-add-button').click();
    await expect(page.getByText('NEW TEAM')).toBeVisible();

    await page.getByTestId('team-edit-name-input').fill('Liverpool');
    await page.getByTestId('team-edit-short-input').fill('LIV');
    await page.getByTestId('team-edit-save-button').click();

    await expect(page.getByText('Liverpool', { exact: true })).toBeVisible();
    await expect(page.getByText('LIV', { exact: true }).last()).toBeVisible();
  });
});
