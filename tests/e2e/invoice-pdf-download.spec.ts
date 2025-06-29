import { test, expect, Page, Download } from '@playwright/test';
import { AuthMocker } from './auth-utils';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Invoice PDF Download E2E Tests', () => {
  let authMocker: AuthMocker;

  test.beforeEach(async ({ page }) => {
    authMocker = new AuthMocker(page);
  });

  test('should download PDF from invoice preview', async ({ page }) => {
    await authMocker.mockCompletedOnboarding();
    await setupMockData(page);

    await page.goto('/invoices/create');
    await fillBasicInvoiceForm(page);

    // Start waiting for download before clicking the download button
    const downloadPromise = page.waitForEvent('download');
    
    // Click download PDF button
    await page.getByRole('button', { name: /download pdf/i }).click();

    // Wait for download to complete
    const download = await downloadPromise;
    
    // Verify download properties
    expect(download.suggestedFilename()).toMatch(/INV-001.*\.pdf$/);
    
    // Save and verify file exists
    const downloadPath = path.join(__dirname, 'downloads', download.suggestedFilename());
    await download.saveAs(downloadPath);
    
    expect(fs.existsSync(downloadPath)).toBeTruthy();
    
    // Verify file size is reasonable (should be > 0 bytes)
    const stats = fs.statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
    
    // Clean up
    fs.unlinkSync(downloadPath);
  });

  test('should download PDF from invoices list', async ({ page }) => {
    await authMocker.mockCompletedOnboarding();
    
    // Mock invoices list
    await page.route('**/rest/v1/invoices**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'invoice-1',
            invoice_number: 'INV-001',
            customer_id: 'customer-1',
            status: 'sent',
            total: 200.00,
            date: '2024-01-15',
            due_date: '2024-02-15',
            customers: {
              name: 'Test Customer',
              email: 'customer@test.com'
            },
            line_items: [
              {
                id: 'line-1',
                description: 'Test Product',
                quantity: 2,
                price: 100.00,
                total: 200.00
              }
            ]
          }
        ])
      });
    });

    await page.goto('/invoices');

    // Wait for invoices to load
    await expect(page.getByText('INV-001')).toBeVisible();

    // Start waiting for download
    const downloadPromise = page.waitForEvent('download');
    
    // Click download button in the row
    await page.getByRole('button', { name: /download/i }).first().click();

    // Wait for download
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/INV-001.*\.pdf$/);
    
    // Save and verify
    const downloadPath = path.join(__dirname, 'downloads', download.suggestedFilename());
    await download.saveAs(downloadPath);
    
    expect(fs.existsSync(downloadPath)).toBeTruthy();
    
    // Clean up
    fs.unlinkSync(downloadPath);
  });

  test('should download PDF from invoice view page', async ({ page }) => {
    await authMocker.mockCompletedOnboarding();
    
    // Mock single invoice data
    await page.route('**/rest/v1/invoices?id=eq.invoice-1**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'invoice-1',
            invoice_number: 'INV-001',
            customer_id: 'customer-1',
            status: 'sent',
            total: 200.00,
            date: '2024-01-15',
            due_date: '2024-02-15',
            notes: 'Test invoice notes',
            customers: {
              id: 'customer-1',
              name: 'Test Customer',
              email: 'customer@test.com',
              company: 'Test Company',
              address: '123 Test St'
            },
            line_items: [
              {
                id: 'line-1',
                description: 'Test Product',
                quantity: 2,
                price: 100.00,
                total: 200.00
              }
            ]
          }
        ])
      });
    });

    await page.goto('/invoices/invoice-1');

    // Wait for invoice to load
    await expect(page.getByText('INV-001')).toBeVisible();
    await expect(page.getByText('Test Customer')).toBeVisible();

    // Start waiting for download
    const downloadPromise = page.waitForEvent('download');
    
    // Click download PDF button
    await page.getByRole('button', { name: /download pdf/i }).click();

    // Wait for download
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/INV-001.*\.pdf$/);
    
    // Save and verify
    const downloadPath = path.join(__dirname, 'downloads', download.suggestedFilename());
    await download.saveAs(downloadPath);
    
    expect(fs.existsSync(downloadPath)).toBeTruthy();
    
    // Verify file is a PDF by checking magic bytes
    const buffer = fs.readFileSync(downloadPath);
    expect(buffer.toString('ascii', 0, 4)).toBe('%PDF');
    
    // Clean up
    fs.unlinkSync(downloadPath);
  });

  test('should download PDF with different templates', async ({ page }) => {
    await authMocker.mockCompletedOnboarding();
    await setupMockData(page);

    await page.goto('/invoices/create');
    await fillBasicInvoiceForm(page);

    // Test each template
    const templates = ['Classic', 'Modern', 'Minimal', 'Executive', 'Corporate'];
    
    for (const template of templates) {
      // Select template
      await page.getByRole('button', { name: /template/i }).click();
      await page.getByText(template).click();
      
      // Download PDF
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /download pdf/i }).click();
      
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/INV-001.*\.pdf$/);
      
      // Save and verify
      const downloadPath = path.join(__dirname, 'downloads', `${template}_${download.suggestedFilename()}`);
      await download.saveAs(downloadPath);
      
      expect(fs.existsSync(downloadPath)).toBeTruthy();
      
      // Verify it's a valid PDF
      const buffer = fs.readFileSync(downloadPath);
      expect(buffer.toString('ascii', 0, 4)).toBe('%PDF');
      
      // Clean up
      fs.unlinkSync(downloadPath);
    }
  });

  test('should download PDF with complex invoice data', async ({ page }) => {
    await authMocker.mockCompletedOnboarding();
    await setupMockData(page);

    await page.goto('/invoices/create');

    // Fill complex invoice form
    await page.getByLabel(/customer/i).click();
    await page.getByText('Test Customer').click();

    // Add multiple line items
    await page.getByRole('button', { name: /add item/i }).click();
    await page.getByLabel(/item/i).first().click();
    await page.getByText('Test Product').click();
    await page.getByLabel(/quantity/i).first().fill('3');

    await page.getByRole('button', { name: /add item/i }).click();
    await page.getByLabel(/item/i).last().click();
    await page.getByText('Service Item').click();
    await page.getByLabel(/quantity/i).last().fill('2');

    // Add discount
    await page.getByLabel(/discount/i).fill('50');

    // Add additional charges
    await page.getByRole('button', { name: /add additional charge/i }).click();
    await page.getByLabel(/charge name/i).fill('Shipping');
    await page.getByLabel(/charge amount/i).fill('25');
    await page.getByRole('button', { name: /add charge/i }).click();

    await page.getByRole('button', { name: /add additional charge/i }).click();
    await page.getByLabel(/charge name/i).fill('Tax');
    await page.getByLabel(/charge amount/i).fill('30');
    await page.getByRole('button', { name: /add charge/i }).click();

    // Add notes and terms
    await page.getByLabel(/notes/i).fill('This is a complex invoice with multiple items, discount, and additional charges. Testing PDF generation with rich content.');
    await page.getByLabel(/terms/i).fill('Payment due within 30 days. Late payments subject to 1.5% monthly service charge.');

    // Download PDF
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /download pdf/i }).click();
    
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/INV-001.*\.pdf$/);
    
    // Save and verify
    const downloadPath = path.join(__dirname, 'downloads', 'complex_' + download.suggestedFilename());
    await download.saveAs(downloadPath);
    
    expect(fs.existsSync(downloadPath)).toBeTruthy();
    
    // Verify file size is larger (complex content)
    const stats = fs.statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(1000); // Should be reasonably sized
    
    // Clean up
    fs.unlinkSync(downloadPath);
  });

  test('should handle PDF download errors gracefully', async ({ page }) => {
    await authMocker.mockCompletedOnboarding();
    await setupMockData(page);

    await page.goto('/invoices/create');
    await fillBasicInvoiceForm(page);

    // Mock PDF generation to fail
    await page.addInitScript(() => {
      // Override the PDF generation function to throw an error
      window.html2canvas = () => Promise.reject(new Error('PDF generation failed'));
    });

    // Try to download PDF
    await page.getByRole('button', { name: /download pdf/i }).click();

    // Should show error message instead of downloading
    await expect(page.getByText(/error generating pdf/i)).toBeVisible();
  });

  test('should download PDF with business profile information', async ({ page }) => {
    await authMocker.mockCompletedOnboarding();
    
    // Mock business profile with complete information
    await page.route('**/rest/v1/business_profiles**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'business-1',
          business_name: 'Test Business LLC',
          business_email: 'business@test.com',
          business_phone: '555-0100',
          business_address: '456 Business Ave',
          country: 'United States',
          tax_id: 'TAX123456',
          website: 'https://testbusiness.com',
          logo_url: null
        }])
      });
    });

    await setupMockData(page);
    await page.goto('/invoices/create');
    await fillBasicInvoiceForm(page);

    // Download PDF
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /download pdf/i }).click();
    
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/INV-001.*\.pdf$/);
    
    // Save and verify
    const downloadPath = path.join(__dirname, 'downloads', 'business_' + download.suggestedFilename());
    await download.saveAs(downloadPath);
    
    expect(fs.existsSync(downloadPath)).toBeTruthy();
    
    // Clean up
    fs.unlinkSync(downloadPath);
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
    await page.getByLabel(/customer/i).click();
    await page.getByText('Test Customer').click();

    // Add line item
    await page.getByRole('button', { name: /add item/i }).click();
    await page.getByLabel(/item/i).first().click();
    await page.getByText('Test Product').click();
    await page.getByLabel(/quantity/i).first().fill('2');

    // Fill notes
    await page.getByLabel(/notes/i).fill('Test invoice notes');
  }

  test.beforeAll(async () => {
    // Ensure downloads directory exists
    const downloadsDir = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
  });

  test.afterAll(async () => {
    // Clean up downloads directory
    const downloadsDir = path.join(__dirname, 'downloads');
    if (fs.existsSync(downloadsDir)) {
      const files = fs.readdirSync(downloadsDir);
      for (const file of files) {
        fs.unlinkSync(path.join(downloadsDir, file));
      }
      fs.rmdirSync(downloadsDir);
    }
  });
});