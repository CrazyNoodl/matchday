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

// Covers three previously-untested paths in the game loop and match detail:
// a friendly (non-ranked) round, a genuine tied round (`isTopTied`), and the
// 23-stat edit sheet (only reachable from a match that already has
// `statsOverride` — normally populated by OCR import, so we seed it directly
// via localStorage the same way e2e/10.match-detail.spec.ts reads match ids).

test.describe('Friendly round', () => {
  test('a friendly match day is excluded from ranking but still crowns a day winner', async ({
    authedPage: page,
  }) => {
    await createTeamViaUI(page, 'Liverpool', 'LIV');
    await createTeamViaUI(page, 'Arsenal', 'ARS');
    await createPlayerViaUI(page, 'Alice', 'LIV');
    await createPlayerViaUI(page, 'Bob', 'ARS');
    await startTournamentViaUI(page, 'Friendly Cup', ['Alice', 'Bob']);

    await page.getByTestId('new-match-day-button').click();
    await expect(page.getByTestId('new-round-start-button')).toBeVisible();
    await page.getByText('Ranked match day', { exact: true }).click();
    await page.getByTestId('new-round-start-button').click();
    await expect(page).toHaveURL(/.*round/);

    await expect(page.getByText('FRIENDLY', { exact: true })).toBeVisible();

    await addMatchViaUI(page, 'Alice', 'Bob', 2, 1);

    await page.getByText('···', { exact: true }).last().click();
    await page.getByText('Finish', { exact: true }).last().click();
    await expect(page.getByText('FINISH ROUND?', { exact: true })).toBeVisible();
    await page.getByText('Crown winner', { exact: true }).last().click();
    await expect(page.getByText('MATCH DAY WINNER', { exact: true })).toBeVisible();
    await page.getByText('DONE', { exact: true }).last().click();
    await expect(page).toHaveURL(/.*tournament/);

    // The round card on /tournament shows a FRIENDLY badge (RoundCard, !ranked).
    await expect(page.getByText('FRIENDLY', { exact: true }).last()).toBeVisible();
  });
});

test.describe('Tied round', () => {
  test('a drawn match ties the round and shows the draw result instead of crowning a winner', async ({
    authedPage: page,
  }) => {
    await createTeamViaUI(page, 'Liverpool', 'LIV');
    await createTeamViaUI(page, 'Arsenal', 'ARS');
    await createPlayerViaUI(page, 'Alice', 'LIV');
    await createPlayerViaUI(page, 'Bob', 'ARS');
    await startTournamentViaUI(page, 'Draw Cup', ['Alice', 'Bob']);
    await startMatchDayViaUI(page);

    // A 1-1 draw between the only two players ties pts/GD/GF and H2H alike.
    await addMatchViaUI(page, 'Alice', 'Bob', 1, 1);

    await page.getByText('···', { exact: true }).last().click();
    await page.getByText('Finish', { exact: true }).last().click();
    await expect(page.getByText('FINISH ROUND?', { exact: true })).toBeVisible();
    await page.getByText('Crown winner', { exact: true }).last().click();

    await expect(page.getByText('MATCH DAY RESULT', { exact: true })).toBeVisible();
    await expect(page.getByText('DRAW', { exact: true })).toBeVisible();
    await expect(page.getByText('MATCH DAY WINNER', { exact: true })).not.toBeVisible();

    await page.getByText('DONE', { exact: true }).last().click();
    await expect(page).toHaveURL(/.*tournament/);
  });
});

test.describe('Match detail — edit stats sheet', () => {
  async function setupMatchWithStats(page: Page): Promise<string> {
    await createTeamViaUI(page, 'Liverpool', 'LIV');
    await createTeamViaUI(page, 'Arsenal', 'ARS');
    await createPlayerViaUI(page, 'Alice', 'LIV');
    await createPlayerViaUI(page, 'Bob', 'ARS');
    await startTournamentViaUI(page, 'Stats Cup', ['Alice', 'Bob']);
    await startMatchDayViaUI(page);
    await addMatchViaUI(page, 'Alice', 'Bob', 2, 1);

    // Seed statsOverride directly — the edit-stats sheet is otherwise only
    // reachable via OCR import (a real OS photo picker), which Playwright
    // can't drive without mocking expo-image-picker.
    const matchId = await page.evaluate(() => {
      const raw = localStorage.getItem('matchday-store');
      const state = raw ? JSON.parse(raw).state : null;
      const match = state?.matches?.[0];
      if (!match) return null;
      match.statsOverride = {
        possession: { a: 55, b: 45, confidence: 'high' },
        shots: { a: 10, b: 8, confidence: 'medium' },
      };
      localStorage.setItem('matchday-store', JSON.stringify({ state, version: 0 }));
      return match.id as string;
    });
    expect(matchId).toBeTruthy();
    await page.goto(`/match/${matchId}`);
    await page.waitForLoadState('networkidle');
    return matchId as string;
  }

  test('adjusts a stat value and confirms a low-confidence stat', async ({ authedPage: page }) => {
    const matchId = await setupMatchWithStats(page);

    await page.getByText('···', { exact: true }).click();
    await page.getByText('Edit', { exact: true }).last().click();
    await expect(page.getByText('EDIT STATS', { exact: true })).toBeVisible();

    // Possession row (side A = Alice, high confidence, no dot) — 55 -> 56.
    // The read-only stats section behind the sheet already shows "55" too
    // (app/match/[id].tsx's own StatsRow), so scope to the sheet's copy.
    await expect(page.getByText('55', { exact: true }).last()).toBeVisible();
    await page.getByText('+', { exact: true }).first().click();
    await expect(page.getByText('56', { exact: true })).toBeVisible();

    // Shots row is medium-confidence — tapping its label confirms it in
    // place without nudging the value via +/-. The row's accessibilityLabel
    // ("Confirm value is correct") renders its own hidden text node with the
    // same "Shots" content, so scope to the last (innermost) match.
    await page.getByText('Shots', { exact: true }).last().click();

    await page.getByText('Save', { exact: true }).last().click();

    const updated = await page.evaluate((id) => {
      const raw = localStorage.getItem('matchday-store');
      const state = raw ? JSON.parse(raw).state : null;
      return state?.matches.find((m: { id: string }) => m.id === id);
    }, matchId);
    expect(updated?.statsOverride?.possession?.a).toBe(56);
    expect(updated?.statsOverride?.shots?.a).toBe(10);
  });
});
