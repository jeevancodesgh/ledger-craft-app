import { test, expect, Page } from '@playwright/test';

// Test data for New Zealand accountant workflow
const nzAccountantUser = {
  fullName: 'Sarah Wilson',
  email: `nz.accountant+${Date.now()}@easybizinvoice.com`,
  password: 'SecureNZ123!',
  confirmPassword: 'SecureNZ123!'
};

const nzBusinessProfile = {
  businessName: 'Wilson Accounting Ltd',
  businessEmail: 'contact@wilsonaccounting.co.nz',
  address: '123 Queen Street',
  city: 'Auckland',
  country: 'New Zealand',
  postalCode: '1010',
  phone: '+64 9 123 4567',
  gstNumber: '123-456-789'
};

const testCustomer = {
  name: 'ABC Manufacturing Ltd',
  email: 'accounts@abcmanufacturing.co.nz',
  phone: '+64 4 987 6543',
  address: '456 Wellington Road, Wellington 6011'
};

const testExpense = {
  description: 'Office Supplies - Staples',
  amount: '150.75',
  category: 'Office Expenses',
  gstAmount: '19.60'
};

const testInvoiceItem = {
  description: 'Professional Accounting Services - Monthly Bookkeeping',
  quantity: '1',
  unitPrice: '450.00',
  gstRate: '15%'
};

test.describe('EasyBizInvoice - New Zealand Accountant End-to-End Test', () => {
  test('Complete NZ Accountant Workflow', async ({ page }) => {
    // Test 1: Sign Up Process
    console.log('Starting comprehensive NZ accountant workflow test...');
    
    await page.goto('/signup');
    await expect(page).toHaveTitle(/EasyBizInvoice/);
    
    // Fill signup form
    await page.fill('input[name="fullName"]', nzAccountantUser.fullName);
    await page.fill('input[name="email"]', nzAccountantUser.email);
    await page.fill('input[name="password"]', nzAccountantUser.password);
    await page.fill('input[name="confirmPassword"]', nzAccountantUser.confirmPassword);
    
    // Accept terms
    await page.check('input[type="checkbox"]');
    
    // Submit signup
    await page.click('button[type="submit"]');
    
    // Wait for either onboarding or email confirmation
    await page.waitForLoadState('networkidle');
    
    // Test 2: Business Profile Setup (Onboarding)
    console.log('Testing business profile setup...');
    
    // Look for onboarding or business setup forms
    const isOnboarding = await page.locator('text=Welcome').isVisible({ timeout: 5000 }).catch(() => false);
    const isBusinessSetup = await page.locator('text=Business').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isOnboarding || isBusinessSetup) {
      // Fill business profile information
      await fillBusinessProfile(page, nzBusinessProfile);
    } else {
      // Navigate to settings to set up business profile
      await page.click('text=Settings', { timeout: 10000 });
      await fillBusinessProfile(page, nzBusinessProfile);
    }
    
    // Test 3: Dashboard Access and Overview
    console.log('Testing dashboard access...');
    
    await page.goto('/dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    
    // Verify key dashboard elements
    await expect(page.locator('text=Total Earnings')).toBeVisible();
    await expect(page.locator('text=Total Expenses')).toBeVisible();
    await expect(page.locator('text=Customers')).toBeVisible();
    
    // Test 4: Customer Management
    console.log('Testing customer management...');
    
    await page.click('text=Customers');
    await expect(page.locator('text=Customer Management')).toBeVisible();
    
    // Add new customer
    await page.click('button:has-text("Add Customer")');
    await page.fill('input[name="name"]', testCustomer.name);
    await page.fill('input[name="email"]', testCustomer.email);
    await page.fill('input[name="phone"]', testCustomer.phone);
    await page.fill('textarea[name="address"]', testCustomer.address);
    await page.click('button:has-text("Save")');
    
    // Verify customer was added
    await expect(page.locator(`text=${testCustomer.name}`)).toBeVisible();
    
    // Test 5: Expense Management
    console.log('Testing expense management...');
    
    await page.click('text=Expenses');
    await expect(page.locator('text=Expense Management')).toBeVisible();
    
    // Add new expense
    await page.click('button:has-text("Add Expense")');
    await page.fill('input[name="description"]', testExpense.description);
    await page.fill('input[name="amount"]', testExpense.amount);
    
    // Select category (if dropdown exists)
    const categorySelect = page.locator('select[name="category"]');
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption(testExpense.category);
    }
    
    await page.click('button:has-text("Save")');
    
    // Verify expense was added
    await expect(page.locator(`text=${testExpense.description}`)).toBeVisible();
    
    // Test 6: Invoice Creation
    console.log('Testing invoice creation...');
    
    await page.click('text=Invoices');
    await page.click('button:has-text("Create Invoice")');
    
    // Select customer
    await page.click('text=Select Customer');
    await page.click(`text=${testCustomer.name}`);
    
    // Add invoice item
    await page.fill('input[placeholder*="Description"]', testInvoiceItem.description);
    await page.fill('input[placeholder*="Quantity"]', testInvoiceItem.quantity);
    await page.fill('input[placeholder*="Unit Price"]', testInvoiceItem.unitPrice);
    
    // Set GST rate if available
    const gstSelect = page.locator('select:has-text("GST")');
    if (await gstSelect.isVisible()) {
      await gstSelect.selectOption('15%');
    }
    
    // Save invoice
    await page.click('button:has-text("Save Invoice")');
    
    // Verify invoice was created
    await expect(page.locator('text=Invoice created successfully')).toBeVisible({ timeout: 10000 });
    
    // Test 7: Invoice Preview and PDF Generation
    console.log('Testing invoice preview and PDF generation...');
    
    // Look for preview or download buttons
    const previewButton = page.locator('button:has-text("Preview")');
    const downloadButton = page.locator('button:has-text("Download")');
    
    if (await previewButton.isVisible()) {
      await previewButton.click();
      await expect(page.locator('text=Invoice Preview')).toBeVisible();
    }
    
    if (await downloadButton.isVisible()) {
      const downloadPromise = page.waitForDownload();
      await downloadButton.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.pdf');
    }
    
    // Test 8: Financial Reports
    console.log('Testing financial reports...');
    
    await page.click('text=Reports');
    await expect(page.locator('text=Financial Reports')).toBeVisible();
    
    // Test various report sections
    await testReportSection(page, 'Profit & Loss');
    await testReportSection(page, 'GST Summary');
    await testReportSection(page, 'Expense Summary');
    
    // Test 9: Tax Features (NZ Specific)
    console.log('Testing NZ tax features...');
    
    // Look for GST/IRD related features
    const taxSection = page.locator('text=Tax Overview');
    if (await taxSection.isVisible()) {
      await taxSection.click();
      await expect(page.locator('text=GST')).toBeVisible();
    }
    
    // Test 10: Mobile Responsiveness
    console.log('Testing mobile responsiveness...');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Verify mobile navigation works
    const mobileMenu = page.locator('button[aria-label*="menu"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('nav')).toBeVisible();
    }
    
    // Test 11: PWA Features
    console.log('Testing PWA features...');
    
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Check for PWA install prompt or service worker
    const installButton = page.locator('button:has-text("Install")');
    if (await installButton.isVisible()) {
      console.log('PWA install prompt detected');
    }
    
    // Test offline functionality (basic check)
    await page.context().setOffline(true);
    await page.reload();
    
    // Should show offline message or cached content
    const offlineIndicator = await page.locator('text=offline').isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Offline mode test:', offlineIndicator ? 'Detected offline handling' : 'No offline handling detected');
    
    await page.context().setOffline(false);
    
    // Test 12: Data Persistence and State Management
    console.log('Testing data persistence...');
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify that data persists after reload
    await page.goto('/customers');
    await expect(page.locator(`text=${testCustomer.name}`)).toBeVisible();
    
    await page.goto('/expenses');
    await expect(page.locator(`text=${testExpense.description}`)).toBeVisible();
    
    console.log('Comprehensive NZ accountant workflow test completed successfully!');
  });
});

// Helper function to fill business profile
async function fillBusinessProfile(page: Page, profile: typeof nzBusinessProfile) {
  const fields = [
    { name: 'businessName', value: profile.businessName },
    { name: 'businessEmail', value: profile.businessEmail },
    { name: 'address', value: profile.address },
    { name: 'city', value: profile.city },
    { name: 'postalCode', value: profile.postalCode },
    { name: 'phone', value: profile.phone },
    { name: 'gstNumber', value: profile.gstNumber }
  ];
  
  for (const field of fields) {
    const input = page.locator(`input[name="${field.name}"], textarea[name="${field.name}"]`);
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.fill(field.value);
    }
  }
  
  // Select country if dropdown exists
  const countrySelect = page.locator('select[name="country"]');
  if (await countrySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    await countrySelect.selectOption(profile.country);
  }
  
  // Save profile
  const saveButton = page.locator('button:has-text("Save"), button:has-text("Continue"), button:has-text("Complete")');
  if (await saveButton.isVisible()) {
    await saveButton.click();
  }
}

// Helper function to test report sections
async function testReportSection(page: Page, sectionName: string) {
  const section = page.locator(`text=${sectionName}`);
  if (await section.isVisible({ timeout: 5000 }).catch(() => false)) {
    await section.click();
    // Wait for report data to load
    await page.waitForTimeout(2000);
    console.log(`${sectionName} report section tested`);
  }
}