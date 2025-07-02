import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || '',
  password: process.env.E2E_TEST_PASSWORD || ''
};

const SAMPLE_CSV_DATA = `Date,Description,Amount,Balance
15/01/2024,"EFTPOS PURCHASE 123 NEW WORLD AUCKLAND",-45.67,1234.56
16/01/2024,"SALARY PAYMENT - ACME CORP",2500.00,3734.56
17/01/2024,"AUTOMATIC PAYMENT - POWER COMPANY",-120.50,3614.06`;

function createCSVFile(content: string, filename: string): string {
  const testDataDir = '/tmp/playwright-test-data';
  mkdirSync(testDataDir, { recursive: true });
  const filePath = path.join(testDataDir, filename);
  writeFileSync(filePath, content);
  return filePath;
}

test.describe('Transaction Import E2E', () => {
  test('Complete transaction import workflow', async ({ page }) => {
    // Step 1: Login
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for login success
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 15000 });
    
    // Step 2: Navigate to Bank Accounts
    await page.goto('/bank-accounts');
    await expect(page.locator('h1:has-text("Bank Accounts")')).toBeVisible();
    
    // Step 3: Create a bank account if none exists
    const addAccountButton = page.locator('button:has-text("Add Bank Account")').first();
    await addAccountButton.click();
    
    // Fill bank account form
    await page.fill('input[placeholder*="My Checking Account"]', 'E2E Test Account');
    await page.fill('input[placeholder*="12-3456-7890123-00"]', '12-3456-7890123-99');
    await page.fill('input[placeholder*="ANZ Bank"]', 'E2E Test Bank');
    
    // Select account type - use a more reliable selector
    const accountTypeSelector = page.locator('[role="combobox"]').first();
    await accountTypeSelector.click();
    await page.locator('text="Checking"').click();
    
    // Set balances
    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(0).fill('1000');
    await numberInputs.nth(1).fill('1234.56');
    
    // Create account
    await page.click('button:has-text("Create Account")');
    
    // Wait for success message
    await expect(page.locator('text="successfully"')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000); // Wait for dialog to close
    
    // Step 4: Start import process
    const importButton = page.locator('button:has-text("Import Transactions")');
    await importButton.click();
    
    // Should navigate to import page
    await expect(page).toHaveURL('/transaction-import');
    await expect(page.locator('text="Import Transactions"')).toBeVisible();
    
    // Step 5: Select the account we just created
    await page.locator('text="E2E Test Account"').click();
    
    // Step 6: Upload CSV file
    const csvFilePath = createCSVFile(SAMPLE_CSV_DATA, 'test-transactions.csv');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvFilePath);
    
    // Step 7: Wait for column mapping step
    await expect(page.locator('text="Column Mapping"')).toBeVisible({ timeout: 15000 });
    
    // Step 8: Preview data (auto-mapping should work)
    await page.click('button:has-text("Preview Data")');
    
    // Wait for parsing
    await expect(page.locator('text="parsed", text="Successfully"')).toBeVisible({ timeout: 10000 });
    
    // Step 9: Continue to preview
    await page.click('button:has-text("Continue")');
    
    // Step 10: Verify preview shows transactions
    await expect(page.locator('text="Import Preview"')).toBeVisible();
    await expect(page.locator('text="NEW WORLD"')).toBeVisible();
    await expect(page.locator('text="SALARY PAYMENT"')).toBeVisible();
    
    // Step 11: Import transactions
    await page.click('button:has-text("Import")');
    
    // Step 12: Verify success
    await expect(page.locator('text="Import Completed Successfully"')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text="Successfully Imported"')).toBeVisible();
    
    // Step 13: Go back to bank accounts to verify
    await page.click('button:has-text("View Transactions")');
    await expect(page).toHaveURL('/bank-accounts');
    
    // Clean up: Delete the test account
    try {
      // Find and delete the test account
      const testAccountCard = page.locator('text="E2E Test Account"').locator('..');
      const deleteButton = testAccountCard.locator('button').last();
      await deleteButton.click();
      
      // Confirm deletion if needed
      const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
    } catch (e) {
      console.log('Could not clean up test account:', e);
    }
  });
  
  test('Bank account creation validation', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 15000 });
    
    // Go to bank accounts
    await page.goto('/bank-accounts');
    await page.click('button:has-text("Add Bank Account")');
    
    // Try to submit empty form
    await page.click('button:has-text("Create Account")');
    
    // Should show validation errors
    await expect(page.locator('text="required"')).toBeVisible();
  });

  test('Invalid file upload handling', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 15000 });
    
    // Go to import
    await page.goto('/transaction-import');
    
    // Try to upload without selecting account
    const invalidCSV = createCSVFile('invalid,data\nhere', 'invalid.csv');
    await page.locator('input[type="file"]').setInputFiles(invalidCSV);
    
    // Should show error about selecting account first
    await expect(page.locator('text="select a bank account first", text="Select a bank account first"')).toBeVisible({ timeout: 5000 });
  });
});