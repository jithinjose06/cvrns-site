import type { Page } from '@playwright/test';

/**
 * Load the store with a guaranteed-empty cart: clear the persisted state, then
 * reload so the page boots from clean localStorage.
 */
export async function gotoCleanStore(page: Page): Promise<void> {
  await page.goto('/store');
  await page.evaluate(() => localStorage.removeItem('cvrns_cart'));
  await page.reload();
}
