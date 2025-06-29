import { test, expect, Page } from '@playwright/test';
import { AuthMocker } from './auth-utils';

test.describe('Invoice Creation E2E Tests', () => {
  let authMocker: AuthMocker;

  test.beforeEach(async ({ page }) => {
    authMocker = new AuthMocker(page);
  });

  test('should create a basic invoice successfully', async ({ page }) => {
    // Set up authenticated user with business profile
    await authMocker.mockCompletedOnboarding({
      email: 'business@test.com',
      fullName: 'Business Owner'
    });

    // Mock customers and items data
    await page.route('**/rest/v1/customers**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'customer-1',
            name: 'Test Customer',
            email: 'customer@test.com',
            company: 'Test Company',
            address: '123 Test St',
            phone: '555-0123'
          }
        ])
      });
    });

    await page.route('**/rest/v1/items**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'item-1',
            name: 'Test Product',
            description: 'A test product',
            price: 100.00,
            unit: 'each'
          }
        ])
      });
    });

    // Mock invoice number generation
    await page.route('**/rest/v1/rpc/get_next_invoice_number', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify('INV-001')
      });
    });

    // Mock invoice creation
    await page.route('**/rest/v1/invoices', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'invoice-1',
            invoice_number: 'INV-001',
            customer_id: 'customer-1',
            status: 'draft',
            total: 100.00
          }])
        });
      } else {
        route.continue();
      }
    });

    // Navigate to create invoice page
    await page.goto('/invoices/create');

    // Wait for page to load
    await expect(page.getByText('Create Invoice')).toBeVisible();

    // Fill invoice form - customer is using a combobox
    await page.getByPlaceholder('Search and select a customer...').click();
    await page.getByText('Test Customer').click();

    // Add a line item
    await page.getByRole('button', { name: /add item/i }).click();
    await page.getByPlaceholder('Item description').fill('Test Product');
    await page.getByLabel(/quantity/i).first().fill('2');
    await page.getByLabel(/rate/i).first().fill('100');

    // Verify subtotal calculation
    await expect(page.getByText('$200.00')).toBeVisible();

    // Save invoice
    await page.getByRole('button', { name: /save invoice/i }).click();

    // Verify success
    await expect(page.getByText(/invoice created successfully/i)).toBeVisible();
  });

  test('should validate required fields in invoice form', async ({ page }) => {
    await authMocker.mockCompletedOnboarding();

    // Mock empty customers and items
    await page.route('**/rest/v1/customers**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.route('**/rest/v1/items**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/invoices/create');

    // Try to save without filling required fields
    await page.getByRole('button', { name: /save invoice/i }).click();

    // Check for validation errors
    await expect(page.getByText(/customer is required/i)).toBeVisible();
  });

  test('should calculate totals correctly with multiple line items', async ({ page }) => {
    await authMocker.mockCompletedOnboarding();

    // Mock data
    await setupMockData(page);

    await page.goto('/invoices/create');

    // Select customer
    await page.getByPlaceholder('Search and select a customer...').click();
    await page.getByText('Test Customer').click();

    // Add first item
    await page.getByRole('button', { name: /add item/i }).click();
    await page.getByPlaceholder('Item description').first().fill('Test Product');
    await page.getByLabel(/quantity/i).first().fill('2');
    await page.getByLabel(/rate/i).first().fill('100');

    // Add second item
    await page.getByRole('button', { name: /add item/i }).click();
    await page.getByPlaceholder('Item description').last().fill('Service Item');
    await page.getByLabel(/quantity/i).last().fill('1');
    await page.getByLabel(/rate/i).last().fill('50');

    // Verify subtotal (2 * 100 + 1 * 50 = 250)
    await expect(page.getByText('$250.00')).toBeVisible();

    // Add discount
    await page.getByLabel(/discount/i).fill('25');
    await expect(page.getByText('$225.00')).toBeVisible();

    // Add additional charges
    await page.getByLabel(/additional charges/i).fill('10');
    await expect(page.getByText('$235.00')).toBeVisible();
  });

  test('should handle customer creation from invoice form', async ({ page }) => {
    await authMocker.mockCompletedOnboarding();
    await setupMockData(page);

    // Mock customer creation
    await page.route('**/rest/v1/customers', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'new-customer-1',
            name: 'New Customer',
            email: 'new@test.com',
            company: 'New Company'
          }])
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/invoices/create');

    // Click add customer button
    await page.getByRole('button', { name: /add customer/i }).click();

    // Fill customer form
    await page.getByLabel(/customer name/i).fill('New Customer');
    await page.getByLabel(/email/i).fill('new@test.com');
    await page.getByLabel(/company/i).fill('New Company');

    // Save customer
    await page.getByRole('button', { name: /save customer/i }).click();

    // Verify customer is selected
    await expect(page.getByDisplayValue('New Customer')).toBeVisible();
  });

  test('should preview invoice before saving', async ({ page }) => {
    await authMocker.mockCompletedOnboarding();
    await setupMockData(page);

    await page.goto('/invoices/create');

    // Fill basic invoice data
    await fillBasicInvoiceForm(page);

    // Click preview
    await page.getByRole('button', { name: /preview/i }).click();

    // Verify preview shows invoice data
    await expect(page.getByText('INV-001')).toBeVisible();
    await expect(page.getByText('Test Customer')).toBeVisible();
    await expect(page.getByText('Test Product')).toBeVisible();
    await expect(page.getByText('$200.00')).toBeVisible();
  });

  test('should switch between different invoice templates', async ({ page }) => {
    await authMocker.mockCompletedOnboarding();
    await setupMockData(page);

    await page.goto('/invoices/create');
    await fillBasicInvoiceForm(page);

    // Open template selector
    await page.getByRole('button', { name: /template/i }).click();

    // Switch to Modern template
    await page.getByText('Modern').click();
    await expect(page.getByText(/modern template/i)).toBeVisible();

    // Switch to Minimal template
    await page.getByRole('button', { name: /template/i }).click();
    await page.getByText('Minimal').click();
    await expect(page.getByText(/minimal template/i)).toBeVisible();

    // Switch to Executive template
    await page.getByRole('button', { name: /template/i }).click();
    await page.getByText('Executive').click();
    await expect(page.getByText(/executive template/i)).toBeVisible();
  });

  test('should handle invoice with additional charges', async ({ page }) => {
    await authMocker.mockCompletedOnboarding();
    await setupMockData(page);

    await page.goto('/invoices/create');
    await fillBasicInvoiceForm(page);

    // Add shipping charge
    await page.getByRole('button', { name: /add additional charge/i }).click();
    await page.getByLabel(/charge name/i).fill('Shipping');
    await page.getByLabel(/charge amount/i).fill('15');
    await page.getByRole('button', { name: /add charge/i }).click();

    // Add tax charge
    await page.getByRole('button', { name: /add additional charge/i }).click();
    await page.getByLabel(/charge name/i).fill('Tax');
    await page.getByLabel(/charge amount/i).fill('20');
    await page.getByRole('button', { name: /add charge/i }).click();

    // Verify total includes additional charges (200 + 15 + 20 = 235)
    await expect(page.getByText('$235.00')).toBeVisible();
  });

  test('should save invoice as draft', async ({ page }) => {
    await authMocker.mockCompletedOnboarding();
    await setupMockData(page);

    await page.goto('/invoices/create');
    await fillBasicInvoiceForm(page);

    // Mock draft save
    await page.route('**/rest/v1/invoices', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'invoice-1',
            invoice_number: 'INV-001',
            status: 'draft'
          }])
        });
      } else {
        route.continue();
      }
    });

    // Save as draft
    await page.getByRole('button', { name: /save as draft/i }).click();

    // Verify success message
    await expect(page.getByText(/draft saved successfully/i)).toBeVisible();
  });

  // Helper functions
  async function setupMockData(page: Page) {
    await page.route('**/rest/v1/customers**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'customer-1',
            name: 'Test Customer',
            email: 'customer@test.com',
            company: 'Test Company',
            address: '123 Test St',
            phone: '555-0123'
          }
        ])
      });
    });

    await page.route('**/rest/v1/items**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'item-1',
            name: 'Test Product',
            description: 'A test product',
            price: 100.00,
            unit: 'each'
          },
          {
            id: 'item-2',
            name: 'Service Item',
            description: 'A service item',
            price: 50.00,
            unit: 'hour'
          }
        ])
      });
    });

    await page.route('**/rest/v1/rpc/get_next_invoice_number', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify('INV-001')
      });
    });
  }

  async function fillBasicInvoiceForm(page: Page) {
    // Select customer
    await page.getByPlaceholder('Search and select a customer...').click();
    await page.getByText('Test Customer').click();

    // Add line item
    await page.getByRole('button', { name: /add item/i }).click();
    await page.getByPlaceholder('Item description').fill('Test Product');
    await page.getByLabel(/quantity/i).first().fill('2');
    await page.getByLabel(/rate/i).first().fill('100');
  }
});