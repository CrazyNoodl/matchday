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

  // Dedicated test server on port 19007 with Supabase disabled.
  // Empty EXPO_PUBLIC_SUPABASE_* → supabaseConfigured=false → auth guard bypassed.
  webServer: {
    command: 'npx expo start --web --port 19007',
    url: 'http://localhost:19007',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      EXPO_NO_INTERACTIVE: '1',
      EXPO_PUBLIC_SUPABASE_URL: '',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: '',
    },
  },
});
