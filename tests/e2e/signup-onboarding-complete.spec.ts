import { test, expect } from '@playwright/test';
import { AuthMocker } from './auth-utils';

// Test data
const testUser = {
  fullName: 'John Doe',
  email: 'john.doe@example.com',
  password: 'SecurePass123!',
  confirmPassword: 'SecurePass123!'
};

const businessData = {
  businessName: 'Acme Corporation',
  businessEmail: 'contact@acme.com',
  country: 'United States',
  address: '123 Business Street',
  city: 'San Francisco',
  state: 'CA',
  zip: '94105',
  taxRate: '8.5'
};

test.describe('Complete Sign-up to Onboarding Flow', () => {
  let authMocker: AuthMocker;

  test.beforeEach(async ({ page }) => {
    authMocker = new AuthMocker(page);
  });

  test('should complete immediate sign-up and onboarding flow', async ({ page }) => {
    console.log('🚀 Testing immediate sign-up to onboarding flow...');

    // Set up immediate authentication mock
    await authMocker.mockImmediateAuth({
      email: testUser.email,
      fullName: testUser.fullName
    });

    // Navigate to signup page
    await page.goto('/signup');
    await expect(page).toHaveTitle(/Invoice Generator/);

    // === SIGN-UP PHASE ===
    console.log('📝 Phase 1: Sign-up form');
    
    // Fill out signup form
    await page.locator('input[name="fullName"]').fill(testUser.fullName);
    await page.locator('input[name="email"]').fill(testUser.email);
    await page.locator('input[name="password"]').fill(testUser.password);
    await page.locator('input[name="confirmPassword"]').fill(testUser.confirmPassword);
    await page.getByRole('checkbox').check();

    // Submit signup form
    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to onboarding
    console.log('✅ Checking redirect to onboarding...');
    await page.waitForURL(/\/onboarding/, { timeout: 10000 });

    // === ONBOARDING PHASE ===
    console.log('🎯 Phase 2: Onboarding flow');

    // Verify onboarding page loads
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();

    // === STEP 1: WELCOME ===
    console.log('📋 Step 1: Welcome');
    
    // Fill welcome step
    await page.getByPlaceholder(/business name/i).fill(businessData.businessName);
    await page.getByPlaceholder(/business email/i).fill(businessData.businessEmail);
    
    // Select country
    await page.getByRole('button', { name: /select country/i }).click();
    await page.getByText(businessData.country).click();
    
    // Proceed to next step
    await page.getByRole('button', { name: /next/i }).click();

    // === STEP 2: INVOICE SETUP ===
    console.log('🧾 Step 2: Invoice setup');
    
    // Verify we're on invoice setup
    await expect(page.getByRole('heading', { name: /invoice setup/i })).toBeVisible();
    
    // Fill invoice setup fields (all optional)
    if (await page.getByPlaceholder(/tax rate/i).isVisible()) {
      await page.getByPlaceholder(/tax rate/i).fill(businessData.taxRate);
    }
    
    if (await page.getByPlaceholder(/street address/i).isVisible()) {
      await page.getByPlaceholder(/street address/i).fill(businessData.address);
    }
    
    if (await page.getByPlaceholder(/city/i).isVisible()) {
      await page.getByPlaceholder(/city/i).fill(businessData.city);
    }
    
    if (await page.getByPlaceholder(/state/i).isVisible()) {
      await page.getByPlaceholder(/state/i).fill(businessData.state);
    }
    
    if (await page.getByPlaceholder(/zip/i).isVisible()) {
      await page.getByPlaceholder(/zip/i).fill(businessData.zip);
    }
    
    // Proceed to branding
    await page.getByRole('button', { name: /next/i }).click();

    // === STEP 3: BRANDING ===
    console.log('🎨 Step 3: Branding');
    
    // Verify we're on branding step
    await expect(page.getByRole('heading', { name: /branding/i })).toBeVisible();
    
    // Select a theme
    const blueTheme = page.locator('[data-theme="blue"]');
    if (await blueTheme.isVisible()) {
      await blueTheme.click();
    }
    
    // Complete onboarding
    await page.getByRole('button', { name: /complete/i }).click();

    // === POST-ONBOARDING ===
    console.log('🏁 Phase 3: Completion');

    // Wait for completion processing
    await page.waitForTimeout(2000);
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
    
    console.log('🎉 Complete flow successful!');
  });

  test('should handle sign-up requiring email confirmation', async ({ page }) => {
    console.log('📧 Testing email confirmation required flow...');

    // Set up email confirmation required mock
    await authMocker.mockEmailConfirmationRequired({
      email: 'jane.doe@example.com',
      fullName: 'Jane Doe'
    });

    // Navigate to signup
    await page.goto('/signup');

    // Fill signup form
    await page.locator('input[name="fullName"]').fill('Jane Doe');
    await page.locator('input[name="email"]').fill('jane.doe@example.com');
    await page.locator('input[name="password"]').fill('SecurePass123!');
    await page.locator('input[name="confirmPassword"]').fill('SecurePass123!');
    await page.getByRole('checkbox').check();

    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to login with message
    await page.waitForURL(/\/login/, { timeout: 10000 });
    
    // Should show confirmation message (look for the toast specifically)
    await expect(page.locator('[data-lov-name="ToastTitle"]', { hasText: /account created/i })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-lov-name="ToastDescription"]', { hasText: /check your email/i })).toBeVisible();
    
    // Email should be pre-filled
    await expect(page.locator('input[name="email"]')).toHaveValue('jane.doe@example.com');

    console.log('✅ Email confirmation flow works correctly');
  });

  test('should validate required fields in onboarding welcome step', async ({ page }) => {
    console.log('🔍 Testing onboarding validation...');

    // Set up authentication and navigate to onboarding directly
    await authMocker.mockImmediateAuth();
    await page.goto('/onboarding');

    // Should be on welcome step
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();

    // Try to proceed without filling required fields
    await page.getByRole('button', { name: /next/i }).click();

    // Should show validation errors
    await expect(page.getByText(/business name.*required/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/business email.*required/i)).toBeVisible();
    await expect(page.getByText(/country.*required/i)).toBeVisible();

    // Should stay on welcome step
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();

    console.log('✅ Validation works correctly');
  });

  test('should allow back navigation with data preservation', async ({ page }) => {
    console.log('⏪ Testing back navigation...');

    // Set up authentication and navigate to onboarding
    await authMocker.mockImmediateAuth();
    await page.goto('/onboarding');

    // Fill welcome step
    await page.getByPlaceholder(/business name/i).fill(businessData.businessName);
    await page.getByPlaceholder(/business email/i).fill(businessData.businessEmail);
    await page.getByRole('button', { name: /select country/i }).click();
    await page.getByText(businessData.country).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Fill some invoice setup data
    if (await page.getByPlaceholder(/tax rate/i).isVisible()) {
      await page.getByPlaceholder(/tax rate/i).fill(businessData.taxRate);
    }
    await page.getByRole('button', { name: /next/i }).click();

    // Should be on branding step
    await expect(page.getByRole('heading', { name: /branding/i })).toBeVisible();

    // Go back to invoice setup
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page.getByRole('heading', { name: /invoice setup/i })).toBeVisible();

    // Go back to welcome
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();

    // Data should be preserved
    await expect(page.getByPlaceholder(/business name/i)).toHaveValue(businessData.businessName);
    await expect(page.getByPlaceholder(/business email/i)).toHaveValue(businessData.businessEmail);

    console.log('✅ Back navigation preserves data correctly');
  });

  test('should handle onboarding completion errors gracefully', async ({ page }) => {
    console.log('❌ Testing error handling...');

    // Set up authentication
    await authMocker.mockImmediateAuth();
    await page.goto('/onboarding');

    // Navigate through all steps quickly
    await page.getByPlaceholder(/business name/i).fill(businessData.businessName);
    await page.getByPlaceholder(/business email/i).fill(businessData.businessEmail);
    await page.getByRole('button', { name: /select country/i }).click();
    await page.getByText(businessData.country).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Mock error response for business profile creation
    await page.route('**/rest/v1/business_profiles**', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Failed to create business profile'
          })
        });
      } else {
        await route.continue();
      }
    });

    // Try to complete onboarding
    await page.getByRole('button', { name: /complete/i }).click();

    // Should show error message
    await expect(page.getByText(/error/i)).toBeVisible({ timeout: 5000 });

    // Should stay on onboarding
    await expect(page).toHaveURL(/\/onboarding/);

    console.log('✅ Error handling works correctly');
  });
});