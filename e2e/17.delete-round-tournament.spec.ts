import {
  test,
  expect,
  createTeamViaUI,
  createPlayerViaUI,
  addMatchViaUI,
  startTournamentViaUI,
  startMatchDayViaUI,
} from './fixtures';

// Delete Round and Delete Tournament are destructive, previously untested
// flows. Delete Tournament also covers #86 (closing a tournament with zero
// recorded matches deletes it outright instead of offering to archive it).

test.describe('Delete round', () => {
  test('deletes an archived round of a still-open tournament', async ({ authedPage: page }) => {
    await createTeamViaUI(page, 'Liverpool', 'LIV');
    await createTeamViaUI(page, 'Arsenal', 'ARS');
    await createPlayerViaUI(page, 'Alice', 'LIV');
    await createPlayerViaUI(page, 'Bob', 'ARS');
    await startTournamentViaUI(page, 'Round Delete Cup', ['Alice', 'Bob']);
    await startMatchDayViaUI(page);
    await addMatchViaUI(page, 'Alice', 'Bob', 1, 0);

    // Equal games (both played once) — finish and crown Alice, tournament stays open.
    await page.getByText('···', { exact: true }).last().click();
    await page.getByText('Finish', { exact: true }).last().click();
    await expect(page.getByText('FINISH ROUND?', { exact: true })).toBeVisible();
    await page.getByText('Crown winner', { exact: true }).last().click();
    await expect(page.getByText('MATCH DAY WINNER', { exact: true })).toBeVisible();
    await page.getByText('DONE', { exact: true }).last().click();
    await expect(page).toHaveURL(/.*tournament/);

    await expect(page.getByText('1 matches', { exact: true })).toBeVisible();
    await page.getByText('1 matches', { exact: true }).click();
    await expect(page).toHaveURL(/.*archive-day/);

    await page.getByText('···', { exact: true }).last().click();
    await page.getByText('Delete Round', { exact: true }).last().click();
    await expect(page.getByText('DELETE ROUND?', { exact: true })).toBeVisible();
    await page.getByText('Delete Round', { exact: true }).last().click();

    await expect(page).toHaveURL(/.*tournament/);
    await expect(page.getByText('1 matches', { exact: true })).not.toBeVisible();
  });
});

test.describe('Delete tournament', () => {
  test('closing a tournament with zero recorded matches deletes it instead of archiving (#86)', async ({
    authedPage: page,
  }) => {
    await createTeamViaUI(page, 'Liverpool', 'LIV');
    await createTeamViaUI(page, 'Arsenal', 'ARS');
    await createPlayerViaUI(page, 'Alice', 'LIV');
    await createPlayerViaUI(page, 'Bob', 'ARS');
    await startTournamentViaUI(page, 'Empty Cup', ['Alice', 'Bob']);

    await page.goto('/settings/tournaments');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Empty Cup', { exact: true })).toBeVisible();

    await page.getByText('Close & archive', { exact: true }).click();
    await expect(page.getByText('DELETE TOURNAMENT?', { exact: true })).toBeVisible();
    await page.getByText('Delete', { exact: true }).last().click();

    await expect(page).toHaveURL('/');
    await expect(page.getByText('NO ACTIVE TOURNAMENT')).toBeVisible();
    await expect(page.getByTestId('start-new-tournament-button')).toBeVisible();
  });
});
