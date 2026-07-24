import { test, expect, blockSupabaseNetwork } from './fixtures';

// Minimal smoke coverage for screens that previously had zero e2e tests:
// onboarding carousel, the logged-out login screen, the password-reset
// safety-net redirect, and the Settings sub-screens that don't need seeded
// tournament data (display, language, tournaments empty state, changelog).

test.describe('Onboarding carousel', () => {
  test('first-launch redirect to /welcome, and Skip returns to Home', async ({
    authedPage: page,
  }) => {
    // authedPage's clearAppState forces hasSeenOnboarding true so every other
    // test lands on Home — flip it back to simulate a genuine first launch.
    await page.evaluate(() => {
      const raw = localStorage.getItem('matchday-store');
      const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
      parsed.state.hasSeenOnboarding = false;
      localStorage.setItem('matchday-store', JSON.stringify(parsed));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/.*welcome/);
    await expect(page.getByText('Welcome to Matchday', { exact: true })).toBeVisible();

    await page.getByText('Skip', { exact: true }).click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('Login screen', () => {
  // Deliberately does NOT use the `authedPage` fixture — a logged-out visitor
  // must see the sign-in form, not the app.
  test('renders sign-in form and switches to sign-up / forgot-password modes', async ({
    page,
  }) => {
    await blockSupabaseNetwork(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('MATCHDAY', { exact: true })).toBeVisible();
    await expect(page.getByText('Sign in to sync across devices', { exact: true })).toBeVisible();
    await expect(page.getByText('SIGN IN', { exact: true })).toBeVisible();
    await expect(page.getByText('Forgot password?', { exact: true })).toBeVisible();

    await page.getByText("Don't have an account? Sign up", { exact: true }).click();
    await expect(page.getByText('CREATE ACCOUNT', { exact: true })).toBeVisible();
    await expect(page.getByTestId('confirm-password-input')).toBeVisible();

    await page.getByText('Already have an account? Sign in', { exact: true }).click();
    await expect(page.getByText('SIGN IN', { exact: true })).toBeVisible();

    await page.getByText('Forgot password?', { exact: true }).click();
    await expect(page.getByText('SEND RESET LINK', { exact: true })).toBeVisible();
  });
});

test.describe('Reset password safety net', () => {
  test('navigating to /reset-password directly redirects home', async ({ authedPage: page }) => {
    await page.goto('/reset-password');
    await expect(page).toHaveURL('/');
  });
});

test.describe('Settings sub-screens', () => {
  test('display, language, tournaments (empty) and changelog render', async ({
    authedPage: page,
  }) => {
    await page.goto('/settings/display');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('DISPLAY', { exact: true })).toBeVisible();
    await expect(page.getByText('Group matches by tours', { exact: true })).toBeVisible();
    await expect(page.getByText('Show leader modal', { exact: true })).toBeVisible();

    await page.goto('/settings/language');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('LANGUAGE', { exact: true })).toBeVisible();
    await expect(page.getByText('Українська', { exact: true })).toBeVisible();
    // Exactly one language is selected (✓) before and after switching.
    await expect(page.getByText('✓', { exact: true })).toHaveCount(1);
    await page.getByText('Українська', { exact: true }).click();
    await expect(page.getByText('✓', { exact: true })).toHaveCount(1);
    // Switch back to English — later assertions in this test rely on English strings.
    await page.getByText('English', { exact: true }).first().click();
    await expect(page.getByText('LANGUAGE', { exact: true })).toBeVisible();

    await page.goto('/settings/tournaments');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('TOURNAMENTS', { exact: true })).toBeVisible();
    await expect(page.getByText('START TOURNAMENT', { exact: true })).toBeVisible();

    await page.goto('/settings/changelog');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText("WHAT'S NEW", { exact: true })).toBeVisible();
    await expect(page.getByText(/^v\d+\.\d+\.\d+$/).first()).toBeVisible();
  });
});
