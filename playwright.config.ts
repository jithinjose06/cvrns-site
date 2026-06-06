import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const baseURL = `http://localhost:${PORT}`;
const DEBUG_PORT = 9222;

/**
 * Tests run against the built + previewed static site (production-like),
 * not the dev server. The webServer block builds and serves automatically.
 *
 * Functional + accessibility tests run across Chromium, Firefox, WebKit and
 * two mobile profiles. Visual snapshots are chromium-only (baselines are
 * engine/platform specific). The `perf` project runs Lighthouse separately.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled' },
  },

  projects: [
    // Functional + a11y + visual (chromium); names kept stable for snapshots.
    {
      name: 'desktop',
      testIgnore: /perf\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    {
      name: 'mobile',
      testIgnore: /perf\.spec\.ts/,
      use: { ...devices['Pixel 5'] },
    },
    // Cross-browser: functional + a11y (visual tests self-skip off chromium).
    {
      name: 'firefox',
      testIgnore: /perf\.spec\.ts/,
      use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 900 } },
    },
    {
      name: 'webkit',
      testIgnore: /perf\.spec\.ts/,
      use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 900 } },
    },
    {
      name: 'mobile-safari',
      testIgnore: /perf\.spec\.ts/,
      use: { ...devices['iPhone 13'] },
    },
    // Lighthouse performance/SEO/best-practices budget (chromium + CDP).
    {
      name: 'perf',
      testMatch: /perf\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { args: [`--remote-debugging-port=${DEBUG_PORT}`] },
      },
    },
  ],

  webServer: {
    command: 'npm run build && npm run preview',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
