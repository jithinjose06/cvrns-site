import { test, expect } from '@playwright/test';

test.describe('desktop nav links', () => {
  test('clicking nav links navigates between pages', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'desktop nav links are hidden on mobile (hamburger covered separately)');

    await page.goto('/');
    await page.locator('.nav__links a', { hasText: 'Music' }).click();
    await expect(page).toHaveURL(/\/music\/?$/);
    await expect(page.locator('.page-head h1')).toHaveText('Music');

    await page.locator('.nav__links a', { hasText: 'Store' }).click();
    await expect(page).toHaveURL(/\/store\/?$/);
    await expect(page.locator('.page-head h1')).toHaveText('Store');

    await page.locator('.nav__brand').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('.hero__title')).toHaveText('CVRNS');
  });
});

test('home CTA buttons link to Music and Store', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero .actions a', { hasText: 'Listen' })).toHaveAttribute(
    'href',
    '/music'
  );
  await expect(page.locator('.hero .actions a', { hasText: 'Merch' })).toHaveAttribute(
    'href',
    '/store'
  );
});
