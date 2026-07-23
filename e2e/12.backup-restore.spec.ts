import path from 'path';
import { test, expect, createTeamViaUI, createPlayerViaUI } from './fixtures';

// Local JSON backup (app/settings/(data)/backup.tsx) is the second, fully
// independent safety net alongside Supabase sync — it exists specifically
// because of the 2026-07-06 sync data-loss incident (see docs/CONTEXT.md).
// e2e/fixtures.ts blocks all network calls to the real Supabase project, so
// the post-restore cloud push always fails here regardless of whether
// supabaseConfigured is true or false in this build — the status banner
// therefore reads either "Backup restored locally." (unconfigured) or
// "Backup restored locally, but syncing to the cloud failed." (configured,
// push blocked). Both are asserted via a shared regex; what actually matters
// — the local restore applying the right data — is checked afterwards via
// the teams/players screens. The push itself is covered separately by
// src/supabase/__tests__/sync.test.ts.
const BACKUP_FIXTURE = path.join(__dirname, 'test-data', 'backup-sample.json');
const RESTORED_LOCALLY = /^Backup restored locally\.?/;

test.describe('Backup & Restore', () => {
  test('creates a backup, changes data, then restores it from the on-device list @smoke', async ({
    authedPage: page,
  }) => {
    await createTeamViaUI(page, 'Liverpool', 'LIV');
    await createPlayerViaUI(page, 'Alice', 'LIV');

    await page.goto('/settings/backup');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('No backups yet.', { exact: true })).toBeVisible();

    await page.getByTestId('create-backup-button').click();
    await expect(page.getByText('Backup created.', { exact: true })).toBeVisible();
    await expect(page.getByText('No backups yet.', { exact: true })).not.toBeVisible();

    // Change data after the backup was taken.
    await createTeamViaUI(page, 'Arsenal', 'ARS');

    await page.goto('/settings/backup');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('backup-restore-button-0').click();
    await expect(page.getByText('REPLACE ALL LOCAL DATA?', { exact: true })).toBeVisible();
    await page.getByTestId('backup-replace-confirm-button').click();

    await expect(page.getByText(RESTORED_LOCALLY)).toBeVisible();

    await page.goto('/settings/teams');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Liverpool', { exact: true })).toBeVisible();
    await expect(page.getByText('Arsenal', { exact: true })).not.toBeVisible();
  });

  test('imports a backup file, replacing current data @smoke', async ({ authedPage: page }) => {
    await createTeamViaUI(page, 'Liverpool', 'LIV');

    await page.goto('/settings/backup');
    await page.waitForLoadState('networkidle');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('import-from-file-button').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(BACKUP_FIXTURE);

    await expect(page.getByText('REPLACE ALL LOCAL DATA?', { exact: true })).toBeVisible();
    await page.getByTestId('backup-replace-confirm-button').click();
    await expect(page.getByText(RESTORED_LOCALLY)).toBeVisible();

    await page.goto('/settings/teams');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Zenith', { exact: true })).toBeVisible();
    await expect(page.getByText('Liverpool', { exact: true })).not.toBeVisible();

    await page.goto('/settings/players');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Zed', { exact: true })).toBeVisible();
  });
});
