import {
  test,
  expect,
  createTeamViaUI,
  createPlayerViaUI,
  addMatchViaUI,
  startTournamentViaUI,
  startMatchDayViaUI,
} from './fixtures';

test.describe('Main game loop', () => {
  test('play a full round with the equal-games rule, Finish it, and crown a tournament champion @smoke', async ({
    authedPage: page,
  }) => {
    // ---- Setup: 3 teams, 3 players ----
    await createTeamViaUI(page, 'Liverpool', 'LIV');
    await createTeamViaUI(page, 'Arsenal', 'ARS');
    await createTeamViaUI(page, 'Chelsea', 'CHE');
    await createPlayerViaUI(page, 'Alice', 'LIV');
    await createPlayerViaUI(page, 'Bob', 'ARS');
    await createPlayerViaUI(page, 'Cara', 'CHE');

    // ---- Create the tournament with all 3 players ----
    await startTournamentViaUI(page, 'Game Loop Cup', ['Alice', 'Bob', 'Cara']);

    // ---- Start the first match day (all 3 players pre-selected, ranked) ----
    await startMatchDayViaUI(page);

    // ---- Match 1: Alice 2-0 Bob — standings update ----
    await addMatchViaUI(page, 'Alice', 'Bob', 2, 0);
    await expect(page.getByText('MATCHES · 1', { exact: true })).toBeVisible();

    // ---- Equal games rule: Cara hasn't played yet — Finishing must be blocked ----
    await page.getByTestId('round-menu-button').click();
    await page.getByTestId('round-menu-finish-item').click();
    await expect(page.getByText('EVEN OUT THE GAMES', { exact: true })).toBeVisible();
    await expect(page.getByText(/^0 games$/).last()).toBeVisible();
    await page.getByTestId('round-need-equal-ok-button').click();

    // Known bug: after Finish -> EVEN OUT THE GAMES -> Got it, the round
    // options sheet stays stuck open and covers the "+ ADD MATCH" FAB
    // (Sheet doesn't retract when its `visible` prop flips true -> false in
    // the same batch as opening the needEqual dialog). Reload /round as a
    // workaround until that's fixed — see AskUserQuestion decision in PR notes.
    await page.goto('/round');
    await page.waitForLoadState('networkidle');

    // ---- Match 2: Alice 3-1 Cara — still unequal (Bob: 1, Cara: 1, Alice: 2) ----
    await addMatchViaUI(page, 'Alice', 'Cara', 3, 1);
    await page.getByTestId('round-menu-button').click();
    await page.getByTestId('round-menu-finish-item').click();
    await expect(page.getByText('EVEN OUT THE GAMES', { exact: true })).toBeVisible();
    await page.getByTestId('round-need-equal-ok-button').click();
    await page.goto('/round');
    await page.waitForLoadState('networkidle');

    // ---- Match 3: Bob 1-0 Cara — now everyone has played twice ----
    await addMatchViaUI(page, 'Bob', 'Cara', 1, 0);
    await expect(page.getByText('MATCHES · 3', { exact: true })).toBeVisible();

    // ---- Finish round: equal games now — crown the winner ----
    await page.getByTestId('round-menu-button').click();
    await page.getByTestId('round-menu-finish-item').click();
    await expect(page.getByText('FINISH ROUND?', { exact: true })).toBeVisible();
    await page.getByTestId('round-finish-confirm-button').click();

    // Alice has the most points (2 wins = 6pts) — she should be crowned
    await expect(page.getByText('MATCH DAY WINNER', { exact: true })).toBeVisible();
    await expect(page.getByText('Alice', { exact: true }).last()).toBeVisible();
    await page.getByTestId('winner-modal-done-button').click();
    await expect(page).toHaveURL(/.*tournament/);

    // ---- Close the tournament and check the archived champion ----
    await page.getByTestId('tournament-menu-button').click();
    await page.getByTestId('tournament-close-archive-row').click();
    await expect(page.getByText('CLOSE TOURNAMENT?', { exact: true })).toBeVisible();
    await page.getByTestId('tournament-close-archive-confirm-button').click();
    await expect(page).toHaveURL('/');

    await page.goto('/archive');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Game Loop Cup', { exact: true })).toBeVisible();
    await expect(page.getByText('Alice', { exact: true })).toBeVisible();
  });
});
