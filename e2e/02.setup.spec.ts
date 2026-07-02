import { test, expect } from './fixtures';

test.describe('Create tournament', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.getByText('START NEW TOURNAMENT').click();
    await expect(page).toHaveURL(/.*setup/);
  });

  test('START TOURNAMENT is disabled without name and players', async ({ authedPage: page }) => {
    const btn = page.getByText('START TOURNAMENT');
    await expect(btn).toBeVisible();

    // Disabled — clicking should not navigate
    await btn.click({ force: true });
    await expect(page).toHaveURL(/.*setup/);
  });

  test('can add a player via the modal', async ({ authedPage: page }) => {
    await page.getByText('Add Player', { exact: true }).click();
    await expect(page.getByText('NEW PLAYER')).toBeVisible();

    await page.getByPlaceholder('Player name').fill('Alice');
    await page.getByText('ADD PLAYER', { exact: true }).click();

    // Modal closed and player appears in list
    await expect(page.getByText('NEW PLAYER')).not.toBeVisible();
    await expect(page.getByText('Alice')).toBeVisible();
  });

  test('creates tournament and returns to home screen @smoke', async ({ authedPage: page }) => {
    // Fill tournament name
    await page.getByPlaceholder('e.g. FC26 · Round 10').fill('Test Cup');

    // Add Alice — wait for her name in the list to confirm modal is fully gone
    await page.getByText('Add Player', { exact: true }).click();
    await expect(page.getByText('NEW PLAYER')).toBeVisible();
    await page.getByPlaceholder('Player name').fill('Alice');
    await page.getByText('ADD PLAYER', { exact: true }).click();
    await expect(page.getByText('Alice', { exact: true })).toBeVisible();

    // Add Bob — same pattern
    await page.getByText('Add Player', { exact: true }).click();
    await expect(page.getByText('NEW PLAYER')).toBeVisible();
    await page.getByPlaceholder('Player name').fill('Bob');
    await page.getByText('ADD PLAYER', { exact: true }).click();
    await expect(page.getByText('Bob', { exact: true })).toBeVisible();

    // Select both players
    await page.getByText('Alice', { exact: true }).click();
    await page.getByText('Bob', { exact: true }).click();

    // Start
    await page.getByText('START TOURNAMENT').click();

    // Back on home with live tournament card visible.
    // expo-router keeps all stack screens in DOM — use .last() to target the foreground screen.
    await expect(page).toHaveURL('/');
    await expect(page.getByText('LIVE TOURNAMENT').last()).toBeVisible();
    await expect(page.getByText('Test Cup', { exact: true }).last()).toBeVisible();

  });
});
