import { expect, test } from '@playwright/test';

test('landing page renders and allows navigation to dashboard route', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/OpenMind/i);

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard/);
});

test('profile page is reachable', async ({ page }) => {
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/profile/);
});
