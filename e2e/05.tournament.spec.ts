import { test, expect, createTeamViaUI, createPlayerViaUI } from './fixtures';

test.describe('Full tournament flow', () => {
  test('creates tournament with two pre-created players and teams @smoke', async ({ authedPage: page }) => {
    // Create two teams
    await createTeamViaUI(page, 'Liverpool', 'LIV');
    await createTeamViaUI(page, 'Arsenal', 'ARS');

    // Create two players assigned to those teams
    await createPlayerViaUI(page, 'Alice', 'LIV');
    await createPlayerViaUI(page, 'Bob', 'ARS');

    // Navigate home and start tournament setup
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByText('START NEW TOURNAMENT').click();
    await expect(page).toHaveURL(/.*setup/);

    // Fill tournament name
    await page.getByPlaceholder('e.g. FC26 · Round 10').fill('Test Cup');

    // Alice and Bob are pre-existing — click to select them from the list
    await page.getByText('Alice', { exact: true }).click();
    await page.getByText('Bob', { exact: true }).click();

    // Both selected — start
    await page.getByText('START TOURNAMENT').click();

    // Home screen shows live tournament
    await expect(page).toHaveURL('/');
    await expect(page.getByText('LIVE TOURNAMENT').last()).toBeVisible();
    await expect(page.getByText('Test Cup', { exact: true }).last()).toBeVisible();
  });
});
