import { test as base, expect, type Page } from '@playwright/test';

// Supabase project ref from EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_PROJECT_REF = 'vjivyppkjogpqggnvrvo';
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
  await page.getByText('+ ADD').click();
  await expect(page.getByText('NEW TEAM')).toBeVisible();
  await page.getByPlaceholder('e.g. Manchester City').fill(name);
  await page.getByPlaceholder('e.g. MCI').fill(short);
  await page.getByText('ADD TEAM', { exact: true }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}

// Reusable UI helper: creates a player via the players settings screen.
// Optionally assigns the player to a team by its short code (e.g. 'LIV').
// Leaves the browser on /settings/players after the player is saved.
export async function createPlayerViaUI(page: Page, name: string, teamShort?: string) {
  await page.goto('/settings/players');
  await page.waitForLoadState('networkidle');
  await page.getByText('+ ADD').click();
  await expect(page.getByPlaceholder('Player name')).toBeVisible();
  await page.getByPlaceholder('Player name').fill(name);
  if (teamShort) {
    await expect(page.getByText(teamShort, { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });
    await page.getByText(teamShort, { exact: true }).first().click();
  }
  await page.getByText('ADD PLAYER', { exact: true }).click();
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
// Assumes tournamentRanked (default from setup.tsx) — steps are:
// 1 players -> 2 score -> 3 media (skip) -> 4 commentary (skip) -> save.
export async function addMatchViaUI(
  page: Page,
  homeName: string,
  awayName: string,
  homeScore: number,
  awayScore: number,
) {
  await page.getByText('+ ADD MATCH', { exact: true }).last().click();

  // Step 1 — players
  await page.getByText(homeName, { exact: true }).last().click();
  await page.getByText(awayName, { exact: true }).last().click();
  await page.getByText('NEXT', { exact: true }).last().click();

  // Step 2 — score. Background screens (see note above) can contribute their
  // own stray "+" icons (e.g. Home's big "+" tile, Setup's rounds stepper),
  // but the live ScoreCounter pair is always the last two "+" buttons on the
  // page, in home-then-away order — verified against this app's build.
  const plus = page.getByText('+', { exact: true });
  const total = await plus.count();
  const homeIncrement = plus.nth(total - 2);
  const awayIncrement = plus.nth(total - 1);
  for (let i = 0; i < homeScore; i++) await homeIncrement.click();
  for (let i = 0; i < awayScore; i++) await awayIncrement.click();
  await page.getByText('NEXT', { exact: true }).last().click();

  // Step 3 — media (skip)
  await page.getByText('NEXT', { exact: true }).last().click();

  // Step 4 — commentary (skip) -> save
  await page.getByText('SAVE MATCH', { exact: true }).last().click();
}

// playwright.config.ts's webServer passes empty EXPO_PUBLIC_SUPABASE_* env
// vars intending to make supabaseConfigured=false for the whole e2e run, but
// Expo/Metro's env inlining reads .env directly at bundle time and ignores
// that override — the real project URL/key still end up baked into the web
// bundle. Without this block, every e2e test silently makes live network
// calls to the real (shared dev/prod, see docs/CONTEXT.md's sync incident
// notes) Supabase project using FAKE_SESSION's unsigned JWT — requests get
// rejected (401) rather than mutating real data, but it's an unintended live
// dependency, not the "disabled" behavior the config comment promises.
// Blocking the host here is a hard guarantee no e2e run can reach it.
async function blockSupabaseNetwork(page: Page) {
  await page.route(`**://${SUPABASE_PROJECT_REF}.supabase.co/**`, (route) => route.abort());
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
