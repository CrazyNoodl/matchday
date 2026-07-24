import {
  test,
  expect,
  createTeamViaUI,
  createPlayerViaUI,
  addMatchViaUI,
  startTournamentViaUI,
  startMatchDayViaUI,
} from './fixtures';

// Covers /stats, /rivalry/[a]/[b], /season-stats, /archive-day and
// /matchday-stats — none of which had any e2e coverage before this file.
// One shared setup (finish a round, close the tournament) feeds all five
// screens with real data instead of re-running the whole game loop per test.
test.describe('Stats, archive and rivalry screens', () => {
  test('season stats, rivalry and per-day stats render real data after a closed tournament', async ({
    authedPage: page,
  }) => {
    await createTeamViaUI(page, 'Liverpool', 'LIV');
    await createTeamViaUI(page, 'Arsenal', 'ARS');
    await createPlayerViaUI(page, 'Alice', 'LIV');
    await createPlayerViaUI(page, 'Bob', 'ARS');

    await startTournamentViaUI(page, 'Coverage Cup', ['Alice', 'Bob']);
    await startMatchDayViaUI(page);
    await addMatchViaUI(page, 'Alice', 'Bob', 2, 1);

    // Equal games (both played once) — finish straight away and crown Alice.
    await page.getByText('···', { exact: true }).last().click();
    await page.getByText('FINISH', { exact: true }).last().click();
    await expect(page.getByText('FINISH ROUND?', { exact: true })).toBeVisible();
    await page.getByText('Crown winner', { exact: true }).last().click();
    await expect(page.getByText('MATCH DAY WINNER', { exact: true })).toBeVisible();
    await page.getByText('DONE', { exact: true }).last().click();
    await expect(page).toHaveURL(/.*tournament/);

    await page.getByText('···', { exact: true }).last().click();
    await page.getByText('Close & archive', { exact: true }).last().click();
    await expect(page.getByText('CLOSE TOURNAMENT?', { exact: true })).toBeVisible();
    await page.getByText('Archive', { exact: true }).last().click();
    await expect(page).toHaveURL('/');

    // ---- /stats: Ranking tab shows both players, H2H tab shows the pair ----
    await page.goto('/stats');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Alice', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Bob', { exact: true }).first()).toBeVisible();

    await page.getByText('Head-to-head', { exact: true }).click();
    const h2hRow = page.getByText('Alice', { exact: true }).first();
    await expect(h2hRow).toBeVisible();

    // ---- long-press the H2H row -> /rivalry/[a]/[b] with real records ----
    // expo-router's Stack keeps every earlier screen mounted underneath the
    // active one (see fixtures.ts) — `.last()` lands on the topmost screen.
    await h2hRow.click({ delay: 3200 });
    await expect(page).toHaveURL(/.*rivalry\/.+\/.+/);
    await expect(page.getByText('RIVALRY', { exact: true }).last()).toBeVisible();
    await expect(page.getByText('Alice', { exact: true }).last()).toBeVisible();
    await expect(page.getByText('Bob', { exact: true }).last()).toBeVisible();

    // ---- /archive: expand the tournament, open its season stats ----
    await page.goto('/archive');
    await page.waitForLoadState('networkidle');
    await page.getByText('Coverage Cup', { exact: true }).click();
    await page.getByText('STATS & RANKINGS', { exact: true }).click();
    await expect(page).toHaveURL(/.*season-stats/);
    await expect(page.getByText('Coverage Cup', { exact: true }).last()).toBeVisible();
    await expect(page.getByText('Alice', { exact: true }).last()).toBeVisible();

    // ---- /archive: expand again, open the single round -> /archive-day ----
    await page.goto('/archive');
    await page.waitForLoadState('networkidle');
    await page.getByText('Coverage Cup', { exact: true }).click();
    await page.getByText('1 matches', { exact: true }).click();
    await expect(page).toHaveURL(/.*archive-day/);
    await expect(
      page.getByText('ALL MATCHES · TAP FOR STATS', { exact: true }).last(),
    ).toBeVisible();
    await expect(page.getByText('Alice', { exact: true }).last()).toBeVisible();
    await expect(page.getByText('Bob', { exact: true }).last()).toBeVisible();

    // ---- archive-day "···" menu -> Stats -> /matchday-stats ----
    await page.getByText('···', { exact: true }).last().click();
    await page.getByText('STATS', { exact: true }).last().click();
    await expect(page).toHaveURL(/.*matchday-stats/);
    await expect(page.getByText('MATCH DAY STATS', { exact: true }).last()).toBeVisible();
  });
});
