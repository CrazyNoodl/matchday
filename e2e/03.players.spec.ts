import { test, expect, createTeamViaUI } from './fixtures';

test.describe('Players screen', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto('/settings/players');
    await page.waitForLoadState('networkidle');
  });

  test('shows empty state when no players', async ({ authedPage: page }) => {
    await expect(page.getByText('PLAYERS').last()).toBeVisible();
    await expect(page.getByText('No players yet.', { exact: false })).toBeVisible();
  });

  test('creates a player assigned to a team @smoke', async ({ authedPage: page }) => {
    // Prerequisite: create Liverpool team first
    await createTeamViaUI(page, 'Liverpool', 'LIV');

    // Go to players screen
    await page.goto('/settings/players');
    await page.waitForLoadState('networkidle');

    // Open create form
    await page.getByTestId('players-add-button').click();

    // Wait for the form inputs to be ready (not just the header)
    await expect(page.getByTestId('player-edit-name-input')).toBeVisible();

    // Fill name
    await page.getByTestId('player-edit-name-input').fill('Alice');

    // Wait for the team picker to show LIV (store may hydrate async after page reload)
    const teamChip = page.getByTestId('team-picker-item-LIV');
    await expect(teamChip).toBeVisible({ timeout: 15_000 });

    // Select Liverpool team from the team picker
    await teamChip.click();

    // Save
    await page.getByTestId('player-edit-save-button').click();

    // Alice appears in the list
    await expect(page.getByText('Alice', { exact: true }).last()).toBeVisible();
  });
});
