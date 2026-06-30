import { test as base, expect, Page } from '@playwright/test';

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
    await expect(page.getByText(teamShort, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await page.getByText(teamShort, { exact: true }).first().click();
  }
  await page.getByText('ADD PLAYER', { exact: true }).click();
  await expect(page.getByText(name, { exact: true }).last()).toBeVisible();
}

// Extended test fixture: auto-injects auth + clears app state before each test
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await injectFakeSession(page);
    await clearAppState(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await use(page);
  },
});

export { expect };
