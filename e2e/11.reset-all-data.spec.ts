import { test, expect, createTeamViaUI, createPlayerViaUI } from './fixtures';

// "Reset All Data" (app/settings/index.tsx -> DangerZoneCard, dialog in
// SettingsDialogs.tsx) is the most destructive action in the app: it wipes
// every local table and calls deleteAllCloudData() before doing so. Given the
// 2026-07-06 sync data-loss incident, its guardrails — a 5s countdown before
// the confirm button is even tappable, and the "Backup My Data First"
// shortcut — are exactly the behavior that must not regress.

test.describe('Reset All Data', () => {
  test('confirm button is disabled during the 5s cooldown and does nothing if clicked', async ({
    authedPage: page,
  }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('reset-all-data-button').click();
    await expect(page.getByText('Reset All Data? (5)', { exact: true })).toBeVisible();

    // Confirm is disabled while the countdown is running — clicking it must
    // not trigger the reset (RN's TouchableOpacity `disabled` guards onPress).
    await page.getByTestId('reset-confirm-button').click();
    await expect(page).toHaveURL(/.*settings/);
    await expect(page.getByText(/Reset All Data\? \(\d\)/)).toBeVisible();
  });

  test('is disabled while Demo Mode is on, since it would wipe the real cloud account', async ({
    authedPage: page,
  }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    await page.getByRole('switch').first().click();
    await expect(page).toHaveURL('/');

    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Turn off Demo Mode to reset your data.')).toBeVisible();

    // Disabled TouchableOpacity must not open the confirm dialog.
    await page.getByTestId('reset-all-data-button').click();
    await expect(page.getByText(/Reset All Data\? \(\d\)/)).not.toBeVisible();
    await expect(page).toHaveURL(/.*settings/);
  });

  test('is disabled while offline, since the cloud wipe would silently fail to reach it', async ({
    authedPage: page,
  }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    await page.context().setOffline(true);
    await expect(page.getByText('You need to be online to reset your data.')).toBeVisible();

    // Disabled TouchableOpacity must not open the confirm dialog.
    await page.getByTestId('reset-all-data-button').click();
    await expect(page.getByText(/Reset All Data\? \(\d\)/)).not.toBeVisible();
    await expect(page).toHaveURL(/.*settings/);

    await page.context().setOffline(false);
    await expect(page.getByText('This will permanently delete')).toBeVisible();
  });

  test('"Backup My Data First" closes the dialog and navigates to Backup & Restore', async ({
    authedPage: page,
  }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('reset-all-data-button').click();
    await expect(page.getByText(/Reset All Data\? \(\d\)/)).toBeVisible();

    await page.getByTestId('reset-backup-first-button').click();
    await expect(page).toHaveURL(/.*backup/);
    await expect(page.getByText('Backup & Restore', { exact: true }).last()).toBeVisible();
    await expect(page.getByText(/Reset All Data\? \(\d\)/)).not.toBeVisible();
  });

  test('confirming after the cooldown wipes local tournament data and returns home', async ({
    authedPage: page,
  }) => {
    await createTeamViaUI(page, 'Liverpool', 'LIV');
    await createPlayerViaUI(page, 'Alice', 'LIV');

    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('reset-all-data-button').click();
    await expect(page.getByText('Reset All Data? (5)', { exact: true })).toBeVisible();

    // Let the 5s cooldown fully elapse.
    await expect(page.getByText('Reset All Data?', { exact: true })).toBeVisible({ timeout: 7000 });

    await page.getByTestId('reset-confirm-button').click();
    await expect(page).toHaveURL('/');

    const state = await page.evaluate(() => {
      const raw = localStorage.getItem('matchday-store');
      return raw ? JSON.parse(raw).state : null;
    });
    expect(state.teams).toEqual([]);
    expect(state.players).toEqual([]);
    expect(state.hasTournament).toBe(false);

    await page.goto('/settings/teams');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Liverpool', { exact: true })).not.toBeVisible();
  });
});
