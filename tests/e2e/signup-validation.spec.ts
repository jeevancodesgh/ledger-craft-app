import { test, expect } from '@playwright/test';

test.describe('Sign Up Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveTitle(/Invoice Generator/);
  });

  test('should have correct placeholder text when fields are unfocused', async ({ page }) => {
    // Verify placeholder attributes are set correctly when fields are unfocused and empty
    await expect(page.locator('input[name="fullName"]')).toHaveAttribute('placeholder', 'Enter your full name');
    await expect(page.locator('input[name="email"]')).toHaveAttribute('placeholder', 'Enter your email');
    await expect(page.locator('input[name="password"]')).toHaveAttribute('placeholder', 'Create a password');
    await expect(page.locator('input[name="confirmPassword"]')).toHaveAttribute('placeholder', 'Confirm your password');
    
    // Test dynamic placeholder behavior on focus
    const nameInput = page.locator('input[name="fullName"]');
    await nameInput.focus();
    await expect(nameInput).toHaveAttribute('placeholder', ''); // Placeholder disappears when focused
    
    await nameInput.blur();
    await expect(nameInput).toHaveAttribute('placeholder', 'Enter your full name'); // Returns when unfocused and empty
  });

  test.describe('Real-time Field Validation', () => {
    test('should validate full name field on blur', async ({ page }) => {
      const nameInput = page.locator('input[name="fullName"]');
      
      // Focus and then blur with empty value
      await nameInput.focus();
      await nameInput.blur();
      
      // Should show validation error
      await expect(page.getByText('Full name must be at least 2 characters')).toBeVisible();
      
      // Type single character
      await nameInput.fill('J');
      await nameInput.blur();
      
      // Should still show validation error
      await expect(page.getByText('Full name must be at least 2 characters')).toBeVisible();
      
      // Type valid name
      await nameInput.fill('John Doe');
      await nameInput.blur();
      
      // Validation error should disappear
      await expect(page.getByText('Full name must be at least 2 characters')).not.toBeVisible();
    });

    test('should validate email field on blur', async ({ page }) => {
      const emailInput = page.locator('input[name="email"]');
      
      // Test invalid email formats
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@invalid.com',
        'invalid@.com',
        'invalid.com'
      ];
      
      for (const email of invalidEmails) {
        await emailInput.fill(email);
        await emailInput.blur();
        await expect(page.getByText('Invalid email address')).toBeVisible();
      }
      
      // Test valid email
      await emailInput.fill('valid@example.com');
      await emailInput.blur();
      await expect(page.getByText('Invalid email address')).not.toBeVisible();
    });

    test('should validate password field with strength indicator', async ({ page }) => {
      const passwordInput = page.locator('input[name="password"]');
      
      // Focus on password field to show strength indicator
      await passwordInput.focus();
      
      // Test weak passwords and check strength indicator
      const weakPasswords = [
        { password: 'weak', expectedStrength: 'weak' },
        { password: 'weakpass', expectedStrength: 'weak' },
        { password: 'Weakpass', expectedStrength: 'medium' },
        { password: 'WeakPass123', expectedStrength: 'strong' }
      ];
      
      for (const { password, expectedStrength } of weakPasswords) {
        await passwordInput.fill(password);
        
        // Check if strength indicator shows correct strength
        const strengthIndicator = page.locator(`[data-strength="${expectedStrength}"], .strength-${expectedStrength}`);
        await expect(strengthIndicator).toBeVisible();
      }
    });

    test('should validate password confirmation on blur', async ({ page }) => {
      const passwordInput = page.locator('input[name="password"]');
      const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
      
      // Set original password
      await passwordInput.fill('SecurePass123');
      
      // Test mismatched confirmation
      await confirmPasswordInput.fill('DifferentPass123');
      await confirmPasswordInput.blur();
      
      // Should show mismatch error
      await expect(page.getByText(/passwords do not match/i)).toBeVisible();
      
      // Fix confirmation password
      await confirmPasswordInput.fill('SecurePass123');
      await confirmPasswordInput.blur();
      
      // Error should disappear
      await expect(page.getByText(/passwords do not match/i)).not.toBeVisible();
    });
  });

  test.describe('Form Submission Validation', () => {
    test('should prevent submission with empty required fields', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /create account/i });
      
      // Try submitting empty form
      await submitButton.click();
      
      // Should show all required field errors
      await expect(page.getByText('Full name must be at least 2 characters')).toBeVisible();
      await expect(page.getByText('Invalid email address')).toBeVisible();
      await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
      await expect(page.getByText('You must agree to the terms and conditions')).toBeVisible();
      
      // Form should not be submitted (should stay on same page)
      await expect(page).toHaveURL(/\/signup/);
    });

    test('should prevent submission with invalid email', async ({ page }) => {
      // Fill form with invalid email
      await page.locator('input[name="fullName"]').fill('John Doe');
      await page.locator('input[name="email"]').fill('invalid-email');
      await page.locator('input[name="password"]').fill('SecurePass123');
      await page.locator('input[name="confirmPassword"]').fill('SecurePass123');
      await page.getByRole('checkbox').check();
      
      await page.getByRole('button', { name: /create account/i }).click();
      
      // Should show email validation error
      await expect(page.getByText('Invalid email address')).toBeVisible();
      await expect(page).toHaveURL(/\/signup/);
    });

    test('should prevent submission without terms agreement', async ({ page }) => {
      // Fill all fields except terms checkbox
      await page.locator('input[name="fullName"]').fill('John Doe');
      await page.locator('input[name="email"]').fill('test@example.com');
      await page.locator('input[name="password"]').fill('SecurePass123');
      await page.locator('input[name="confirmPassword"]').fill('SecurePass123');
      
      await page.getByRole('button', { name: /create account/i }).click();
      
      // Should show terms validation error
      await expect(page.getByText('You must agree to the terms and conditions')).toBeVisible();
      await expect(page).toHaveURL(/\/signup/);
    });
  });

  test.describe('Edge Cases and Special Characters', () => {
    test('should handle special characters in full name', async ({ page }) => {
      const specialNames = [
        "Jean-Pierre O'Connor",
        "María José García",
        "李小明",
        "Müller",
        "José María"
      ];
      
      const nameInput = page.locator('input[name="fullName"]');
      
      for (const name of specialNames) {
        await nameInput.fill(name);
        await nameInput.blur();
        
        // Should not show validation error for valid international names
        await expect(page.getByText('Full name must be at least 2 characters')).not.toBeVisible();
      }
    });

    test('should handle edge case emails', async ({ page }) => {
      const edgeCaseEmails = [
        'test+tag@example.com',
        'user.name@example.com',
        'user_name@example-domain.com',
        'a@b.co',
        'very.long.email.address@very-long-domain-name.com'
      ];
      
      const emailInput = page.locator('input[name="email"]');
      
      for (const email of edgeCaseEmails) {
        await emailInput.fill(email);
        await emailInput.blur();
        
        // Should accept valid edge case emails
        await expect(page.getByText('Invalid email address')).not.toBeVisible();
      }
    });

    test('should handle maximum field lengths', async ({ page }) => {
      // Test very long inputs
      const longName = 'A'.repeat(100);
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      const longPassword = 'SecurePass123' + 'x'.repeat(100);
      
      await page.locator('input[name="fullName"]').fill(longName);
      await page.locator('input[name="email"]').fill(longEmail);
      await page.locator('input[name="password"]').fill(longPassword);
      await page.locator('input[name="confirmPassword"]').fill(longPassword);
      
      // Form should handle long inputs gracefully
      await expect(page.locator('input[name="fullName"]')).toHaveValue(longName);
      await expect(page.locator('input[name="email"]')).toHaveValue(longEmail);
    });
  });

  test.describe('Password Security Requirements', () => {
    test('should enforce minimum password length', async ({ page }) => {
      const shortPasswords = ['1', '12', '123', '1234567']; // All less than 8 chars
      const passwordInput = page.locator('input[name="password"]');
      
      for (const password of shortPasswords) {
        await passwordInput.fill(password);
        await passwordInput.blur();
        
        await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
      }
      
      // Test minimum valid password
      await passwordInput.fill('12345678');
      await passwordInput.blur();
      
      // Should still show complexity error but not length error
      await expect(page.getByText('Password must be at least 8 characters')).not.toBeVisible();
    });

    test('should enforce password complexity', async ({ page }) => {
      const complexityTests = [
        { password: 'alllowercase123', missing: 'uppercase' },
        { password: 'ALLUPPERCASE123', missing: 'lowercase' },
        { password: 'NoNumbersHere', missing: 'number' },
        { password: 'onlylowercase', missing: 'uppercase and number' },
        { password: 'ONLYUPPERCASE', missing: 'lowercase and number' }
      ];
      
      const passwordInput = page.locator('input[name="password"]');
      
      for (const { password } of complexityTests) {
        await passwordInput.fill(password);
        await passwordInput.blur();
        
        await expect(page.getByText('Password must contain uppercase, lowercase, and number')).toBeVisible();
      }
      
      // Test valid complex password
      await passwordInput.fill('SecurePass123');
      await passwordInput.blur();
      
      await expect(page.getByText('Password must contain uppercase, lowercase, and number')).not.toBeVisible();
    });
  });

  test.describe('Accessibility and User Experience', () => {
    test('should maintain focus management', async ({ page }) => {
      // Test tab navigation through form
      await page.keyboard.press('Tab'); // Should focus first field
      await expect(page.locator('input[name="fullName"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('input[name="email"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('input[name="password"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('input[name="confirmPassword"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.getByRole('checkbox')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: /create account/i })).toBeFocused();
    });

    test('should provide proper error announcements', async ({ page }) => {
      // Fill invalid data and submit
      await page.locator('input[name="fullName"]').fill('J');
      await page.locator('input[name="email"]').fill('invalid');
      await page.getByRole('button', { name: /create account/i }).click();
      
      // Check that errors have proper ARIA attributes for screen readers
      const nameError = page.getByText('Full name must be at least 2 characters');
      const emailError = page.getByText('Invalid email address');
      
      await expect(nameError).toHaveAttribute('role', 'alert');
      await expect(emailError).toHaveAttribute('role', 'alert');
    });

    test('should clear validation errors when field becomes valid', async ({ page }) => {
      const nameInput = page.locator('input[name="fullName"]');
      
      // Trigger validation error
      await nameInput.focus();
      await nameInput.blur();
      await expect(page.getByText('Full name must be at least 2 characters')).toBeVisible();
      
      // Fix the field
      await nameInput.fill('John Doe');
      await nameInput.blur();
      
      // Error should be cleared
      await expect(page.getByText('Full name must be at least 2 characters')).not.toBeVisible();
    });
  });
});