import { test, expect, createTeamViaUI, createPlayerViaUI } from './fixtures';

// Settings screen renders 3 switches in a fixed order: showNick, showTeamLogo,
// then Demo Mode (verified against the live DOM — see e2e/fixtures for the pattern).
const DEMO_SWITCH_INDEX = 2;

test.describe('Demo mode', () => {
  test('toggles demo data on and off, restoring real (empty) state @smoke', async ({ authedPage: page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const demoSwitch = page.getByRole('switch').nth(DEMO_SWITCH_INDEX);
    await expect(demoSwitch).not.toBeChecked();

    // No active tournament — toggling on applies immediately, no confirmation dialog.
    await demoSwitch.click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('DEMO MODE', { exact: true })).toBeVisible();
    await expect(page.getByText('Your real data is safe', { exact: true })).toBeVisible();
    await expect(page.getByText('Premier League S2', { exact: true }).last()).toBeVisible();
    await expect(page.getByText('LIVE TOURNAMENT').last()).toBeVisible();

    // Exit via the banner button.
    await page.getByText('Exit', { exact: true }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('DEMO MODE', { exact: true })).not.toBeVisible();
    await expect(page.getByText('NO ACTIVE TOURNAMENT', { exact: true })).toBeVisible();

    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('switch').nth(DEMO_SWITCH_INDEX)).not.toBeChecked();
  });

  test('warns before replacing an active tournament, then restores it on exit', async ({ authedPage: page }) => {
    await createTeamViaUI(page, 'Liverpool', 'LIV');
    await createTeamViaUI(page, 'Arsenal', 'ARS');
    await createPlayerViaUI(page, 'Alice', 'LIV');
    await createPlayerViaUI(page, 'Bob', 'ARS');

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByText('START NEW TOURNAMENT').click();
    await page.getByPlaceholder('e.g. FC26 · Round 10').fill('Real Cup');
    await page.getByText('Alice', { exact: true }).click();
    await page.getByText('Bob', { exact: true }).click();
    await page.getByText('START TOURNAMENT').click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Real Cup', { exact: true }).last()).toBeVisible();

    // Turning demo mode on with a real tournament active must show an in-app
    // confirmation dialog (never a native Alert — Alert breaks the web file picker).
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    const demoSwitch = page.getByRole('switch').nth(DEMO_SWITCH_INDEX);
    await demoSwitch.click();
    // "DEMO MODE" also matches the settings section header above the switch —
    // the dialog title is the topmost instance (Modal content mounts last).
    await expect(page.getByText('DEMO MODE', { exact: true }).last()).toBeVisible();
    await expect(page.getByText(/temporarily replaced by demo data/)).toBeVisible();
    await expect(demoSwitch).not.toBeChecked(); // not yet enabled — awaiting confirmation

    await page.getByText('ENABLE', { exact: true }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Premier League S2', { exact: true }).last()).toBeVisible();
    await expect(page.getByText('Real Cup', { exact: true })).not.toBeVisible();

    // Exit demo mode — the real tournament must come back untouched.
    await page.getByText('Exit', { exact: true }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Real Cup', { exact: true }).last()).toBeVisible();
    await expect(page.getByText('Premier League S2', { exact: true })).not.toBeVisible();
  });
});
