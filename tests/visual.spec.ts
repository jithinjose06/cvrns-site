import { test, expect } from '@playwright/test';

const routes = [
  { path: '/', name: 'home' },
  { path: '/music', name: 'music' },
  { path: '/store', name: 'store' },
];

/**
 * Full-page visual snapshots per route, per project (desktop + mobile).
 * The Spotify iframe is masked (external, non-deterministic).
 *
 * reducedMotion:'reduce' forces every .reveal element to its visible end-state
 * (per the site's CSS), so below-the-fold content is captured instead of the
 * pre-scroll opacity:0 state - and it freezes the grain animation.
 */
test.use({ reducedMotion: 'reduce' });

for (const r of routes) {
  test(`visual: ${r.name}`, async ({ page, browserName }) => {
    // Snapshot baselines are engine/platform-specific (committed as chromium -win32).
    // Only compare on chromium, and skip on CI (Linux) to avoid false diffs.
    test.skip(browserName !== 'chromium', 'visual baselines are chromium-only');
    test.skip(!!process.env.CI, 'visual baselines are platform-specific; run locally');
    await page.goto(r.path);
    await page.waitForLoadState('load');
    // force every scroll-reveal element to its end-state so below-the-fold
    // content is captured deterministically (independent of scroll/IO timing)
    await page.evaluate(() => {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
    });
    // wait until all three webfont families are actually applied, otherwise
    // font-swap reflow makes the tall pages oscillate in height mid-capture
    await page.waitForFunction(
      () =>
        document.fonts.check('400 1rem Anton') &&
        document.fonts.check('300 1rem Archivo') &&
        document.fonts.check('400 1rem "Space Mono"'),
      undefined,
      { timeout: 15_000 }
    );
    await page.waitForTimeout(400);

    await expect(page).toHaveScreenshot(`${r.name}.png`, {
      fullPage: true,
      mask: [page.locator('iframe')],
      timeout: 15_000,
    });
  });
}
