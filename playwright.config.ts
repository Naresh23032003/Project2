import { defineConfig } from '@playwright/test';

const executablePath = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:4173',
    launchOptions: { executablePath: process.env.CI ? undefined : executablePath },
    contextOptions: { reducedMotion: 'reduce' },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: 'node scripts/serve-dist.mjs 4173', url: 'http://localhost:4173', reuseExistingServer: true, timeout: 30_000 },
});
