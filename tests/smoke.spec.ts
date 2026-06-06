import { test, expect } from '@playwright/test';

const pages = [
  { path: '/', title: /CVRNS/, heading: 'CVRNS', headingSel: '.hero__title' },
  { path: '/music', title: /Music/, heading: 'Music', headingSel: '.page-head h1' },
  { path: '/store', title: /Store/, heading: 'Store', headingSel: '.page-head h1' },
];

for (const p of pages) {
  test(`${p.path} loads with correct title, heading, nav and footer`, async ({ page }) => {
    await page.goto(p.path);
    await expect(page).toHaveTitle(p.title);
    await expect(page.locator(p.headingSel)).toHaveText(p.heading);
    await expect(page.locator('nav.nav .nav__brand')).toBeVisible();
    // decorative watermark: CSS-generated text, hidden from assistive tech
    const giant = page.locator('footer.footer .footer__giant');
    await expect(giant).toBeVisible();
    await expect(giant).toHaveAttribute('aria-hidden', 'true');
  });
}

test('no uncaught page errors while browsing all pages', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const p of pages) {
    await page.goto(p.path);
    await page.waitForLoadState('domcontentloaded');
  }
  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('real Spotify embed is present on Home and Music, absent on Store', async ({ page }) => {
  const sel = 'iframe[src*="open.spotify.com/embed/album/0cLwfhERSggSwKM7PwPqu6"]';

  await page.goto('/');
  await expect(page.locator(sel)).toHaveCount(1);

  await page.goto('/music');
  await expect(page.locator(sel)).toHaveCount(1);

  await page.goto('/store');
  await expect(page.locator(sel)).toHaveCount(0);
});

test('current page is marked aria-current in the nav', async ({ page }) => {
  await page.goto('/music');
  await expect(page.locator('.nav__links a[aria-current="page"]')).toHaveText('Music');
});
