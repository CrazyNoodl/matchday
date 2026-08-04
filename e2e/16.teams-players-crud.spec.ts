import {
  test,
  expect,
  createTeamViaUI,
  createPlayerViaUI,
  addMatchViaUI,
  startTournamentViaUI,
  startMatchDayViaUI,
} from './fixtures';

// Edit/Delete for Teams and Players had zero e2e coverage before this file —
// 02.teams.spec.ts / 03.players.spec.ts only ever exercised create.

test.describe('Teams — edit and delete', () => {
  test('edits a team and deletes it once no match uses it', async ({ authedPage: page }) => {
    await createTeamViaUI(page, 'Liverpool', 'LIV');

    await page.getByTestId('team-edit-button-Liverpool').click();
    await expect(page.getByText('EDIT TEAM', { exact: true })).toBeVisible();
    await page.getByTestId('team-edit-name-input').fill('Liverpool FC');
    await page.getByTestId('team-edit-short-input').fill('LFC');
    await page.getByTestId('team-edit-save-button').click();
    await expect(page.getByText('Liverpool FC', { exact: true })).toBeVisible();
    await expect(page.getByText('Liverpool', { exact: true })).not.toBeVisible();

    // Renamed to "Liverpool FC" above, so the row's testID is now keyed by
    // the new name.
    await page.getByTestId('team-delete-button-Liverpool FC').click();
    await expect(page.getByText('DELETE TEAM?', { exact: true })).toBeVisible();
    await page.getByTestId('delete-guard-confirm-button').click();
    await expect(page.getByText('Liverpool FC', { exact: true })).not.toBeVisible();
    await expect(page.getByText('No teams yet. Create a team to assign players.')).toBeVisible();
  });

  test('cannot delete a team that has a recorded match', async ({ authedPage: page }) => {
    await createTeamViaUI(page, 'Liverpool', 'LIV');
    await createTeamViaUI(page, 'Arsenal', 'ARS');
    await createPlayerViaUI(page, 'Alice', 'LIV');
    await createPlayerViaUI(page, 'Bob', 'ARS');
    await startTournamentViaUI(page, 'CRUD Cup', ['Alice', 'Bob']);
    await startMatchDayViaUI(page);
    await addMatchViaUI(page, 'Alice', 'Bob', 1, 0);

    await page.goto('/settings/teams');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('team-delete-button-Arsenal').click();
    await expect(page.getByText('CANNOT DELETE', { exact: true })).toBeVisible();
    await expect(page.getByText('Cannot delete — team is in use.', { exact: true })).toBeVisible();
    await page.getByTestId('delete-guard-cannot-delete-ok-button').click();
    await expect(page.getByText('Arsenal', { exact: true })).toBeVisible();
  });
});

test.describe('Players — edit and delete', () => {
  test('edits a player and deletes it once no match uses it', async ({ authedPage: page }) => {
    await createTeamViaUI(page, 'Liverpool', 'LIV');
    await createPlayerViaUI(page, 'Alice', 'LIV');

    await page.getByTestId('player-edit-button-Alice').click();
    await expect(page.getByText('EDIT PLAYER', { exact: true })).toBeVisible();
    await page.getByTestId('player-edit-name-input').fill('Alicia');
    await page.getByTestId('player-edit-save-button').click();
    await expect(page.getByText('Alicia', { exact: true })).toBeVisible();
    await expect(page.getByText('Alice', { exact: true })).not.toBeVisible();

    // Renamed to "Alicia" above, so the row's testID is now keyed by the new
    // name.
    await page.getByTestId('player-delete-button-Alicia').click();
    await expect(page.getByText('DELETE PLAYER?', { exact: true })).toBeVisible();
    await page.getByTestId('delete-guard-confirm-button').click();
    await expect(page.getByText('Alicia', { exact: true })).not.toBeVisible();
    await expect(
      page.getByText('No players yet. Add your first player to get started.'),
    ).toBeVisible();
  });

  test('cannot delete a player that has a recorded match', async ({ authedPage: page }) => {
    await createTeamViaUI(page, 'Liverpool', 'LIV');
    await createTeamViaUI(page, 'Arsenal', 'ARS');
    await createPlayerViaUI(page, 'Alice', 'LIV');
    await createPlayerViaUI(page, 'Bob', 'ARS');
    await startTournamentViaUI(page, 'CRUD Cup', ['Alice', 'Bob']);
    await startMatchDayViaUI(page);
    await addMatchViaUI(page, 'Alice', 'Bob', 1, 0);

    await page.goto('/settings/players');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('player-delete-button-Bob').click();
    await expect(page.getByText('CANNOT DELETE', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Cannot delete — player has active matches.', { exact: true }),
    ).toBeVisible();
    await page.getByTestId('delete-guard-cannot-delete-ok-button').click();
    await expect(page.getByText('Bob', { exact: true })).toBeVisible();
  });
});
