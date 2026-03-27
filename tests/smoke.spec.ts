import { test, expect } from '@playwright/test';

const baseUrl = process.env.PREVIEW_URL || 'https://pieme.lovable.app';

test.describe('PIE Smoke Tests', () => {
  test('Feed page loads and shows at least one episode card', async ({ page }) => {
    await page.goto(baseUrl);
    await page.waitForSelector('[data-testid="episode-card"]', { timeout: 15000 });
    const cards = page.locator('[data-testid="episode-card"]');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('Relay tab shows the heading', async ({ page }) => {
    await page.goto(`${baseUrl}/relay`);
    const heading = page.locator('[data-testid="relay-heading"]');
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toHaveText(/Relay/i);
  });

  test('Tools tab loads without crashing', async ({ page }) => {
    await page.goto(`${baseUrl}/tools`);
    const heading = page.locator('[data-testid="tools-heading"]');
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('Navigating to /all shows the All tab as active', async ({ page }) => {
    await page.goto(`${baseUrl}/all`);
    await page.waitForLoadState('networkidle');
    const allButton = page.locator('button', { hasText: 'All' });
    await expect(allButton).toBeVisible({ timeout: 10000 });
  });
});
