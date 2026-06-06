import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = [
  { path: '/', name: 'home' },
  { path: '/music', name: 'music' },
  { path: '/store', name: 'store' },
];

/**
 * Accessibility scan of each page against WCAG 2.0/2.1 A & AA rules.
 * Violations are attached to the HTML report and summarized in the failure
 * message so they're easy to triage.
 *
 * reducedMotion + forcing reveals to their end-state ensures axe measures the
 * final rendered colors, not the transient faded opacity mid scroll-reveal.
 */
test.use({ reducedMotion: 'reduce' });

for (const r of routes) {
  test(`a11y: ${r.name} has no WCAG A/AA violations`, async ({ page }, testInfo) => {
    await page.goto(r.path);
    await page.waitForLoadState('load');
    // hard-force reveal end-state (no transition) so axe measures final colors
    await page.addStyleTag({
      content: '.reveal{opacity:1!important;transform:none!important;transition:none!important}',
    });
    await page.waitForTimeout(200);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // the Spotify embed is a third-party iframe we don't control
      .exclude('iframe')
      // decorative, screen-reader-hidden elements (e.g. the giant footer
      // watermark) are intentionally near-invisible and exempt from contrast
      .exclude('[aria-hidden="true"]')
      .analyze();

    await testInfo.attach('axe-results.json', {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });

    const summary = results.violations
      .map(
        (v) =>
          `- [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node${
            v.nodes.length === 1 ? '' : 's'
          })\n    ${v.nodes[0]?.target.join(' ')}`
      )
      .join('\n');

    expect(results.violations, `\n${summary}`).toEqual([]);
  });
}
