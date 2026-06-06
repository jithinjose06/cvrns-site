import { test } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

/**
 * Lighthouse budget. Runs only in the `perf` project, which launches Chromium
 * with a fixed remote-debugging port. Serial mode keeps a single browser on
 * that port (Lighthouse drives the page over CDP).
 */
const DEBUG_PORT = 9222;

const routes = [
  { name: 'home', path: '/' },
  { name: 'music', path: '/music' },
  { name: 'store', path: '/store' },
];

// Budgets (0-100), with a little headroom under observed scores because
// Lighthouse perf is noisy. Best-practices is capped at ~77 on the Music/Home
// pages by the Spotify embed's third-party cookies (outside our control), so
// the floor sits below that while still catching real regressions.
const thresholds = {
  performance: 85,
  accessibility: 100,
  'best-practices': 75,
  seo: 95,
};

test.describe.configure({ mode: 'serial' });

test.describe('lighthouse budgets', () => {
  for (const r of routes) {
    test(`lighthouse: ${r.name} meets the budget`, async ({ page }) => {
      test.slow();
      await page.goto(r.path, { waitUntil: 'networkidle' });
      await playAudit({
        page,
        port: DEBUG_PORT,
        thresholds,
        reports: { formats: { html: false, json: false, csv: false } },
      });
    });
  }
});
