import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://localhost:19007',
    trace: 'on',
    screenshot: 'on',
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
    },
  },
});
