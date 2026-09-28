import { test as base, expect, type Page } from '@playwright/test';

// Supabase project ref from EXPO_PUBLIC_SUPABASE_URL
export const SUPABASE_PROJECT_REF = 'vjivyppkjogpqggnvrvo';
const SUPABASE_SESSION_KEY = `sb-${SUPABASE_PROJECT_REF}-auth-token`;

// Fake session injected before page scripts run.
// Supabase SDK reads expires_at from stored JSON — no JWT signature validation client-side.
const FAKE_SESSION = {
  access_token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    'eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE3MDAwMDAwMDAsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJhdXRoZW50aWNhdGVkIn0.' +
    'FAKESIGNATURE',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 9999999999,
  refresh_token: 'fake-refresh-token',
  user: {
    id: '00000000-0000-0000-0000-000000000001',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    email_confirmed_at: '2024-01-01T00:00:00.000Z',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
};

async function injectFakeSession(page: Page) {
  await page.addInitScript(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
    },
    { key: SUPABASE_SESSION_KEY, session: FAKE_SESSION },
  );
}

async function clearAppState(page: Page) {
  await page.addInitScript(() => {
    // Only clear once per test — sessionStorage survives same-origin navigation
    // within the test but is reset between tests (new browser context per test).
    if (sessionStorage.getItem('e2e-cleared')) return;
    sessionStorage.setItem('e2e-cleared', '1');
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith('sb-')) localStorage.removeItem(key);
    }
    // Skip the first-launch onboarding carousel (app/welcome.tsx) — it gates
    // Home behind hasSeenOnboarding, which the clear above always resets to
    // false, so every test would otherwise land on /welcome instead of Home.
    localStorage.setItem(
      'matchday-store',
      JSON.stringify({ state: { hasSeenOnboarding: true }, version: 0 }),
    );
  });
}

// Reusable UI helper: creates a team via the teams settings screen.
// Leaves the browser on /settings/teams after the team is saved.
export async function createTeamViaUI(page: Page, name: string, short: string) {
  await page.goto('/settings/teams');
  await page.waitForLoadState('networkidle');
  await page.getByTestId('teams-add-button').click();
  await expect(page.getByText('NEW TEAM')).toBeVisible();
  await page.getByTestId('team-edit-name-input').fill(name);
  await page.getByTestId('team-edit-short-input').fill(short);
  await page.getByTestId('team-edit-save-button').click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}

// Reusable UI helper: creates a player via the players settings screen.
// Optionally assigns the player to a team by its short code (e.g. 'LIV').
// Leaves the browser on /settings/players after the player is saved.
export async function createPlayerViaUI(page: Page, name: string, teamShort?: string) {
  await page.goto('/settings/players');
  await page.waitForLoadState('networkidle');
  await page.getByTestId('players-add-button').click();
  await expect(page.getByTestId('player-edit-name-input')).toBeVisible();
  await page.getByTestId('player-edit-name-input').fill(name);
  if (teamShort) {
    const teamChip = page.getByTestId(`team-picker-item-${teamShort}`);
    await expect(teamChip).toBeVisible({ timeout: 15_000 });
    await teamChip.click();
  }
  await page.getByTestId('player-edit-save-button').click();
  await expect(page.getByText(name, { exact: true }).last()).toBeVisible();
}

// expo-router's Stack keeps every pushed screen mounted underneath the active
// one (for back-gesture support), and the Zustand store is global — so a
// backgrounded screen keeps re-rendering with live data (e.g. Home's hidden
// leader name) even while covered. That produces exact-text duplicates once
// you've navigated a couple of screens deep. `.last()` reliably lands on the
// topmost/active screen because expo-router appends newly pushed screens
// after existing ones in the DOM — use it for any text lookup performed
// after the first in-app navigation. (Verified empirically against this
// app's build — see e2e/fixtures.ts git history if this ever regresses.)

// Adds one match via the multi-step Add Match sheet on /round.
// Steps for a ranked round (setup.tsx default): 1 players -> 2 score ->
// 3 media (skip) -> 4 commentary (skip) -> save. A friendly (non-ranked)
// round inserts an extra "pick teams" step between players and score
// (useAddMatchFlow.ts: totalSteps = tournamentRanked ? 4 : 5, Next is
// disabled on that step until both homeTeam/awayTeam are set — see
// canAddMatchGoNext in src/utils/addMatchState.ts) — detected and cleared
// here generically so this helper works for both round types.
export async function addMatchViaUI(
  page: Page,
  homeName: string,
  awayName: string,
  homeScore: number,
  awayScore: number,
) {
  await page.getByTestId('add-match-fab-button').click();

  // Step 1 — players
  await page.getByTestId(`player-chip-${homeName}`).click();
  await page.getByTestId(`player-chip-${awayName}`).click();
  await page.getByTestId('add-match-next-button').click();

  // Friendly-round-only "pick teams" step — pick the first option for each
  // side (which team doesn't matter for a generic helper) and continue.
  const teamPickers = page.getByTestId(/^team-picker-item-/);
  if (await teamPickers.first().isVisible().catch(() => false)) {
    await teamPickers.first().click();
    await teamPickers.last().click();
    await page.getByTestId('add-match-next-button').click();
  }

  // Step — score
  const homeIncrement = page.getByTestId('score-counter-home-increment');
  const awayIncrement = page.getByTestId('score-counter-away-increment');
  for (let i = 0; i < homeScore; i++) await homeIncrement.click();
  for (let i = 0; i < awayScore; i++) await awayIncrement.click();
  await page.getByTestId('add-match-next-button').click();

  // Step 3 — media (skip)
  await page.getByTestId('add-match-next-button').click();

  // Step 4 — commentary (skip) -> save
  await page.getByTestId('add-match-save-button').click();
}

// Reusable UI helper: creates a tournament from Home, selecting the given
// (already-existing) players by name. Leaves the browser on Home with the
// tournament live. Assumes players/teams were already created (e.g. via
// createTeamViaUI/createPlayerViaUI) before calling this.
export async function startTournamentViaUI(page: Page, name: string, playerNames: string[]) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByTestId('start-new-tournament-button').click();
  await expect(page).toHaveURL(/.*setup/);
  await page.getByTestId('setup-tournament-name-input').fill(name);
  for (const playerName of playerNames) {
    await page.getByTestId(`player-row-${playerName}`).click();
  }
  await page.getByTestId('start-tournament-button').click();
  await expect(page).toHaveURL('/');

  // expo-router keeps the pre-tournament Home + Setup screens mounted
  // underneath this one (see the note above) — reload to get a single clean
  // Home instance before driving the rest of the flow.
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

// Reusable UI helper: starts the first (or next) match day from Home and
// opens the New Round modal's confirm, landing on /round.
export async function startMatchDayViaUI(page: Page) {
  await page.getByTestId('new-match-day-button').click();
  await expect(page.getByTestId('new-round-start-button')).toBeVisible();
  await page.getByTestId('new-round-start-button').click();
  await expect(page).toHaveURL(/.*round/);
}

// supabaseConfigured is true for the whole e2e run, both locally (via .env)
// and in CI (via repo secrets — see playwright.config.ts's webServer.env
// comment and .github/workflows/test.yml), so every test's build has the
// real project URL/key baked in. Without this block, every e2e test would
// silently make live network calls to the real (shared dev/prod, see
// docs/CONTEXT.md's sync incident notes) Supabase project using
// FAKE_SESSION's unsigned JWT — requests get rejected (401) rather than
// mutating real data, but it's an unintended live dependency all the same.
// Blocking the host here is a hard guarantee no e2e run can reach it.
export async function blockSupabaseNetwork(page: Page) {
  await page.route(`**://${SUPABASE_PROJECT_REF}.supabase.co/**`, (route) => route.abort());

  // `useIsOnline()`'s reachability ping (`pingSupabase`, src/supabase/health.ts)
  // hits this same host with no auth/session and no data — it's the one
  // request the block above shouldn't apply to. Registered after the
  // wholesale block (route registration is LIFO, so the more specific,
  // later-registered route wins) so it fulfills instead of aborting. Explicit
  // offline tests (`page.context().setOffline(true)`) are unaffected: that
  // flips the browser's own online/offline signal, which useIsOnline()
  // trusts before it ever gets to the ping.
  await page.route(`**://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/health`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
}

// Extended test fixture: auto-injects auth + clears app state before each test
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await blockSupabaseNetwork(page);
    await injectFakeSession(page);
    await clearAppState(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await use(page);
  },
});

export { expect };
