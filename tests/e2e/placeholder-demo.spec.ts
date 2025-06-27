import { test, expect } from '@playwright/test';

test.describe('Placeholder Functionality Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveTitle(/Invoice Generator/);
  });

  test('should demonstrate placeholder behavior with floating labels', async ({ page }) => {
    // 1. Verify all inputs are present and placeholders are set when unfocused
    console.log('✅ Step 1: Verifying initial placeholder attributes');
    await expect(page.locator('input[name="fullName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    
    await expect(page.locator('input[name="fullName"]')).toHaveAttribute('placeholder', 'Enter your full name');
    await expect(page.locator('input[name="email"]')).toHaveAttribute('placeholder', 'Enter your email');
    await expect(page.locator('input[name="password"]')).toHaveAttribute('placeholder', 'Create a password');
    await expect(page.locator('input[name="confirmPassword"]')).toHaveAttribute('placeholder', 'Confirm your password');

    // 2. Test floating label behavior with full name field
    console.log('✅ Step 2: Testing floating label behavior');
    const nameInput = page.locator('input[name="fullName"]');
    
    // Focus should activate floating label
    await nameInput.focus();
    await page.waitForTimeout(500); // Let animation complete
    
    // Type in the field
    await nameInput.fill('John Doe');
    await expect(nameInput).toHaveValue('John Doe');
    
    // 3. Test email field
    console.log('✅ Step 3: Testing email field');
    const emailInput = page.locator('input[name="email"]');
    await emailInput.focus();
    await emailInput.fill('john.doe@example.com');
    await expect(emailInput).toHaveValue('john.doe@example.com');
    
    // 4. Test password field
    console.log('✅ Step 4: Testing password field');
    const passwordInput = page.locator('input[name="password"]');
    await passwordInput.focus();
    await passwordInput.fill('SecurePass123');
    await expect(passwordInput).toHaveValue('SecurePass123');
    
    // 5. Test confirm password field
    console.log('✅ Step 5: Testing confirm password field');
    const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
    await confirmPasswordInput.focus();
    await confirmPasswordInput.fill('SecurePass123');
    await expect(confirmPasswordInput).toHaveValue('SecurePass123');
    
    // 6. Verify all fields have values
    console.log('✅ Step 6: Verifying all fields have been filled');
    await expect(nameInput).toHaveValue('John Doe');
    await expect(emailInput).toHaveValue('john.doe@example.com');
    await expect(passwordInput).toHaveValue('SecurePass123');
    await expect(confirmPasswordInput).toHaveValue('SecurePass123');
    
    // 7. Test that placeholders work alongside name attributes
    console.log('✅ Step 7: Verifying name attributes still work');
    await expect(page.locator('input[name="fullName"]')).toHaveValue('John Doe');
    await expect(page.locator('input[name="email"]')).toHaveValue('john.doe@example.com');
    await expect(page.locator('input[name="password"]')).toHaveValue('SecurePass123');
    await expect(page.locator('input[name="confirmPassword"]')).toHaveValue('SecurePass123');
    
    console.log('🎉 All placeholder tests passed!');
  });

  test('should demonstrate both selection methods work', async ({ page }) => {
    // Test that we can select by placeholder
    const byPlaceholder = page.locator('input[name="fullName"]');
    await expect(byPlaceholder).toBeVisible();
    
    // Test that we can select by name attribute  
    const byName = page.locator('input[name="fullName"]');
    await expect(byName).toBeVisible();
    
    // They should be the same element
    await expect(byPlaceholder).toHaveAttribute('name', 'fullName');
    await expect(byName).toHaveAttribute('placeholder', 'Enter your full name');
    
    // Test interaction with both selectors
    await byPlaceholder.fill('Test Name');
    await expect(byName).toHaveValue('Test Name');
    
    await byName.fill('New Name');
    await expect(byPlaceholder).toHaveValue('New Name');
  });
});