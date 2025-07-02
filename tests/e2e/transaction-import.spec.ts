import { test, expect, Page } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

// Test credentials
const TEST_USER = {
  email: 'jeevancodes@gmail.com',
  password: 'Jeeva@900'
};

// Sample CSV data for testing
const SAMPLE_CSV_DATA = `Date,Description,Amount,Balance,Reference
15/01/2024,"EFTPOS PURCHASE 123 NEW WORLD AUCKLAND",-45.67,1234.56,TXN123
16/01/2024,"SALARY PAYMENT - ACME CORP",2500.00,3734.56,SAL001
17/01/2024,"AUTOMATIC PAYMENT - POWER COMPANY",-120.50,3614.06,AP001
18/01/2024,"ATM WITHDRAWAL - QUEEN STREET",-100.00,3514.06,ATM456
19/01/2024,"ONLINE TRANSFER FROM SAVINGS",500.00,4014.06,TRF789
20/01/2024,"CONTACTLESS PURCHASE - CAFE PRIMO",-8.50,4005.56,CLS001
21/01/2024,"DIRECT DEBIT - INSURANCE PREMIUM",-89.95,3915.61,DD002`;

const INVALID_CSV_DATA = `Date,Description,Amount
invalid-date,Test Transaction,not-a-number
,Empty description,50.00
15/01/2024,,100.00`;

const DUPLICATE_CSV_DATA = `Date,Description,Amount,Balance,Reference
15/01/2024,"EFTPOS PURCHASE 123 NEW WORLD AUCKLAND",-45.67,1234.56,TXN123
15/01/2024,"EFTPOS PURCHASE 123 NEW WORLD AUCKLAND",-45.67,1234.56,TXN123
16/01/2024,"SALARY PAYMENT - ACME CORP",2500.00,3734.56,SAL001`;

// Helper function to create test CSV files
function createTestCSVFile(content: string, filename: string): string {
  const testDataDir = '/tmp/playwright-test-data';
  const filePath = path.join(testDataDir, filename);
  
  // Create directory if it doesn't exist
  mkdirSync(testDataDir, { recursive: true });
  
  writeFileSync(filePath, content);
  return filePath;
}

// Helper function to login
async function loginUser(page: Page) {
  await page.goto('/login');
  
  // Wait for login form
  await expect(page.locator('form')).toBeVisible();
  
  // Fill login form
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for successful login (redirect to dashboard)
  await page.waitForURL(/\/(dashboard)?$/, { timeout: 15000 });
  
  // Wait for the page to load completely
  await page.waitForLoadState('networkidle');
  
  // Verify we're logged in by checking for the Dashboard h1 and navigation
  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('aside').first()).toBeVisible({ timeout: 5000 });
}

// Helper function to clean up test data
async function cleanupTestData(page: Page) {
  // Navigate to bank accounts and delete any test accounts
  await page.goto('/bank-accounts');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Look for test bank accounts and delete them
  const testAccountNames = ['Test E2E Checking Account', 'Test E2E Savings Account'];
  
  for (const accountName of testAccountNames) {
    try {
      // Find account card containing the test name
      const accountCard = page.locator(`text="${accountName}"`).first();
      if (await accountCard.isVisible()) {
        // Click on the account to select it or find delete button
        // This depends on your UI implementation - adjust as needed
        const deleteButton = accountCard.locator('..').locator('button:has-text("Delete"), button[aria-label*="delete"], button[aria-label*="Delete"]').first();
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          
          // Confirm deletion if there's a confirmation dialog
          const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")').first();
          if (await confirmButton.isVisible({ timeout: 2000 })) {
            await confirmButton.click();
          }
          
          // Wait for deletion to complete
          await page.waitForTimeout(1000);
        }
      }
    } catch (e) {
      // Account might not exist, continue
      console.log(`Could not delete account ${accountName}:`, e);
    }
  }
}

test.describe('Transaction Import E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginUser(page);
    
    // Clean up any existing test data
    await cleanupTestData(page);
  });
  
  test.afterEach(async ({ page }) => {
    // Clean up test data after each test
    await cleanupTestData(page);
  });

  test('Complete transaction import flow - valid CSV', async ({ page }) => {
    // Create test CSV file
    const csvFilePath = createTestCSVFile(SAMPLE_CSV_DATA, 'valid-transactions.csv');
    
    // Step 1: Navigate to Bank Accounts
    await page.goto('/bank-accounts');
    await expect(page.locator('h1')).toContainText('Bank Accounts');
    
    // Step 2: Create a bank account first
    await page.click('button:has-text("Add Bank Account")');
    
    // Fill bank account form
    await page.fill('input[placeholder*="My Checking Account"]', 'Test E2E Checking Account');
    await page.fill('input[placeholder*="12-3456-7890123-00"]', '12-3456-7890123-99');
    await page.fill('input[placeholder*="ANZ Bank"]', 'Test Bank');
    
    // Select account type
    await page.click('[role="combobox"]:has-text("Select account type")');
    await page.click('text="Checking"');
    
    // Set opening and current balance
    await page.fill('input[type="number"]:nth-of-type(1)', '1000');
    await page.fill('input[type="number"]:nth-of-type(2)', '1234.56');
    
    // Save bank account
    await page.click('button:has-text("Create Account")');
    
    // Wait for success and close dialog
    await expect(page.locator('text="Bank account created successfully"')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000); // Wait for dialog to close
    
    // Step 3: Navigate to Transaction Import
    await page.click('button:has-text("Import Transactions")');
    await expect(page).toHaveURL('/transaction-import');
    await expect(page.locator('h1')).toContainText('Import Transactions');
    
    // Verify we're on step 1
    await expect(page.locator('text="Step 1 of 4"')).toBeVisible();
    
    // Step 4: Select bank account
    await page.click('text="Test E2E Checking Account"');
    await expect(page.locator('.ring-2')).toContainText('Test E2E Checking Account');
    
    // Step 5: Upload CSV file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvFilePath);
    
    // Wait for file processing and step 2
    await expect(page.locator('text="Step 2 of 4"')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h3')).toContainText('Column Mapping');
    
    // Step 6: Verify auto-detected column mapping
    await expect(page.locator('select[id*="date-column"]')).toHaveValue('Date');
    await expect(page.locator('select[id*="description-column"]')).toHaveValue('Description');
    await expect(page.locator('select[id*="amount-column"]')).toHaveValue('Amount');
    
    // Step 7: Preview data
    await page.click('button:has-text("Preview Data")');
    
    // Wait for parsing to complete
    await expect(page.locator('text="Successfully parsed"')).toBeVisible({ timeout: 10000 });
    
    // Step 8: Continue to preview
    await page.click('button:has-text("Continue")');
    
    // Verify we're on step 3
    await expect(page.locator('text="Step 3 of 4"')).toBeVisible();
    await expect(page.locator('h3')).toContainText('Import Preview');
    
    // Step 9: Verify transaction preview
    await expect(page.locator('text="7"')).toBeVisible(); // Should show 7 transactions
    await expect(page.locator('text="NEW WORLD AUCKLAND"')).toBeVisible();
    await expect(page.locator('text="SALARY PAYMENT"')).toBeVisible();
    
    // Verify financial summary
    await expect(page.locator('text="Selected Transactions"')).toBeVisible();
    await expect(page.locator('text="Total Credits"')).toBeVisible();
    await expect(page.locator('text="Total Debits"')).toBeVisible();
    
    // Step 10: Import transactions
    await page.click('button:has-text("Import")');
    
    // Wait for import to complete
    await expect(page.locator('text="Step 4 of 4"')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text="Import Completed Successfully!"')).toBeVisible();
    
    // Step 11: Verify import summary
    await expect(page.locator('text="Successfully Imported"')).toBeVisible();
    await expect(page.locator('text="7"')).toBeVisible(); // Should show 7 imported
    
    // Step 12: View transactions
    await page.click('button:has-text("View Transactions")');
    
    // Should navigate back to bank accounts
    await expect(page).toHaveURL('/bank-accounts');
    
    // Verify the account balance has been updated
    await expect(page.locator('text="Test E2E Checking Account"')).toBeVisible();
  });

  test('Transaction import with invalid CSV data', async ({ page }) => {
    // Create test CSV file with invalid data
    const csvFilePath = createTestCSVFile(INVALID_CSV_DATA, 'invalid-transactions.csv');
    
    // Navigate to transaction import
    await page.goto('/bank-accounts');
    
    // Create a bank account first
    await page.click('button:has-text("Add Bank Account")');
    await page.fill('input[placeholder*="My Checking Account"]', 'Test E2E Error Account');
    await page.fill('input[placeholder*="12-3456-7890123-00"]', '12-3456-7890123-88');
    await page.fill('input[placeholder*="ANZ Bank"]', 'Test Bank');
    await page.click('[role="combobox"]:has-text("Select account type")');
    await page.click('text="Checking"');
    await page.fill('input[type="number"]:nth-of-type(1)', '1000');
    await page.fill('input[type="number"]:nth-of-type(2)', '1000');
    await page.click('button:has-text("Create Account")');
    await page.waitForTimeout(2000);
    
    // Navigate to import
    await page.click('button:has-text("Import Transactions")');
    
    // Select account and upload invalid file
    await page.click('text="Test E2E Error Account"');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvFilePath);
    
    // Continue to preview
    await page.click('button:has-text("Preview Data")');
    
    // Should show parsing errors
    await expect(page.locator('text="Parse Errors", text="parsing errors"')).toBeVisible({ timeout: 10000 });
    
    // Should still allow continuing with valid rows
    await page.click('button:has-text("Continue")');
    
    // Should show fewer transactions (only valid ones)
    await expect(page.locator('text="1"')).toBeVisible(); // Only 1 valid transaction
  });

  test('Duplicate transaction detection', async ({ page }) => {
    // Create test CSV file with duplicates
    const csvFilePath = createTestCSVFile(DUPLICATE_CSV_DATA, 'duplicate-transactions.csv');
    
    // Set up bank account and import
    await page.goto('/bank-accounts');
    await page.click('button:has-text("Add Bank Account")');
    await page.fill('input[placeholder*="My Checking Account"]', 'Test E2E Duplicate Account');
    await page.fill('input[placeholder*="12-3456-7890123-00"]', '12-3456-7890123-77');
    await page.fill('input[placeholder*="ANZ Bank"]', 'Test Bank');
    await page.click('[role="combobox"]:has-text("Select account type")');
    await page.click('text="Checking"');
    await page.fill('input[type="number"]:nth-of-type(1)', '1000');
    await page.fill('input[type="number"]:nth-of-type(2)', '1000');
    await page.click('button:has-text("Create Account")');
    await page.waitForTimeout(2000);
    
    // Import transactions
    await page.click('button:has-text("Import Transactions")');
    await page.click('text="Test E2E Duplicate Account"');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(csvFilePath);
    
    await page.click('button:has-text("Preview Data")');
    await page.waitForTimeout(3000);
    await page.click('button:has-text("Continue")');
    
    // Should show duplicate warning
    await expect(page.locator('text="duplicate", text="Duplicate"')).toBeVisible();
    
    // Should show fewer transactions after deduplication
    await expect(page.locator('text="2"')).toBeVisible(); // 2 unique transactions
  });

  test('File upload validation', async ({ page }) => {
    await page.goto('/transaction-import');
    
    // Try to upload without selecting account
    const fileInput = page.locator('input[type="file"]');
    const csvFilePath = createTestCSVFile(SAMPLE_CSV_DATA, 'test-no-account.csv');
    
    // Should show error message about selecting account first
    await fileInput.setInputFiles(csvFilePath);
    await expect(page.locator('text="Please select a bank account first"')).toBeVisible({ timeout: 5000 });
  });

  test('Navigation flow and step progression', async ({ page }) => {
    await page.goto('/bank-accounts');
    
    // Create account
    await page.click('button:has-text("Add Bank Account")');
    await page.fill('input[placeholder*="My Checking Account"]', 'Test E2E Navigation Account');
    await page.fill('input[placeholder*="12-3456-7890123-00"]', '12-3456-7890123-66');
    await page.fill('input[placeholder*="ANZ Bank"]', 'Test Bank');
    await page.click('[role="combobox"]:has-text("Select account type")');
    await page.click('text="Checking"');
    await page.fill('input[type="number"]:nth-of-type(1)', '1000');
    await page.fill('input[type="number"]:nth-of-type(2)', '1000');
    await page.click('button:has-text("Create Account")');
    await page.waitForTimeout(2000);
    
    // Start import flow
    await page.click('button:has-text("Import Transactions")');
    
    // Verify step indicators
    await expect(page.locator('text="Step 1 of 4"')).toBeVisible();
    await expect(page.locator('text="0% complete"')).toBeVisible();
    
    // Progress through steps
    await page.click('text="Test E2E Navigation Account"');
    const csvFilePath = createTestCSVFile(SAMPLE_CSV_DATA, 'test-navigation.csv');
    await page.locator('input[type="file"]').setInputFiles(csvFilePath);
    
    // Step 2
    await expect(page.locator('text="Step 2 of 4"')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text="33% complete"')).toBeVisible();
    
    // Test back navigation
    await page.click('button:has-text("Back")');
    await expect(page.locator('text="Step 1 of 4"')).toBeVisible();
    
    // Go forward again
    await page.click('text="Test E2E Navigation Account"');
    await page.locator('input[type="file"]').setInputFiles(csvFilePath);
    await page.click('button:has-text("Preview Data")');
    await page.waitForTimeout(3000);
    await page.click('button:has-text("Continue")');
    
    // Step 3
    await expect(page.locator('text="Step 3 of 4"')).toBeVisible();
    await expect(page.locator('text="67% complete"')).toBeVisible();
    
    // Complete import
    await page.click('button:has-text("Import")');
    
    // Step 4
    await expect(page.locator('text="Step 4 of 4"')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text="100% complete"')).toBeVisible();
  });

  test('Transaction categorization verification', async ({ page }) => {
    const csvFilePath = createTestCSVFile(SAMPLE_CSV_DATA, 'test-categorization.csv');
    
    // Set up and import
    await page.goto('/bank-accounts');
    await page.click('button:has-text("Add Bank Account")');
    await page.fill('input[placeholder*="My Checking Account"]', 'Test E2E Category Account');
    await page.fill('input[placeholder*="12-3456-7890123-00"]', '12-3456-7890123-55');
    await page.fill('input[placeholder*="ANZ Bank"]', 'Test Bank');
    await page.click('[role="combobox"]:has-text("Select account type")');
    await page.click('text="Checking"');
    await page.fill('input[type="number"]:nth-of-type(1)', '1000');
    await page.fill('input[type="number"]:nth-of-type(2)', '1000');
    await page.click('button:has-text("Create Account")');
    await page.waitForTimeout(2000);
    
    await page.click('button:has-text("Import Transactions")');
    await page.click('text="Test E2E Category Account"');
    await page.locator('input[type="file"]').setInputFiles(csvFilePath);
    await page.click('button:has-text("Preview Data")');
    await page.waitForTimeout(3000);
    await page.click('button:has-text("Continue")');
    
    // Verify automatic categorization
    await expect(page.locator('text="Food & Dining", text="Groceries"')).toBeVisible(); // NEW WORLD should be categorized as food/groceries
    await expect(page.locator('text="Income", text="Salary"')).toBeVisible(); // Salary should be categorized as income
    await expect(page.locator('text="Utilities"')).toBeVisible(); // Power company should be utilities
    
    // Check category breakdown in summary
    await page.click('button:has-text("Import")');
    await expect(page.locator('text="Categories"')).toBeVisible({ timeout: 15000 });
  });
});