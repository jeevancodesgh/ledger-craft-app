import { test, expect } from '@playwright/test';

// Test data
const businessData = {
  businessName: 'Acme Corporation',
  businessEmail: 'contact@acme.com',
  country: 'United States',
  address: '123 Main Street',
  city: 'San Francisco',
  state: 'CA',
  zip: '94105',
  taxRate: '8.5'
};

test.describe('Direct Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user state by setting up the auth context
    await page.addInitScript(() => {
      // Mock Supabase client
      window.mockSupabaseSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' }
        },
        access_token: 'mock-access-token'
      };
      
      // Mock localStorage auth data
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: window.mockSupabaseSession,
        expiresAt: Date.now() + 3600000
      }));
    });

    // Mock auth API responses
    await page.route('**/auth/v1/**', async route => {
      const url = route.request().url();
      
      if (url.includes('/user')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: { full_name: 'Test User' }
          })
        });
      } else {
        await route.continue();
      }
    });

    // Mock business profile check (user hasn't completed onboarding)
    await page.route('**/business-profile*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Business profile not found' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/onboarding');
  });

  test('should complete the full onboarding flow', async ({ page }) => {
    console.log('🎯 Testing complete onboarding flow...');

    // === STEP 1: WELCOME ===
    console.log('📋 Step 1: Welcome step');
    
    // Check welcome step loads
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
    
    // Fill required fields
    await page.getByPlaceholder(/business name/i).fill(businessData.businessName);
    await page.getByPlaceholder(/business email/i).fill(businessData.businessEmail);
    
    // Select country from dropdown
    await page.getByRole('button', { name: /select country/i }).click();
    await page.getByText(businessData.country, { exact: false }).click();
    
    // Proceed to next step
    await page.getByRole('button', { name: /next/i }).click();
    
    // === STEP 2: INVOICE SETUP ===
    console.log('🧾 Step 2: Invoice setup');
    
    // Wait for invoice setup step to load
    await expect(page.getByRole('heading', { name: /invoice setup/i })).toBeVisible();
    
    // Fill optional invoice setup fields
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
    
    // Proceed to branding step
    await page.getByRole('button', { name: /next/i }).click();
    
    // === STEP 3: BRANDING ===
    console.log('🎨 Step 3: Branding');
    
    // Wait for branding step to load
    await expect(page.getByRole('heading', { name: /branding/i })).toBeVisible();
    
    // Select a theme
    const blueTheme = page.locator('[data-theme="blue"]');
    if (await blueTheme.isVisible()) {
      await blueTheme.click();
    }
    
    // Mock business profile creation for completion
    await page.route('**/business-profile*', async route => {
      if (route.request().method() === 'POST' || route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'business-profile-id',
            business_name: businessData.businessName,
            business_email: businessData.businessEmail,
            country: businessData.country,
            theme: 'blue'
          })
        });
      } else {
        await route.continue();
      }
    });
    
    // Complete onboarding
    await page.getByRole('button', { name: /complete/i }).click();
    
    // Wait for completion
    await page.waitForTimeout(2000);
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/$/);
    
    console.log('🎉 Onboarding completed successfully!');
  });

  test('should validate required fields in welcome step', async ({ page }) => {
    console.log('🔍 Testing welcome step validation...');
    
    // Try to proceed without filling fields
    await page.getByRole('button', { name: /next/i }).click();
    
    // Should show validation errors
    await expect(page.getByText(/business name.*required/i)).toBeVisible();
    await expect(page.getByText(/business email.*required/i)).toBeVisible();
    await expect(page.getByText(/country.*required/i)).toBeVisible();
    
    console.log('✅ Validation works correctly');
  });

  test('should allow back navigation with data preservation', async ({ page }) => {
    console.log('⏪ Testing back navigation...');
    
    // Complete welcome step
    await page.getByPlaceholder(/business name/i).fill(businessData.businessName);
    await page.getByPlaceholder(/business email/i).fill(businessData.businessEmail);
    await page.getByRole('button', { name: /select country/i }).click();
    await page.getByText(businessData.country, { exact: false }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Fill some invoice setup data
    await page.getByPlaceholder(/tax rate/i).fill(businessData.taxRate);
    await page.getByRole('button', { name: /next/i }).click();
    
    // Go back to invoice setup
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page.getByRole('heading', { name: /invoice setup/i })).toBeVisible();
    
    // Data should be preserved
    await expect(page.getByPlaceholder(/tax rate/i)).toHaveValue(businessData.taxRate);
    
    // Go back to welcome
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
    
    // Welcome data should be preserved
    await expect(page.getByPlaceholder(/business name/i)).toHaveValue(businessData.businessName);
    await expect(page.getByPlaceholder(/business email/i)).toHaveValue(businessData.businessEmail);
    
    console.log('✅ Back navigation preserves data correctly');
  });

  test('should handle onboarding completion errors', async ({ page }) => {
    console.log('❌ Testing error handling...');
    
    // Navigate through all steps
    await page.getByPlaceholder(/business name/i).fill(businessData.businessName);
    await page.getByPlaceholder(/business email/i).fill(businessData.businessEmail);
    await page.getByRole('button', { name: /select country/i }).click();
    await page.getByText(businessData.country, { exact: false }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Mock error response for business profile creation
    await page.route('**/business-profile*', async route => {
      if (route.request().method() === 'POST' || route.request().method() === 'PUT') {
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
    
    // Try to complete
    await page.getByRole('button', { name: /complete/i }).click();
    
    // Should show error message (toast or inline)
    const errorMessage = page.getByText(/error/i);
    await expect(errorMessage).toBeVisible();
    
    // Should stay on onboarding page
    await expect(page).toHaveURL(/\/onboarding/);
    
    console.log('✅ Error handling works correctly');
  });

  test('should be responsive on mobile', async ({ page }) => {
    console.log('📱 Testing mobile responsiveness...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if onboarding is usable on mobile
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
    await expect(page.getByPlaceholder(/business name/i)).toBeVisible();
    
    // Test form interaction
    await page.getByPlaceholder(/business name/i).fill(businessData.businessName);
    await expect(page.getByPlaceholder(/business name/i)).toHaveValue(businessData.businessName);
    
    console.log('✅ Mobile responsiveness verified');
  });
});