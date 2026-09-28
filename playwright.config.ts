import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  // Local runs get 1 retry too (CI already had 2) — the shared dev server
  // handling all parallel workers occasionally causes a transient action
  // timeout under load; a stable failure still fails after the retry.
  retries: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://localhost:19007',
    trace: 'on',
    screenshot: 'on',
    // The app registers a Service Worker (`public/sw.js`, see app/_layout.tsx)
    // for offline caching. Once active, it intercepts fetch() at the SW's own
    // execution context and re-issues the network request itself — a request
    // page.route() abort()s never actually reaches the SW's inner fetch, so
    // blockSupabaseNetwork (e2e/fixtures.ts) silently failed to block anything
    // whenever the SW was active: every e2e test was making real, live calls
    // to the production Supabase project with FAKE_SESSION's unsigned JWT
    // (rejected 401/403, not mutating data, but a genuine live dependency —
    // and exactly the risk blockSupabaseNetwork's comment already warned
    // about without actually preventing). Blocking SW registration outright
    // removes the whole class of bug — no e2e test needs the offline-caching
    // behavior the SW provides.
    serviceWorkers: 'block',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { slowMo: process.env.SLOWMO ? Number(process.env.SLOWMO) : 0 },
      },
    },
  ],

  // Dedicated test server on port 19007. EXPO_PUBLIC_SUPABASE_* is NOT forced
  // empty here — Metro/Expo's env inlining reads .env directly at bundle time
  // regardless of what's passed to this child process (see blockSupabaseNetwork
  // in e2e/fixtures.ts), so overriding it here was never actually disabling
  // Supabase, just hiding that fact locally. CI has no .env file, so it relies
  // on EXPO_PUBLIC_SUPABASE_URL/ANON_KEY being set at the job level (from repo
  // secrets — see .github/workflows/test.yml) to keep supabaseConfigured=true
  // consistent between local dev and CI. All real Supabase network calls are
  // still hard-blocked per-test via blockSupabaseNetwork, regardless of this.
  webServer: {
    command: 'npx expo start --web --port 19007',
    url: 'http://localhost:19007',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      EXPO_NO_INTERACTIVE: '1',
      // Makes `Sheet`'s open/close animations instant (see Sheet.tsx) — removes
      // the animation-completion race that caused stuck-backdrop flakiness
      // under parallel workers (docs/CONTEXT.md, 2026-07-23).
      EXPO_PUBLIC_E2E: '1',
    },
  },
});
