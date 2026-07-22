import { test, expect } from '@playwright/test';
import { SUPABASE_PROJECT_REF, blockSupabaseNetwork } from './fixtures';

// Deliberately does NOT use the `authedPage` fixture (no injected session, no
// cleared app state) — a shared round link must render for a genuinely
// anonymous, logged-out visitor.

const MOCK_ROUND = {
  round: { id: 'round-1', date: '2026-07-20T18:00:00.000Z', winner: 'p1', name: 'Round 1', n: 1, games: 1, ranked: true },
  matches: [
    {
      id: 'm1',
      aId: 'p1',
      bId: 'p2',
      aTeam: 'MCI',
      bTeam: 'LIV',
      aScore: 3,
      bScore: 1,
      note: 'Great match!',
      statsOverride: JSON.stringify({ possession: { a: 60, b: 40 } }),
    },
  ],
  players: [
    { id: 'p1', name: 'Artem', teamCode: 'MCI' },
    { id: 'p2', name: 'Danylo', teamCode: 'LIV' },
  ],
  teams: [
    { code: 'MCI', name: 'Man City', short: 'MCI', color: '#6CABDD' },
    { code: 'LIV', name: 'Liverpool', short: 'LIV', color: '#C8102E' },
  ],
};

async function mockSharedRoundRpc(page: import('@playwright/test').Page, body: unknown) {
  // Registration order matters: Playwright tries the most-recently-registered
  // route first, so the specific RPC mock must be added AFTER the wholesale
  // block for it to take priority over it.
  await blockSupabaseNetwork(page);
  await page.route(
    `**://${SUPABASE_PROJECT_REF}.supabase.co/rest/v1/rpc/get_shared_round`,
    (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }),
  );
}

test.describe('Shared round (public link)', () => {
  test('renders a read-only overview with a compact match list @smoke', async ({ page }) => {
    await mockSharedRoundRpc(page, MOCK_ROUND);
    await page.goto('/shared/abc-123');

    await expect(page.getByText('Artem').first()).toBeVisible();
    await expect(page.getByText('Danylo').first()).toBeVisible();

    // Overview is a compact list — stats/commentary are NOT shown inline,
    // only on the match detail screen (reached by tapping the row).
    await expect(page.getByText('Great match!')).toHaveCount(0);
    await expect(page.getByText('Possession', { exact: false })).toHaveCount(0);

    // Read-only: no edit/delete/add affordances anywhere on the page.
    await expect(page.getByText('DELETE', { exact: false })).toHaveCount(0);
    await expect(page.getByText('EDIT', { exact: false })).toHaveCount(0);
    await expect(page.getByText('+ ADD', { exact: false })).toHaveCount(0);
  });

  test('tapping a match navigates to its read-only detail with stats/media/commentary', async ({
    page,
  }) => {
    await mockSharedRoundRpc(page, MOCK_ROUND);
    await page.goto('/shared/abc-123');

    // "Artem" also appears in the day-winner banner and the standings table,
    // both above the (non-pressable) match list in render order — the match
    // card's own occurrence is the last one on the page.
    await page.getByText('Artem').last().click();

    await expect(page).toHaveURL(/\/shared\/abc-123\/match\/m1/);
    await expect(page.getByText('Great match!')).toBeVisible();
    await expect(page.getByText('Possession', { exact: false })).toBeVisible();
    await expect(page.getByText('60', { exact: true })).toBeVisible();
    await expect(page.getByText('EDIT', { exact: false })).toHaveCount(0);
  });

  test('Stats menu item opens the read-only matchday stats screen', async ({ page }) => {
    await mockSharedRoundRpc(page, MOCK_ROUND);
    await page.goto('/shared/abc-123');

    await page.getByText('···').click();
    await page.getByText('STATS', { exact: true }).click();

    await expect(page).toHaveURL(/\/shared\/abc-123\/stats/);
  });

  test('shows a not-found state for an unknown share id', async ({ page }) => {
    await mockSharedRoundRpc(page, null);
    await page.goto('/shared/not-a-real-id');

    await expect(page.getByText(/could not be found|не знайдено/i)).toBeVisible();
  });
});
