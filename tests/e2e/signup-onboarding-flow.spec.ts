import { test, expect } from '@playwright/test';

// Test data for complete flow
const testUser = {
  fullName: 'John Doe',
  email: `test+${Date.now()}@example.com`,
  password: 'SecurePass123',
  confirmPassword: 'SecurePass123'
};

const businessData = {
  businessName: 'Acme Corp',
  businessEmail: 'contact@acme.com',
  country: 'United States',
  address: '123 Business St',
  city: 'San Francisco',
  state: 'CA',
  zip: '94105',
  taxRate: '8.5'
};

test.describe('Complete Sign-up to Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto('/signup');
    await expect(page).toHaveTitle(/Invoice Generator/);
  });

  test('should complete full sign-up and onboarding flow successfully', async ({ page }) => {
    console.log('🚀 Starting complete sign-up to onboarding flow...');

    // === SIGN-UP PHASE ===
    console.log('📝 Phase 1: Sign-up form completion');
    
    // Fill sign-up form
    await page.locator('input[name="fullName"]').fill(testUser.fullName);
    await page.locator('input[name="email"]').fill(testUser.email);
    await page.locator('input[name="password"]').fill(testUser.password);
    await page.locator('input[name="confirmPassword"]').fill(testUser.confirmPassword);
    await page.getByRole('checkbox').check();

    // Mock successful sign-up response with immediate authentication (no email confirmation needed)
    await page.route('**/auth/v1/signup', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: testUser.email,
            user_metadata: { full_name: testUser.fullName },
            email_confirmed_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString()
          },
          session: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            user: {
              id: 'test-user-id',
              email: testUser.email,
              user_metadata: { full_name: testUser.fullName }
            }
          }
        })
      });
    });

    // Mock auth session for authenticated requests
    await page.route('**/auth/v1/user', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user-id',
          email: testUser.email,
          user_metadata: { full_name: testUser.fullName }
        })
      });
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

    // Submit sign-up form
    await page.getByRole('button', { name: /create account/i }).click();

    // Wait for authentication to process
    await page.waitForTimeout(1000);

    // Should redirect to onboarding
    console.log('✅ Sign-up completed, checking redirect to onboarding...');
    await expect(page).toHaveURL(/\/onboarding/);

    // === ONBOARDING PHASE ===
    console.log('🎯 Phase 2: Onboarding flow');

    // Check onboarding page loads
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
    
    // === STEP 1: WELCOME ===
    console.log('📋 Step 1: Welcome - Business basics');
    
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
    
    // Check we're on invoice setup step
    await expect(page.getByRole('heading', { name: /invoice setup/i })).toBeVisible();
    
    // Fill invoice setup fields
    await page.getByPlaceholder(/tax rate/i).fill(businessData.taxRate);
    await page.getByPlaceholder(/street address/i).fill(businessData.address);
    await page.getByPlaceholder(/city/i).fill(businessData.city);
    await page.getByPlaceholder(/state/i).fill(businessData.state);
    await page.getByPlaceholder(/zip/i).fill(businessData.zip);
    
    // Proceed to next step
    await page.getByRole('button', { name: /next/i }).click();
    
    // === STEP 3: BRANDING ===
    console.log('🎨 Step 3: Branding and theme');
    
    // Check we're on branding step
    await expect(page.getByRole('heading', { name: /branding/i })).toBeVisible();
    
    // Select a theme
    await page.locator('[data-theme="blue"]').click();
    
    // Complete onboarding
    await page.getByRole('button', { name: /complete/i }).click();

    // === POST-ONBOARDING ===
    console.log('🏁 Phase 3: Post-onboarding verification');

    // Mock business profile creation
    await page.route('**/business-profile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'business-profile-id',
          business_name: businessData.businessName,
          business_email: businessData.businessEmail
        })
      });
    });

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/$/);
    
    console.log('🎉 Complete flow successful!');
  });

  test('should handle back navigation through onboarding steps', async ({ page }) => {
    console.log('⏪ Testing back navigation through onboarding...');

    // Complete sign-up first (shortened version)
    await page.locator('input[name="fullName"]').fill(testUser.fullName);
    await page.locator('input[name="email"]').fill(testUser.email);
    await page.locator('input[name="password"]').fill(testUser.password);
    await page.locator('input[name="confirmPassword"]').fill(testUser.confirmPassword);
    await page.getByRole('checkbox').check();

    await page.route('**/auth/v1/signup', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'test-user-id', email: testUser.email }
        })
      });
    });

    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/onboarding/);

    // Navigate forward through steps
    await page.getByPlaceholder(/business name/i).fill(businessData.businessName);
    await page.getByPlaceholder(/business email/i).fill(businessData.businessEmail);
    await page.getByRole('button', { name: /select country/i }).click();
    await page.getByText(businessData.country).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Should be on invoice setup
    await expect(page.getByRole('heading', { name: /invoice setup/i })).toBeVisible();
    
    // Go to branding step
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.getByRole('heading', { name: /branding/i })).toBeVisible();

    // Test back navigation
    await page.getByRole('button', { name: /back/i }).click();
    await expect(page.getByRole('heading', { name: /invoice setup/i })).toBeVisible();

    await page.getByRole('button', { name: /back/i }).click();
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();

    // Data should be preserved
    await expect(page.getByPlaceholder(/business name/i)).toHaveValue(businessData.businessName);
    await expect(page.getByPlaceholder(/business email/i)).toHaveValue(businessData.businessEmail);

    console.log('✅ Back navigation works correctly with data preservation');
  });

  test('should validate required fields in welcome step', async ({ page }) => {
    console.log('🔍 Testing welcome step validation...');

    // Complete sign-up to get to onboarding
    await page.locator('input[name="fullName"]').fill(testUser.fullName);
    await page.locator('input[name="email"]').fill(testUser.email);
    await page.locator('input[name="password"]').fill(testUser.password);
    await page.locator('input[name="confirmPassword"]').fill(testUser.confirmPassword);
    await page.getByRole('checkbox').check();

    await page.route('**/auth/v1/signup', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'test-user-id', email: testUser.email }
        })
      });
    });

    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/onboarding/);

    // Try to proceed without filling required fields
    await page.getByRole('button', { name: /next/i }).click();

    // Should show validation errors
    await expect(page.getByText(/business name.*required/i)).toBeVisible();
    await expect(page.getByText(/business email.*required/i)).toBeVisible();
    await expect(page.getByText(/country.*required/i)).toBeVisible();

    // Should stay on welcome step
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();

    console.log('✅ Welcome step validation works correctly');
  });

  test('should allow skipping optional branding step', async ({ page }) => {
    console.log('⏭️ Testing branding step skip functionality...');

    // Navigate through to branding step (abbreviated)
    await page.locator('input[name="fullName"]').fill(testUser.fullName);
    await page.locator('input[name="email"]').fill(testUser.email);
    await page.locator('input[name="password"]').fill(testUser.password);
    await page.locator('input[name="confirmPassword"]').fill(testUser.confirmPassword);
    await page.getByRole('checkbox').check();

    await page.route('**/auth/v1/signup', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 'test-user-id', email: testUser.email } }) });
    });

    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/onboarding/);

    // Fill welcome step
    await page.getByPlaceholder(/business name/i).fill(businessData.businessName);
    await page.getByPlaceholder(/business email/i).fill(businessData.businessEmail);
    await page.getByRole('button', { name: /select country/i }).click();
    await page.getByText(businessData.country).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Skip invoice setup
    await page.getByRole('button', { name: /next/i }).click();

    // Should be on branding step
    await expect(page.getByRole('heading', { name: /branding/i })).toBeVisible();

    // Skip branding step
    const skipButton = page.getByRole('button', { name: /skip/i });
    if (await skipButton.isVisible()) {
      await skipButton.click();
    } else {
      // If no skip button, just complete without selecting theme
      await page.getByRole('button', { name: /complete/i }).click();
    }

    // Mock business profile creation
    await page.route('**/business-profile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'business-profile-id' })
      });
    });

    // Should complete onboarding
    await expect(page).toHaveURL(/\/$/);

    console.log('✅ Branding step can be skipped successfully');
  });

  test('should handle sign-up with email confirmation required', async ({ page }) => {
    console.log('📧 Testing sign-up with email confirmation flow...');

    // Fill out the signup form
    await page.locator('input[name="fullName"]').fill('Jane Doe');
    await page.locator('input[name="email"]').fill('jane.doe@example.com');
    await page.locator('input[name="password"]').fill('SecurePass123!');
    await page.locator('input[name="confirmPassword"]').fill('SecurePass123!');
    await page.getByRole('checkbox').check();

    // Mock sign-up API call to require email confirmation (no session returned)
    await page.route('**/auth/v1/signup', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'jane.doe@example.com',
            email_confirmed_at: null, // Not confirmed yet
            user_metadata: { full_name: 'Jane Doe' }
          },
          session: null // No session = needs email confirmation
        })
      });
    });

    // Submit the form
    await page.getByRole('button', { name: /create account/i }).click();

    // Should redirect to login with confirmation message
    await page.waitForURL(/\/login/, { timeout: 10000 });
    
    // Should show confirmation message (check for specific text)
    await expect(page.getByText(/account created/i)).toBeVisible();
    await expect(page.getByText(/check your email/i)).toBeVisible();
    
    // Email should be pre-filled
    await expect(page.locator('input[name="email"]')).toHaveValue('jane.doe@example.com');

    console.log('✅ Email confirmation flow works correctly');
  });
});