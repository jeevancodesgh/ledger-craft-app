import { test, expect, Page } from '@playwright/test';
import { AuthMocker } from './auth-utils';

/**
 * TDD TEST - INVOICE CREATION UI FIXES
 * 
 * This test is designed to FAIL initially, then drive the implementation
 * of proper data-testid attributes and reliable form interaction.
 * 
 * RED -> GREEN -> REFACTOR approach:
 * 1. RED: Write failing tests that describe ideal behavior
 * 2. GREEN: Add minimum code to make tests pass
 * 3. REFACTOR: Improve code quality while keeping tests passing
 */

interface InvoiceTestData {
  customer: string;
  invoiceNumber: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    expectedAmount: number;
  }>;
  expectedSubtotal: number;
  expectedGST: number;
  expectedTotal: number;
}

class InvoiceCreationTDDHelper {
  constructor(private page: Page) {}

  /**
   * Setup test environment with professional accounting data
   */
  async setupTestEnvironment() {
    const authMocker = new AuthMocker(this.page);
    await authMocker.mockCompletedOnboarding({
      email: 'test@accountant.co.nz',
      fullName: 'Test Accountant'
    });

    // Mock customer data
    await this.page.route('**/rest/v1/customers**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'customer-1',
              name: 'Auckland Business Ltd',
              email: 'billing@aucklandbiz.co.nz',
              phone: '+64-9-123-4567',
              address: '123 Queen Street, Auckland'
            },
            {
              id: 'customer-2', 
              name: 'Wellington Services',
              email: 'accounts@wellington.co.nz',
              phone: '+64-4-987-6543',
              address: '456 Lambton Quay, Wellington'
            }
          ])
        });
      } else {
        await route.continue();
      }
    });

    // Mock items data
    await this.page.route('**/rest/v1/items**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'item-1',
              name: 'Strategic Consulting',
              description: 'Business strategy consulting services',
              sale_price: 150.00,
              enableSaleInfo: true
            },
            {
              id: 'item-2',
              name: 'Financial Analysis',
              description: 'Detailed financial analysis and reporting',
              sale_price: 800.00,
              enableSaleInfo: true
            }
          ])
        });
      } else {
        await route.continue();
      }
    });

    // Mock invoice creation
    await this.page.route('**/rest/v1/invoices**', async route => {
      if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: `invoice-${Date.now()}`,
            invoice_number: body.invoiceNumber || 'INV-001',
            ...body,
            created_at: new Date().toISOString()
          }])
        });
      } else {
        await route.continue();
      }
    });

    console.log('✅ TDD Test environment setup complete');
  }

  /**
   * Test professional invoice creation workflow with data-testid selectors
   * This test will FAIL until proper attributes are added to the UI
   */
  async createProfessionalInvoice(testData: InvoiceTestData) {
    console.log(`🧪 Testing invoice creation for ${testData.customer}...`);
    
    // Navigate to create invoice page
    await this.page.goto('/invoices/new');
    await this.page.waitForTimeout(2000);

    // STEP 1: Verify page loads with proper structure
    await expect(this.page.locator('h1')).toContainText(/invoice/i, { timeout: 10000 });
    console.log('✅ Invoice page loaded');

    // STEP 2: Fill customer information using reliable data-testid selector
    const customerSelect = this.page.locator('[data-testid="customer-select"]');
    await expect(customerSelect).toBeVisible({ timeout: 5000 });
    await customerSelect.click();
    await customerSelect.fill(testData.customer);
    await this.page.keyboard.press('Enter');
    console.log(`✅ Customer selected: ${testData.customer}`);

    // STEP 3: Verify invoice number field
    const invoiceNumberField = this.page.locator('[data-testid="invoice-number"]');
    await expect(invoiceNumberField).toBeVisible();
    await invoiceNumberField.clear();
    await invoiceNumberField.fill(testData.invoiceNumber);
    console.log(`✅ Invoice number set: ${testData.invoiceNumber}`);

    // STEP 4: Add invoice items
    for (let i = 0; i < testData.items.length; i++) {
      const item = testData.items[i];
      
      // Click add item button
      const addItemButton = this.page.locator('[data-testid="add-item-button"]');
      if (i > 0) { // First item might already exist
        await addItemButton.click();
      }
      
      // Fill item details
      await this.page.locator(`[data-testid="item-description-${i}"]`).fill(item.description);
      await this.page.locator(`[data-testid="item-quantity-${i}"]`).fill(item.quantity.toString());
      await this.page.locator(`[data-testid="item-rate-${i}"]`).fill(item.rate.toString());
      
      // Verify calculated amount
      await expect(this.page.locator(`[data-testid="item-amount-${i}"]`))
        .toContainText(item.expectedAmount.toFixed(2));
      
      console.log(`✅ Item ${i + 1} added: ${item.description}`);
    }

    // STEP 5: Verify calculations
    await expect(this.page.locator('[data-testid="invoice-subtotal"]'))
      .toContainText(testData.expectedSubtotal.toFixed(2));
    
    await expect(this.page.locator('[data-testid="invoice-gst"]'))
      .toContainText(testData.expectedGST.toFixed(2));
    
    await expect(this.page.locator('[data-testid="invoice-total"]'))
      .toContainText(testData.expectedTotal.toFixed(2));
    
    console.log('✅ Tax calculations verified');

    // STEP 6: Save the invoice
    const saveButton = this.page.locator('[data-testid="save-invoice-button"]');
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // STEP 7: Verify success
    await expect(this.page.locator('[data-testid="success-message"]'))
      .toBeVisible({ timeout: 10000 });
    
    console.log('✅ Invoice saved successfully');
    return testData.invoiceNumber;
  }

  /**
   * Test export customer handling (zero-rated GST)
   */
  async createExportInvoice() {
    console.log('🌍 Testing export invoice creation...');
    
    await this.page.goto('/invoices/new');
    await this.page.waitForTimeout(2000);

    // Select export customer
    const customerSelect = this.page.locator('[data-testid="customer-select"]');
    await customerSelect.click();
    await customerSelect.fill('Export Customer');
    
    // Verify zero-rated GST is applied
    await this.page.locator('[data-testid="item-description-0"]').fill('Export Services');
    await this.page.locator('[data-testid="item-quantity-0"]').fill('1');
    await this.page.locator('[data-testid="item-rate-0"]').fill('1000');
    
    // For export customers, GST should be 0
    await expect(this.page.locator('[data-testid="invoice-gst"]'))
      .toContainText('0.00');
    
    console.log('✅ Export invoice GST handling verified');
  }

  /**
   * Test form validation and error handling
   */
  async testFormValidation() {
    console.log('⚠️ Testing form validation...');
    
    await this.page.goto('/invoices/new');
    await this.page.waitForTimeout(2000);

    // Try to save without required fields
    const saveButton = this.page.locator('[data-testid="save-invoice-button"]');
    await saveButton.click();

    // Should show validation errors
    await expect(this.page.locator('[data-testid="customer-error"]'))
      .toBeVisible();
    
    await expect(this.page.locator('[data-testid="invoice-number-error"]'))
      .toBeVisible();
    
    console.log('✅ Form validation working correctly');
  }
}

// Test data for comprehensive invoice creation
const professionalInvoiceData: InvoiceTestData = {
  customer: 'Auckland Business Ltd',
  invoiceNumber: 'INV-2024-001',
  items: [
    {
      description: 'Strategic Business Consulting',
      quantity: 20,
      rate: 150.00,
      expectedAmount: 3000.00
    },
    {
      description: 'Financial Analysis Report',
      quantity: 1,
      rate: 800.00,
      expectedAmount: 800.00
    }
  ],
  expectedSubtotal: 3800.00,
  expectedGST: 570.00, // 15% of 3800
  expectedTotal: 4370.00
};

test.describe('TDD - Invoice Creation UI Implementation', () => {
  let helper: InvoiceCreationTDDHelper;

  test.beforeEach(async ({ page }) => {
    helper = new InvoiceCreationTDDHelper(page);
    await helper.setupTestEnvironment();
  });

  test('RED: Invoice creation with data-testid selectors - SHOULD FAIL INITIALLY', async ({ page }) => {
    console.log('🔴 RED PHASE: This test should fail until data-testid attributes are implemented');
    
    try {
      await helper.createProfessionalInvoice(professionalInvoiceData);
      console.log('🟢 Test passed - implementation is complete!');
    } catch (error) {
      console.log('🔴 Test failed as expected - implementation needed');
      console.log('Missing data-testid attributes:', error);
      
      // This is expected to fail initially
      // The failure will drive the implementation
      throw error;
    }
  });

  test('Export Invoice Creation (Zero-rated GST)', async ({ page }) => {
    console.log('🧪 Testing export invoice functionality...');
    
    try {
      await helper.createExportInvoice();
    } catch (error) {
      console.log('Export functionality needs implementation');
      throw error;
    }
  });

  test('Form Validation and Error Handling', async ({ page }) => {
    console.log('🧪 Testing form validation...');
    
    try {
      await helper.testFormValidation();
    } catch (error) {
      console.log('Form validation needs enhancement');
      throw error;
    }
  });

  test('Invoice Number Auto-generation', async ({ page }) => {
    console.log('🧪 Testing invoice number auto-generation...');
    
    await page.goto('/invoices/create');
    await page.waitForTimeout(2000);
    
    // Should have auto-generated invoice number
    const invoiceNumberField = page.locator('[data-testid="invoice-number"]');
    const invoiceNumber = await invoiceNumberField.inputValue();
    
    expect(invoiceNumber).toMatch(/INV-\d+/);
    console.log(`✅ Auto-generated invoice number: ${invoiceNumber}`);
  });

  test('Customer Selection and Information Display', async ({ page }) => {
    console.log('🧪 Testing customer selection...');
    
    await page.goto('/invoices/create');
    await page.waitForTimeout(2000);
    
    const customerSelect = page.locator('[data-testid="customer-select"]');
    await customerSelect.click();
    await customerSelect.fill('Auckland Business Ltd');
    await page.keyboard.press('Enter');
    
    // Should display customer information
    await expect(page.locator('[data-testid="customer-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-info"]'))
      .toContainText('Auckland Business Ltd');
    
    console.log('✅ Customer selection and display verified');
  });

  test('Tax Calculation Accuracy', async ({ page }) => {
    console.log('🧪 Testing tax calculation accuracy...');
    
    await page.goto('/invoices/create');
    await page.waitForTimeout(2000);
    
    // Fill basic invoice data
    await page.locator('[data-testid="customer-select"]').click();
    await page.locator('[data-testid="customer-select"]').fill('Auckland Business Ltd');
    await page.keyboard.press('Enter');
    
    // Add item with known values
    await page.locator('[data-testid="item-description-0"]').fill('Test Service');
    await page.locator('[data-testid="item-quantity-0"]').fill('1');
    await page.locator('[data-testid="item-rate-0"]').fill('100.00');
    
    // Verify calculations (15% GST on $100 = $15)
    await expect(page.locator('[data-testid="invoice-subtotal"]'))
      .toContainText('100.00');
    await expect(page.locator('[data-testid="invoice-gst"]'))
      .toContainText('15.00');
    await expect(page.locator('[data-testid="invoice-total"]'))
      .toContainText('115.00');
    
    console.log('✅ Tax calculations verified as accurate');
  });
});

/**
 * IMPLEMENTATION CHECKLIST
 * 
 * Based on these failing tests, the following data-testid attributes need to be added:
 * 
 * 🔴 CRITICAL (Tests will fail without these):
 * - [data-testid="customer-select"] - Customer selection dropdown
 * - [data-testid="invoice-number"] - Invoice number input field
 * - [data-testid="add-item-button"] - Add new item button
 * - [data-testid="item-description-{index}"] - Item description inputs
 * - [data-testid="item-quantity-{index}"] - Item quantity inputs
 * - [data-testid="item-rate-{index}"] - Item rate inputs
 * - [data-testid="item-amount-{index}"] - Item calculated amounts
 * - [data-testid="invoice-subtotal"] - Invoice subtotal display
 * - [data-testid="invoice-gst"] - GST amount display
 * - [data-testid="invoice-total"] - Total amount display
 * - [data-testid="save-invoice-button"] - Save invoice button
 * - [data-testid="success-message"] - Success confirmation
 * 
 * ⚠️ MEDIUM PRIORITY:
 * - [data-testid="customer-info"] - Customer information display
 * - [data-testid="customer-error"] - Customer validation error
 * - [data-testid="invoice-number-error"] - Invoice number validation error
 * 
 * 📊 ENHANCEMENT:
 * - [data-testid="gst-rate-select"] - GST rate selection
 * - [data-testid="tax-inclusive-toggle"] - Tax inclusive/exclusive toggle
 * - [data-testid="export-customer-indicator"] - Export customer indicator
 * 
 * NEXT STEPS:
 * 1. Run this test to see it fail (RED phase)
 * 2. Add minimum data-testid attributes to make tests pass (GREEN phase)
 * 3. Refactor and improve implementation (REFACTOR phase)
 * 4. Run tests again to ensure they pass
 */