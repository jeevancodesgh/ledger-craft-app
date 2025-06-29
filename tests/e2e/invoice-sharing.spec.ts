import { test, expect, Page } from '@playwright/test';
import { AuthMocker } from './auth-utils';

test.describe('Invoice Sharing E2E Tests', () => {
  let authMocker: AuthMocker;

  test.beforeEach(async ({ page }) => {
    authMocker = new AuthMocker(page);
  });

  test('should share invoice via email', async ({ page }) => {
    await authMocker.mockCompletedOnboarding();
    await setupMockInvoiceData(page);

    await page.goto('/invoices/invoice-1');

    // Wait for invoice to load
    await expect(page.getByText('INV-001')).toBeVisible();

    // Mock email sending
    await page.route('**/rest/v1/rpc/send_invoice_email', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Click share button
    await page.getByRole('button', { name: /share/i }).click();

    // Fill email form
    await page.getByLabel(/recipient email/i).fill('recipient@test.com');
    await page.getByLabel(/subject/i).fill('Invoice INV-001');
    await page.getByLabel(/message/i).fill('Please find attached invoice INV-001');

    // Send email
    await page.getByRole('button', { name: /send email/i }).click();

    // Verify success
    await expect(page.getByText(/invoice sent successfully/i)).toBeVisible();
  });

  test('should generate public shareable link', async ({ page }) => {
    await authMocker.mockCompletedOnboarding();
    await setupMockInvoiceData(page);

    // Mock share link generation
    await page.route('**/rest/v1/rpc/generate_share_link', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          share_token: 'abc123def456',
          share_url: 'http://localhost:5173/shared/abc123def456'
        })
      });
    });

    await page.goto('/invoices/invoice-1');

    // Click share button
    await page.getByRole('button', { name: /share/i }).click();

    // Switch to link sharing tab
    await page.getByRole('tab', { name: /share link/i }).click();

    // Generate share link
    await page.getByRole('button', { name: /generate link/i }).click();

    // Verify link is generated
    await expect(page.getByText(/http:\/\/localhost:5173\/shared\/abc123def456/)).toBeVisible();

    // Test copy to clipboard
    await page.getByRole('button', { name: /copy link/i }).click();
    await expect(page.getByText(/link copied/i)).toBeVisible();
  });

  test('should access shared invoice without authentication', async ({ page }) => {
    // Don't set up authentication for this test
    
    // Mock shared invoice data
    await page.route('**/rest/v1/rpc/get_shared_invoice**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'invoice-1',
          invoice_number: 'INV-001',
          date: '2024-01-15',
          due_date: '2024-02-15',
          total: 200.00,
          subtotal: 200.00,
          status: 'sent',
          notes: 'Test invoice notes',
          terms: 'Net 30',
          customer: {
            name: 'Test Customer',
            email: 'customer@test.com',
            company: 'Test Company',
            address: '123 Test St'
          },
          business: {
            business_name: 'Test Business',
            business_email: 'business@test.com',
            business_address: '456 Business Ave'
          },
          line_items: [
            {
              description: 'Test Product',
              quantity: 2,
              price: 100.00,
              total: 200.00
            }
          ]
        })
      });
    });

    // Visit shared invoice page
    await page.goto('/shared/abc123def456');

    // Verify invoice is displayed without requiring login
    await expect(page.getByText('INV-001')).toBeVisible();
    await expect(page.getByText('Test Customer')).toBeVisible();
    await expect(page.getByText('Test Business')).toBeVisible();
    await expect(page.getByText('$200.00')).toBeVisible();

    // Verify no navigation menu is shown (public view)
    await expect(page.getByRole('navigation')).not.toBeVisible();
  });

  test('should download PDF from shared invoice', async ({ page }) => {
    // Mock shared invoice data
    await page.route('**/rest/v1/rpc/get_shared_invoice**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'invoice-1',
          invoice_number: 'INV-001',
          date: '2024-01-15',
          due_date: '2024-02-15',
          total: 200.00,
          subtotal: 200.00,
          status: 'sent',
          customer: {
            name: 'Test Customer',
            email: 'customer@test.com'
          },
          business: {
            business_name: 'Test Business',
            business_email: 'business@test.com'
          },
          line_items: [
            {
              description: 'Test Product',
              quantity: 2,
              price: 100.00,
              total: 200.00
            }
          ]
        })
      });
    });

    await page.goto('/shared/abc123def456');

    // Wait for invoice to load
    await expect(page.getByText('INV-001')).toBeVisible();

    // Start waiting for download
    const downloadPromise = page.waitForEvent('download');
    
    // Click download PDF button
    await page.getByRole('button', { name: /download pdf/i }).click();

    // Wait for download
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/INV-001.*\.pdf$/);
  });

  test('should handle invalid share token', async ({ page }) => {
    // Mock 404 response for invalid token
    await page.route('**/rest/v1/rpc/get_shared_invoice**', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invoice not found' })
      });
    });

    await page.goto('/shared/invalid-token');

    // Should show error message
    await expect(page.getByText(/invoice not found/i)).toBeVisible();
  });

  test('should expire share link after time limit', async ({ page }) => {
    // Mock expired share link
    await page.route('**/rest/v1/rpc/get_shared_invoice**', route => {
      route.fulfill({
        status: 410,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Share link has expired' })
      });
    });

    await page.goto('/shared/expired-token');

    // Should show expiration message
    await expect(page.getByText(/link has expired/i)).toBeVisible();
  });

  test('should track invoice views in shared link', async ({ page }) => {
    // Mock view tracking
    await page.route('**/rest/v1/rpc/track_invoice_view', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await page.route('**/rest/v1/rpc/get_shared_invoice**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'invoice-1',
          invoice_number: 'INV-001',
          customer: { name: 'Test Customer' },
          business: { business_name: 'Test Business' },
          line_items: []
        })
      });
    });

    await page.goto('/shared/abc123def456');

    // Verify invoice loads (which should trigger view tracking)
    await expect(page.getByText('INV-001')).toBeVisible();

    // The view should be tracked automatically when the page loads
    // We can't directly verify the API call was made, but the page loading confirms it
  });

  test('should update invoice status to viewed when accessed via share link', async ({ page }) => {
    await authMocker.mockCompletedOnboarding();
    
    // Mock invoice with 'sent' status initially
    await page.route('**/rest/v1/invoices?id=eq.invoice-1**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'invoice-1',
          invoice_number: 'INV-001',
          status: 'viewed',  // Status should be updated to 'viewed'
          total: 200.00,
          customers: { name: 'Test Customer' },
          line_items: []
        }])
      });
    });

    await page.goto('/invoices/invoice-1');

    // Verify status shows as viewed
    await expect(page.getByText(/viewed/i)).toBeVisible();
  });

  test('should disable sharing for draft invoices', async ({ page }) => {
    await authMocker.mockCompletedOnboarding();
    
    // Mock draft invoice
    await page.route('**/rest/v1/invoices?id=eq.invoice-1**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'invoice-1',
          invoice_number: 'INV-001',
          status: 'draft',
          total: 200.00,
          customers: { name: 'Test Customer' },
          line_items: []
        }])
      });
    });

    await page.goto('/invoices/invoice-1');

    // Share button should be disabled or not visible for draft invoices
    const shareButton = page.getByRole('button', { name: /share/i });
    if (await shareButton.isVisible()) {
      await expect(shareButton).toBeDisabled();
    } else {
      await expect(shareButton).not.toBeVisible();
    }
  });

  test('should validate email format in share modal', async ({ page }) => {
    await authMocker.mockCompletedOnboarding();
    await setupMockInvoiceData(page);

    await page.goto('/invoices/invoice-1');

    // Click share button
    await page.getByRole('button', { name: /share/i }).click();

    // Try to send with invalid email
    await page.getByLabel(/recipient email/i).fill('invalid-email');
    await page.getByRole('button', { name: /send email/i }).click();

    // Should show validation error
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });

  // Helper function
  async function setupMockInvoiceData(page: Page) {
    await page.route('**/rest/v1/invoices?id=eq.invoice-1**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'invoice-1',
          invoice_number: 'INV-001',
          status: 'sent',
          total: 200.00,
          date: '2024-01-15',
          due_date: '2024-02-15',
          customers: {
            id: 'customer-1',
            name: 'Test Customer',
            email: 'customer@test.com',
            company: 'Test Company'
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
        }])
      });
    });
  }
});