import { test, expect } from '@playwright/test';

/**
 * Content integrity guard. Unlike visual snapshots (which only detect drift
 * from a baseline that could itself be wrong) and axe (which treats garbled
 * characters as valid text), this asserts the page is decoded correctly:
 *  - the document declares UTF-8, and
 *  - nothing rendered as U+FFFD (the universal "mojibake happened" marker).
 *
 * This is intentionally content-agnostic: it survives copy edits and new pages
 * with zero maintenance, while catching encoding corruption deterministically.
 */
const routes = ['/', '/music', '/store'];

for (const path of routes) {
  test(`content: ${path} is served as valid UTF-8 (no replacement chars)`, async ({ page }) => {
    await page.goto(path);

    await expect(page.locator('meta[charset]')).toHaveAttribute('charset', /utf-8/i);

    const html = await page.evaluate(() => document.documentElement.outerHTML);
    expect(
      html.includes('\uFFFD'),
      'rendered document contains a U+FFFD replacement character (encoding corruption)'
    ).toBe(false);
  });
}
