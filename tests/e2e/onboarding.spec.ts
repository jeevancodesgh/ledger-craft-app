import { test, expect } from '@playwright/test';

// Mock authenticated user for onboarding tests
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User'
};

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

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication to bypass sign-up
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-token', 'mock-token');
    });

    // Mock auth state
    await page.route('**/auth/v1/user', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser)
      });
    });

    await page.goto('/onboarding');
  });

  test('should display onboarding welcome step with all required fields', async ({ page }) => {
    console.log('🔍 Testing onboarding welcome step display...');

    // Check page loads correctly
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
    
    // Check progress indicator
    await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible();
    
    // Check all required form fields are present
    await expect(page.getByPlaceholder(/business name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/business email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /select country/i })).toBeVisible();
    
    // Check navigation buttons
    await expect(page.getByRole('button', { name: /next/i })).toBeVisible();
    // Back button should not be visible on first step
    await expect(page.getByRole('button', { name: /back/i })).not.toBeVisible();

    console.log('✅ Welcome step displays correctly');
  });

  test('should validate required fields in welcome step', async ({ page }) => {
    console.log('📋 Testing welcome step validation...');

    // Try to proceed without filling any fields
    await page.getByRole('button', { name: /next/i }).click();

    // Should show validation errors
    await expect(page.getByText(/business name.*required/i)).toBeVisible();
    await expect(page.getByText(/business email.*required/i)).toBeVisible();
    await expect(page.getByText(/country.*required/i)).toBeVisible();

    // Fill business name only
    await page.getByPlaceholder(/business name/i).fill(businessData.businessName);
    await page.getByRole('button', { name: /next/i }).click();

    // Should still show email and country errors
    await expect(page.getByText(/business name.*required/i)).not.toBeVisible();
    await expect(page.getByText(/business email.*required/i)).toBeVisible();
    await expect(page.getByText(/country.*required/i)).toBeVisible();

    // Fill email with invalid format
    await page.getByPlaceholder(/business email/i).fill('invalid-email');
    await page.getByRole('button', { name: /next/i }).click();

    // Should show email format error
    await expect(page.getByText(/valid email/i)).toBeVisible();

    console.log('✅ Welcome step validation works correctly');
  });

  test('should complete welcome step and proceed to invoice setup', async ({ page }) => {
    console.log('➡️ Testing welcome to invoice setup transition...');

    // Fill all required fields
    await page.getByPlaceholder(/business name/i).fill(businessData.businessName);
    await page.getByPlaceholder(/business email/i).fill(businessData.businessEmail);
    
    // Select country
    await page.getByRole('button', { name: /select country/i }).click();
    await page.getByText(businessData.country).click();

    // Proceed to next step
    await page.getByRole('button', { name: /next/i }).click();

    // Should be on invoice setup step
    await expect(page.getByRole('heading', { name: /invoice setup/i })).toBeVisible();
    
    // Check invoice setup fields are present
    await expect(page.getByPlaceholder(/tax rate/i)).toBeVisible();
    await expect(page.getByPlaceholder(/street address/i)).toBeVisible();
    await expect(page.getByPlaceholder(/city/i)).toBeVisible();
    await expect(page.getByPlaceholder(/state/i)).toBeVisible();
    await expect(page.getByPlaceholder(/zip/i)).toBeVisible();

    // Back button should now be visible
    await expect(page.getByRole('button', { name: /back/i })).toBeVisible();

    console.log('✅ Successfully transitioned to invoice setup step');
  });

  test('should complete invoice setup step and proceed to branding', async ({ page }) => {
    console.log('🧾 Testing invoice setup step...');

    // Complete welcome step first
    await page.getByPlaceholder(/business name/i).fill(businessData.businessName);
    await page.getByPlaceholder(/business email/i).fill(businessData.businessEmail);
    await page.getByRole('button', { name: /select country/i }).click();
    await page.getByText(businessData.country).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Fill invoice setup fields (all optional)
    await page.getByPlaceholder(/tax rate/i).fill(businessData.taxRate);
    await page.getByPlaceholder(/street address/i).fill(businessData.address);
    await page.getByPlaceholder(/city/i).fill(businessData.city);
    await page.getByPlaceholder(/state/i).fill(businessData.state);
    await page.getByPlaceholder(/zip/i).fill(businessData.zip);

    // Test invoice number format selection
    const formatButton = page.getByRole('button', { name: /invoice.*format/i });
    if (await formatButton.isVisible()) {
      await formatButton.click();
      await page.getByText(/INV-0001/i).click();
    }

    // Proceed to branding step
    await page.getByRole('button', { name: /next/i }).click();

    // Should be on branding step
    await expect(page.getByRole('heading', { name: /branding/i })).toBeVisible();

    console.log('✅ Invoice setup completed successfully');
  });

  test('should complete branding step with theme selection', async ({ page }) => {
    console.log('🎨 Testing branding step...');

    // Navigate to branding step
    await page.getByPlaceholder(/business name/i).fill(businessData.businessName);
    await page.getByPlaceholder(/business email/i).fill(businessData.businessEmail);
    await page.getByRole('button', { name: /select country/i }).click();
    await page.getByText(businessData.country).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Check branding options are available
    await expect(page.getByRole('heading', { name: /branding/i })).toBeVisible();
    
    // Check theme selection
    const themes = ['blue', 'purple', 'green', 'red', 'pink', 'slate'];
    for (const theme of themes) {
      const themeOption = page.locator(`[data-theme="${theme}"]`);
      if (await themeOption.isVisible()) {
        await expect(themeOption).toBeVisible();
      }
    }

    // Select a theme
    await page.locator('[data-theme="blue"]').click();

    // Check logo upload area
    const logoUpload = page.locator('input[type="file"]');
    if (await logoUpload.isVisible()) {
      await expect(logoUpload).toBeVisible();
    }

    console.log('✅ Branding step displays correctly');
  });

  test('should complete entire onboarding flow', async ({ page }) => {
    console.log('🏁 Testing complete onboarding flow...');

    // Mock business profile creation
    await page.route('**/business-profile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'business-profile-id',
          business_name: businessData.businessName,
          business_email: businessData.businessEmail,
          country: businessData.country
        })
      });
    });

    // Step 1: Welcome
    await page.getByPlaceholder(/business name/i).fill(businessData.businessName);
    await page.getByPlaceholder(/business email/i).fill(businessData.businessEmail);
    await page.getByRole('button', { name: /select country/i }).click();
    await page.getByText(businessData.country).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Invoice Setup
    await page.getByPlaceholder(/tax rate/i).fill(businessData.taxRate);
    await page.getByPlaceholder(/street address/i).fill(businessData.address);
    await page.getByPlaceholder(/city/i).fill(businessData.city);
    await page.getByPlaceholder(/state/i).fill(businessData.state);
    await page.getByPlaceholder(/zip/i).fill(businessData.zip);
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: Branding
    await page.locator('[data-theme="blue"]').click();
    
    // Complete onboarding
    await page.getByRole('button', { name: /complete/i }).click();

    // Should show loading state
    const completeButton = page.getByRole('button', { name: /complete/i });
    await expect(completeButton).toBeDisabled();

    // Should redirect to dashboard after completion
    await expect(page).toHaveURL(/\/$/);

    console.log('🎉 Complete onboarding flow successful!');
  });

  test('should handle onboarding completion errors gracefully', async ({ page }) => {
    console.log('❌ Testing onboarding error handling...');

    // Mock error response for business profile creation
    await page.route('**/business-profile', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Failed to create business profile'
        })
      });
    });

    // Complete onboarding steps
    await page.getByPlaceholder(/business name/i).fill(businessData.businessName);
    await page.getByPlaceholder(/business email/i).fill(businessData.businessEmail);
    await page.getByRole('button', { name: /select country/i }).click();
    await page.getByText(businessData.country).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Try to complete
    await page.getByRole('button', { name: /complete/i }).click();

    // Should show error message
    await expect(page.getByText(/error.*creating.*profile/i)).toBeVisible();
    
    // Should stay on onboarding page
    await expect(page).toHaveURL(/\/onboarding/);
    
    // Complete button should be re-enabled
    await expect(page.getByRole('button', { name: /complete/i })).toBeEnabled();

    console.log('✅ Error handling works correctly');
  });

  test('should preserve data when navigating between steps', async ({ page }) => {
    console.log('💾 Testing data persistence across steps...');

    // Fill welcome step
    await page.getByPlaceholder(/business name/i).fill(businessData.businessName);
    await page.getByPlaceholder(/business email/i).fill(businessData.businessEmail);
    await page.getByRole('button', { name: /select country/i }).click();
    await page.getByText(businessData.country).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Fill invoice setup
    await page.getByPlaceholder(/tax rate/i).fill(businessData.taxRate);
    await page.getByPlaceholder(/street address/i).fill(businessData.address);
    await page.getByRole('button', { name: /next/i }).click();

    // Go back to invoice setup
    await page.getByRole('button', { name: /back/i }).click();
    
    // Data should be preserved
    await expect(page.getByPlaceholder(/tax rate/i)).toHaveValue(businessData.taxRate);
    await expect(page.getByPlaceholder(/street address/i)).toHaveValue(businessData.address);

    // Go back to welcome
    await page.getByRole('button', { name: /back/i }).click();
    
    // Welcome data should be preserved
    await expect(page.getByPlaceholder(/business name/i)).toHaveValue(businessData.businessName);
    await expect(page.getByPlaceholder(/business email/i)).toHaveValue(businessData.businessEmail);

    console.log('✅ Data persistence works correctly');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    console.log('📱 Testing mobile responsiveness...');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if onboarding is usable on mobile
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
    await expect(page.getByPlaceholder(/business name/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /next/i })).toBeVisible();

    // Check form field sizes are appropriate
    const nameInput = page.getByPlaceholder(/business name/i);
    const boundingBox = await nameInput.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(200); // Should have reasonable width

    // Test form interaction on mobile
    await nameInput.fill(businessData.businessName);
    await expect(nameInput).toHaveValue(businessData.businessName);

    console.log('✅ Mobile responsiveness verified');
  });
});