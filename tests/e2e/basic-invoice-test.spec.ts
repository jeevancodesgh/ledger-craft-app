import { test, expect } from '@playwright/test';
import { AuthMocker } from './auth-utils';

test.describe('Basic Invoice Tests', () => {
  test('can navigate to create invoice page', async ({ page }) => {
    const authMocker = new AuthMocker(page);
    await authMocker.mockCompletedOnboarding();

    // Navigate to create invoice page
    await page.goto('/invoices/create');

    // Wait for any text indicating the page loaded
    await expect(page.locator('body')).toContainText('Invoice');
  });
});