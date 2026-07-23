import { test, expect, createTeamViaUI, createPlayerViaUI } from './fixtures';

test.describe('Full tournament flow', () => {
  test('creates tournament with two pre-created players and teams @smoke', async ({
    authedPage: page,
  }) => {
    // Create two teams
    await createTeamViaUI(page, 'Liverpool', 'LIV');
    await createTeamViaUI(page, 'Arsenal', 'ARS');

    // Create two players assigned to those teams
    await createPlayerViaUI(page, 'Alice', 'LIV');
    await createPlayerViaUI(page, 'Bob', 'ARS');

    // Navigate home and start tournament setup
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('start-new-tournament-button').click();
    await expect(page).toHaveURL(/.*setup/);

    // Fill tournament name
    await page.getByTestId('setup-tournament-name-input').fill('Test Cup');

    // Alice and Bob are pre-existing — click to select them from the list
    await page.getByTestId('player-row-Alice').click();
    await page.getByTestId('player-row-Bob').click();

    // Both selected — start
    await page.getByTestId('start-tournament-button').click();

    // Home screen shows live tournament
    await expect(page).toHaveURL('/');
    await expect(page.getByText('LIVE TOURNAMENT').last()).toBeVisible();
    await expect(page.getByText('Test Cup', { exact: true }).last()).toBeVisible();
  });
});
