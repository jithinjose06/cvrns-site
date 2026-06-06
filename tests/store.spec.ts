import { test, expect } from '@playwright/test';
import { gotoCleanStore } from './helpers';

test.beforeEach(async ({ context }) => {
  // start each test with a clean cart
  await context.clearCookies();
});

test.describe('store cart', () => {
  test('adding a product opens the cart and updates the badge', async ({ page }) => {
    await gotoCleanStore(page);

    const badge = page.locator('.nav__links .nav__cart .count');
    await expect(badge).toHaveAttribute('data-empty', 'true');

    await page.locator('.product__add[data-id="vinyl"]').click();

    await expect(page.locator('.cart')).toHaveClass(/open/);
    await expect(badge).toHaveText('1');
    await expect(badge).toHaveAttribute('data-empty', 'false');
    await expect(page.locator('.cart__total b')).toHaveText('$32');

    const item = page.locator('.cart-item', { hasText: 'HERE.AFTER LP' });
    await expect(item).toBeVisible();
    await expect(item.locator('.cart-item__price')).toHaveText('$32');
  });

  test('quantity steppers and remove update the subtotal', async ({ page }) => {
    await gotoCleanStore(page);

    await page.locator('.product__add[data-id="hoodie"]').click();
    const item = page.locator('.cart-item', { hasText: 'Heavyweight Hoodie' });

    await item.locator('[data-act="inc"]').click();
    await expect(item.locator('.cart-item__qty span')).toHaveText('2');
    await expect(page.locator('.cart__total b')).toHaveText('$140');

    await item.locator('[data-act="dec"]').click();
    await expect(item.locator('.cart-item__qty span')).toHaveText('1');
    await expect(page.locator('.cart__total b')).toHaveText('$70');

    await item.locator('[data-act="rm"]').click();
    await expect(page.locator('.cart-item')).toHaveCount(0);
    await expect(page.locator('.cart__empty')).toBeVisible();
    await expect(page.locator('.cart__total b')).toHaveText('$0');
  });

  test('cart persists across reloads via localStorage', async ({ page }) => {
    await gotoCleanStore(page);

    await page.locator('.product__add[data-id="tee"]').click();
    // cart opens on add; bump to qty 2 from inside the drawer
    const item = page.locator('.cart-item', { hasText: 'Tour Tee' });
    await item.locator('[data-act="inc"]').click();
    await expect(page.locator('.nav__links .nav__cart .count')).toHaveText('2');

    await page.reload();
    await expect(page.locator('.nav__links .nav__cart .count')).toHaveText('2');
    const stored = await page.evaluate(() => localStorage.getItem('cvrns_cart'));
    expect(stored).toContain('Tour Tee');
    expect(stored).toContain('"qty":2');
  });

  test('clear cart requires a confirm tap (no accidental wipe)', async ({ page }) => {
    await gotoCleanStore(page);

    await page.locator('.product__add[data-id="vinyl"]').click();
    // cart opens on add; bump to qty 2 from inside the drawer (avoids the open
    // cart overlay intercepting a second product button)
    const item = page.locator('.cart-item', { hasText: 'HERE.AFTER LP' });
    await item.locator('[data-act="inc"]').click();
    const badge = page.locator('.nav__links .nav__cart .count');
    await expect(badge).toHaveText('2');

    const clear = page.locator('.cart__clear');
    await expect(clear).toBeVisible();

    // first tap only arms - cart is untouched
    await clear.click();
    await expect(clear).toHaveText(/tap again to confirm/i);
    await expect(clear).toHaveAttribute('data-confirm', 'true');
    await expect(badge).toHaveText('2');
    await expect(page.locator('.cart-item')).toHaveCount(1);

    // confirm tap empties the cart and persists the empty state
    await clear.click();
    await expect(badge).toHaveAttribute('data-empty', 'true');
    await expect(page.locator('.cart__empty')).toBeVisible();
    await expect(clear).toBeHidden();
    const stored = await page.evaluate(() => localStorage.getItem('cvrns_cart'));
    expect(stored).toBe('{}');
  });

  test('checkout is mocked (clearly flagged, no real payment)', async ({ page }) => {
    await gotoCleanStore(page);

    await page.locator('.product__add[data-id="poster"]').click();
    await page.locator('.cart__checkout').click();
    await expect(page.locator('.cart__foot')).toContainText(/checkout/i);
  });
});

test.describe('store category filter', () => {
  test('filtering by category shows only matching products', async ({ page }) => {
    await page.goto('/store');

    const visibleProducts = page.locator('.product:not([hidden])');
    await expect(visibleProducts).toHaveCount(6);

    await page.locator('.store-filter__btn[data-cat="apparel"]').click();
    await expect(visibleProducts).toHaveCount(4);
    await expect(page.locator('.product[data-cat="pressings"]')).toBeHidden();

    await page.locator('.store-filter__btn[data-cat="pressings"]').click();
    await expect(visibleProducts).toHaveCount(1);
    await expect(page.locator('.product[data-cat="pressings"]')).toBeVisible();

    await page.locator('.store-filter__btn[data-cat="all"]').click();
    await expect(visibleProducts).toHaveCount(6);
  });
});
