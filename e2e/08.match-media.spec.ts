import path from 'path';
import { test, expect, createTeamViaUI, createPlayerViaUI, addMatchViaUI } from './fixtures';

// Supabase is disabled in the e2e web server (see playwright.config.ts), so uploads
// fail and media items stay in `pendingUpload` state — that's fine here since this
// test only covers the UI flow (picker -> thumbnail -> delete), not the actual upload.
const FIXTURE_IMAGE = path.join(__dirname, '..', 'assets', 'favicon.png');

test.describe('Match media', () => {
  test('adds a photo to a match, sees the thumbnail, then deletes it', async ({ authedPage: page }) => {
    await createTeamViaUI(page, 'Liverpool', 'LIV');
    await createTeamViaUI(page, 'Arsenal', 'ARS');
    await createPlayerViaUI(page, 'Alice', 'LIV');
    await createPlayerViaUI(page, 'Bob', 'ARS');

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByText('START NEW TOURNAMENT').click();
    await page.getByPlaceholder('e.g. FC26 · Round 10').fill('Media Cup');
    await page.getByText('Alice', { exact: true }).click();
    await page.getByText('Bob', { exact: true }).click();
    await page.getByText('START TOURNAMENT').click();

    // expo-router keeps the pre-tournament Home + Setup screens mounted
    // underneath this one (see the note in e2e/fixtures.ts) — reload to get
    // a single clean Home instance before driving the rest of the flow.
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByText('NEW MATCH DAY', { exact: true }).click();
    await page.getByText('START ROUND', { exact: true }).click();
    await expect(page).toHaveURL(/.*round/);

    await addMatchViaUI(page, 'Alice', 'Bob', 2, 0);

    // Open the match detail screen for the match we just created. Navigating
    // there by clicking the MatchCard is unreliable: "Alice" also appears in
    // the standings table and in a stale-but-still-mounted AddMatchSheet (see
    // the note in e2e/fixtures.ts), so read the match id straight from the
    // persisted store instead of guessing which "Alice" node is the card.
    const matchId = await page.evaluate(() => {
      const raw = localStorage.getItem('matchday-store');
      return raw ? JSON.parse(raw).state.matches[0]?.id : null;
    });
    expect(matchId).toBeTruthy();
    await page.goto(`/match/${matchId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Tap to add media', { exact: true })).toBeVisible();

    // Add a photo — expo-image-picker on web opens a real <input type=file>.
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('+ Add', { exact: true }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(FIXTURE_IMAGE);

    // Thumbnail appears.
    await expect(page.locator('img[src^="blob:"]').first()).toBeVisible();
    await expect(page.getByText('Tap to add media', { exact: true })).not.toBeVisible();

    // Delete it.
    await page.getByText('×', { exact: true }).click();
    await expect(page.getByText('Tap to add media', { exact: true })).toBeVisible();
    await expect(page.locator('img[src^="blob:"]')).toHaveCount(0);
  });
});
