import {
  test,
  expect,
  createTeamViaUI,
  createPlayerViaUI,
  addMatchViaUI,
  startTournamentViaUI,
  startMatchDayViaUI,
} from './fixtures';
import type { Page } from '@playwright/test';

// Shared setup: one match (Alice 2-0 Bob) in an open round, landing on its
// match detail screen. Returns the match id (read from the store, same
// approach as e2e/08.match-media.spec.ts — clicking the MatchCard itself is
// unreliable because of stale mounted screens, see e2e/fixtures.ts).
async function setupMatchDetail(page: Page): Promise<string> {
  await createTeamViaUI(page, 'Liverpool', 'LIV');
  await createTeamViaUI(page, 'Arsenal', 'ARS');
  await createPlayerViaUI(page, 'Alice', 'LIV');
  await createPlayerViaUI(page, 'Bob', 'ARS');

  await startTournamentViaUI(page, 'Match Detail Cup', ['Alice', 'Bob']);
  await startMatchDayViaUI(page);

  await addMatchViaUI(page, 'Alice', 'Bob', 2, 0);

  const matchId = await page.evaluate(() => {
    const raw = localStorage.getItem('matchday-store');
    return raw ? JSON.parse(raw).state.matches[0]?.id : null;
  });
  expect(matchId).toBeTruthy();
  await page.goto(`/match/${matchId}`);
  await page.waitForLoadState('networkidle');
  return matchId as string;
}

test.describe('Match detail screen', () => {
  test('edits the score from the header Edit button, flipping the winner @smoke', async ({
    authedPage: page,
  }) => {
    await setupMatchDetail(page);
    await expect(page.getByText('Alice won', { exact: true })).toBeVisible();

    // Two "Edit" texts exist on this screen: the header score-edit button
    // (rendered first, in NavHeader) and the commentary section's edit link
    // (rendered last, further down the scroll content) — see MatchModals.tsx.
    await page.getByText('Edit', { exact: true }).first().click();
    await expect(page.getByText('EDIT SCORE', { exact: true })).toBeVisible();

    // Two stepper pairs live in this sheet, home (Alice) first then away
    // (Bob) — see the scoreEditRow JSX in MatchModals.tsx.
    const minus = page.getByText('−', { exact: true });
    const plus = page.getByText('+', { exact: true });
    await minus.nth(0).click(); // Alice 2 -> 1
    await minus.nth(0).click(); // Alice 1 -> 0
    await plus.nth(1).click(); // Bob 0 -> 1

    await page.getByText('Save', { exact: true }).last().click();
    await expect(page.getByText('Bob won', { exact: true })).toBeVisible();
  });

  test('adds commentary via the commentary section Edit link', async ({ authedPage: page }) => {
    const matchId = await setupMatchDetail(page);
    await expect(page.getByText('Add commentary...', { exact: true })).toBeVisible();

    await page.getByText('Edit', { exact: true }).last().click();
    // "COMMENTARY" appears twice once the sheet is open: the section label
    // behind it, and the sheet's own header title — the header is the last
    // of the two in DOM order.
    await expect(page.getByText('COMMENTARY', { exact: true }).last()).toBeVisible();
    await page.getByTestId('match-edit-note-input').fill('Alice dominated the midfield.');
    await page.getByText('Save', { exact: true }).last().click();

    // The sheet's own textarea keeps the same value mounted behind it, so
    // scope to the rendered note card (the first match) rather than the
    // sheet's now-hidden text input.
    await expect(
      page.getByText('Alice dominated the midfield.', { exact: true }).first(),
    ).toBeVisible();

    const updated = await page.evaluate((id) => {
      const raw = localStorage.getItem('matchday-store');
      const state = raw ? JSON.parse(raw).state : null;
      return state?.matches.find((m: { id: string }) => m.id === id);
    }, matchId);
    expect(updated?.note).toBe('Alice dominated the midfield.');
  });

  test('deletes the match from the current round via the header trash button @smoke', async ({
    authedPage: page,
  }) => {
    await setupMatchDetail(page);

    await page.getByText('🗑', { exact: true }).click();
    await expect(page.getByText('DELETE MATCH?', { exact: true })).toBeVisible();
    await page.getByText('Delete', { exact: true }).last().click();

    await expect(page).toHaveURL(/.*round/);
    await expect(page.getByText('MATCHES · 0', { exact: true })).toBeVisible();
  });
});
