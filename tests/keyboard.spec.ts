import { test, expect } from '@playwright/test';
import { gotoCleanStore } from './helpers';

test.describe('cart keyboard & focus management', () => {
  test.beforeEach(async ({ page }) => {
    await gotoCleanStore(page);
  });

  test('add-to-cart works via keyboard (Enter)', async ({ page }) => {
    const add = page.locator('.product__add[data-id="vinyl"]');
    await add.focus();
    await expect(add).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('.cart')).toHaveClass(/open/);
    await expect(page.locator('.cart-item', { hasText: 'HERE.AFTER LP' })).toBeVisible();
  });

  test('opening the cart moves focus into the panel', async ({ page }) => {
    await page.locator('.product__add[data-id="vinyl"]').click();
    await expect(page.locator('.cart__close')).toBeFocused();
  });

  test('Tab is trapped within the open cart panel', async ({ page }) => {
    await page.locator('.product__add[data-id="vinyl"]').click();
    await expect(page.locator('.cart__close')).toBeFocused();

    for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
    const insidePanel = await page.evaluate(
      () => !!document.activeElement?.closest('.cart__panel')
    );
    expect(insidePanel).toBe(true);

    // Shift+Tab also stays inside
    for (let i = 0; i < 3; i++) await page.keyboard.press('Shift+Tab');
    const stillInside = await page.evaluate(
      () => !!document.activeElement?.closest('.cart__panel')
    );
    expect(stillInside).toBe(true);
  });

  test('Escape closes the cart and returns focus to the trigger', async ({ page }) => {
    const add = page.locator('.product__add[data-id="vinyl"]');
    await add.click();
    await expect(page.locator('.cart')).toHaveClass(/open/);

    await page.keyboard.press('Escape');
    await expect(page.locator('.cart')).not.toHaveClass(/open/);
    await expect(add).toBeFocused();
  });
});

test.describe('mobile drawer keyboard & focus management', () => {
  test('opens with focus inside, traps Tab, Escape restores focus to the burger', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'hamburger only renders on mobile widths');

    await page.goto('/');
    const burger = page.locator('.nav__burger');
    await burger.click();

    const drawer = page.locator('.drawer');
    await expect(drawer).toHaveClass(/open/);
    await expect(page.locator('.drawer__close')).toBeFocused();

    for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
    const insideDrawer = await page.evaluate(() => !!document.activeElement?.closest('.drawer'));
    expect(insideDrawer).toBe(true);

    await page.keyboard.press('Escape');
    await expect(drawer).not.toHaveClass(/open/);
    await expect(burger).toBeFocused();
  });
});
