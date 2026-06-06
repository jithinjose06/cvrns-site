import { test, expect } from '@playwright/test';

test.describe('mobile drawer', () => {
  test('hamburger opens the drawer and a link closes it', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'hamburger only renders on mobile widths');

    await page.goto('/');
    const drawer = page.locator('.drawer');
    await expect(drawer).not.toHaveClass(/open/);

    await page.locator('.nav__burger').click();
    await expect(drawer).toHaveClass(/open/);
    await expect(drawer.locator('a', { hasText: 'Store' })).toBeVisible();

    await drawer.locator('a', { hasText: 'Store' }).click();
    await expect(page).toHaveURL(/\/store\/?$/);
    await expect(drawer).not.toHaveClass(/open/);
  });

  test('store drawer exposes a Cart entry that opens the cart on mobile', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'mobile drawer only');

    await page.goto('/store');
    const drawer = page.locator('.drawer');

    // add an item, then close the cart - simulating a user who wants it back
    await page.locator('.product__add[data-id="vinyl"]').click();
    await expect(page.locator('.cart')).toHaveClass(/open/);
    await page.locator('.cart__close').click();
    await expect(page.locator('.cart')).not.toHaveClass(/open/);

    // reopen via the new drawer Cart entry
    await page.locator('.nav__burger').click();
    await expect(drawer).toHaveClass(/open/);
    await expect(drawer.locator('.drawer__cart .count')).toHaveText('1');
    await drawer.locator('.drawer__cart').click();

    await expect(drawer).not.toHaveClass(/open/);
    await expect(page.locator('.cart')).toHaveClass(/open/);
    await expect(page.locator('.cart-item', { hasText: 'HERE.AFTER LP' })).toBeVisible();
  });
});

test.describe('newsletter (mock - must NOT fake success)', () => {
  test('submitting does not show a fake success message and stays on page', async ({ page }) => {
    await page.goto('/');
    const form = page.locator('.signup form');
    await form.locator('input[type="email"]').fill('fan@example.com');
    await form.locator('button[type="submit"]').click();

    // Per the handoff: no fake "You're on the list" confirmation in production.
    await expect(page.locator('.signup .ok')).toHaveCount(0);
    await expect(form).toBeVisible();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('reveal elements are visible without scrolling when motion is reduced', async ({ page }) => {
    await page.goto('/');
    const firstReveal = page.locator('.reveal').first();
    await expect(firstReveal).toHaveCSS('opacity', '1');
  });
});
