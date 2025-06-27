import { test, expect } from '@playwright/test';

test.describe('User Experience Demo - Floating Labels + Placeholders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveTitle(/Invoice Generator/);
  });

  test('should demonstrate the improved UX with floating labels and smart placeholders', async ({ page }) => {
    console.log('🚀 Starting UX Demo...');
    
    // Take initial screenshot to see the form
    await page.screenshot({ path: 'signup-initial.png' });
    
    console.log('✅ Step 1: Initial state - First field focused (autofocus), others show placeholders');
    
    // The first field should be autofocused with floating label visible
    const nameInput = page.locator('input[name="fullName"]');
    const emailInput = page.locator('input[name="email"]'); 
    const passwordInput = page.locator('input[name="password"]');
    const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
    
    // Check that inputs are visible
    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(confirmPasswordInput).toBeVisible();
    
    console.log('✅ Step 2: Test unfocused fields show placeholders');
    // Move focus away from the first field to see its placeholder
    await emailInput.focus();
    await page.waitForTimeout(300); // Wait for animations
    
    // Now the name field should show its placeholder
    await expect(nameInput).toHaveAttribute('placeholder', 'Enter your full name');
    await expect(emailInput).toHaveAttribute('placeholder', ''); // Currently focused
    
    console.log('✅ Step 3: Test focused fields hide placeholders and show floating labels');
    await passwordInput.focus(); 
    await page.waitForTimeout(300);
    
    // Email should now show placeholder, password should be empty
    await expect(emailInput).toHaveAttribute('placeholder', 'Enter your email');
    await expect(passwordInput).toHaveAttribute('placeholder', '');
    
    console.log('✅ Step 4: Test typing and floating label behavior');
    await nameInput.focus();
    await nameInput.fill('John Doe');
    await page.waitForTimeout(300);
    
    await emailInput.focus();
    await emailInput.fill('john@example.com');
    await page.waitForTimeout(300);
    
    await passwordInput.focus();
    await passwordInput.fill('SecurePass123');
    await page.waitForTimeout(300);
    
    // When fields have content, placeholders should be empty even when unfocused
    await confirmPasswordInput.focus();
    await expect(nameInput).toHaveAttribute('placeholder', ''); // Has value
    await expect(emailInput).toHaveAttribute('placeholder', ''); // Has value
    await expect(passwordInput).toHaveAttribute('placeholder', ''); // Has value
    
    console.log('✅ Step 5: Test clearing field restores placeholder');
    await nameInput.focus();
    await nameInput.fill(''); // Clear the field
    await emailInput.focus(); // Move focus away
    await page.waitForTimeout(300);
    
    // Name field should now show placeholder again since it's empty and unfocused
    await expect(nameInput).toHaveAttribute('placeholder', 'Enter your full name');
    
    console.log('🎉 UX Demo completed successfully!');
    
    // Take final screenshot
    await page.screenshot({ path: 'signup-final.png' });
  });
});