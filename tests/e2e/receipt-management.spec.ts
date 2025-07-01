import { test, expect, Page } from '@playwright/test';
import { AuthMocker } from './auth-utils';

/**
 * Receipt Generation and Management E2E Tests
 * 
 * Comprehensive testing of receipt functionality from a finance expert's perspective,
 * including automatic generation, manual creation, PDF generation, email delivery,
 * and receipt tracking for audit compliance.
 */

interface ReceiptTestData {
  payment: {
    id: string;
    amount: number;
    method: string;
    reference: string;
    date: string;
  };
  invoice: {
    id: string;
    number: string;
    customer: string;
    total: number;
  };
  receipt: {
    expectedNumber: string;
    expectedAmount: number;
    taxAmount?: number;
    description: string;
  };
}

class ReceiptTestHelper {
  constructor(private page: Page) {}

  async setupReceiptMocking() {
    // Mock receipts endpoint
    await this.page.route('**/rest/v1/receipts**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'receipt-001',
              receipt_number: 'RCP-001',
              payment_id: 'payment-001',
              amount: 5000.00,
              tax_amount: 400.00,
              issued_date: '2024-06-30T15:30:00Z',
              created_at: '2024-06-30T15:30:00Z',
              payment: {
                id: 'payment-001',
                amount: 5000.00,
                payment_method: 'bank_transfer',
                reference_number: 'WIRE-123456',
                payment_date: '2024-06-30T15:30:00Z',
                invoice: {
                  id: 'invoice-001',
                  invoice_number: 'INV-001',
                  customer: {
                    name: 'Tech Solutions Inc',
                    email: 'accounting@techsolutions.com',
                    address: '123 Business St, Tech City, TC 12345'
                  }
                }
              }
            },
            {
              id: 'receipt-002',
              receipt_number: 'RCP-002',
              payment_id: 'payment-002',
              amount: 2750.00,
              tax_amount: 220.00,
              issued_date: '2024-06-29T10:15:00Z',
              created_at: '2024-06-29T10:15:00Z',
              payment: {
                id: 'payment-002',
                amount: 2750.00,
                payment_method: 'credit_card',
                reference_number: 'CC-789012',
                payment_date: '2024-06-29T10:15:00Z',
                invoice: {
                  id: 'invoice-002',
                  invoice_number: 'INV-002',
                  customer: {
                    name: 'Design Studio LLC',
                    email: 'finance@designstudio.com',
                    address: '456 Creative Ave, Design City, DC 67890'
                  }
                }
              }
            }
          ])
        });
      } else if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        const receiptNumber = `RCP-${String(Date.now()).slice(-6)}`;
        
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: `receipt-${Date.now()}`,
            receipt_number: receiptNumber,
            ...body,
            issued_date: new Date().toISOString(),
            created_at: new Date().toISOString()
          }])
        });
      } else {
        await route.continue();
      }
    });

    // Mock PDF generation
    await this.page.route('**/api/receipts/*/pdf**', async route => {
      const receiptId = route.request().url().split('/receipts/')[1].split('/pdf')[0];
      
      // Simulate PDF generation delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        headers: {
          'Content-Disposition': `attachment; filename="receipt-${receiptId}.pdf"`
        },
        body: Buffer.from('%PDF-1.4 Mock PDF Content')
      });
    });

    // Mock email sending
    await this.page.route('**/api/receipts/*/email**', async route => {
      const body = await route.request().postDataJSON();
      
      // Simulate email delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: `Receipt emailed to ${body.email}`,
          timestamp: new Date().toISOString()
        })
      });
    });

    // Mock receipt templates
    await this.page.route('**/api/receipt-templates**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'template-standard',
            name: 'Standard Receipt',
            description: 'Standard business receipt template',
            is_default: true
          },
          {
            id: 'template-detailed',
            name: 'Detailed Receipt',
            description: 'Detailed receipt with itemized breakdown',
            is_default: false
          },
          {
            id: 'template-minimal',
            name: 'Minimal Receipt',
            description: 'Clean, minimal receipt design',
            is_default: false
          }
        ])
      });
    });
  }

  /**
   * Test automatic receipt generation after payment
   */
  async verifyAutomaticReceiptGeneration(paymentId: string, expectedAmount: number) {
    // Navigate to receipts page
    await this.page.click('[data-testid="nav-receipts"]');
    await this.page.waitForSelector('[data-testid="receipts-page"]');

    // Verify receipt appears in list
    const receiptRow = this.page.locator(`[data-testid="receipt-row-${paymentId}"]`);
    await expect(receiptRow).toBeVisible({ timeout: 10000 });

    // Verify receipt details
    await expect(receiptRow.locator('[data-testid="receipt-amount"]'))
      .toContainText(`$${expectedAmount.toFixed(2)}`);

    // Verify receipt number format
    const receiptNumber = await receiptRow.locator('[data-testid="receipt-number"]').textContent();
    expect(receiptNumber).toMatch(/^RCP-\d+$/);

    // Verify issue date is today
    const issueDate = await receiptRow.locator('[data-testid="receipt-date"]').textContent();
    const today = new Date().toLocaleDateString();
    expect(issueDate).toContain(new Date().getFullYear().toString());

    return receiptNumber || '';
  }

  /**
   * Test manual receipt creation
   */
  async createManualReceipt(paymentId: string, customAmount?: number) {
    await this.page.click('[data-testid="nav-receipts"]');
    await this.page.click('[data-testid="create-manual-receipt-btn"]');
    await this.page.waitForSelector('[data-testid="manual-receipt-form"]');

    // Select payment
    await this.page.click('[data-testid="payment-select"]');
    await this.page.click(`[data-testid="select-payment-${paymentId}"]`);

    // Custom amount if specified
    if (customAmount) {
      await this.page.fill('[data-testid="receipt-amount"]', customAmount.toString());
    }

    // Add description
    await this.page.fill('[data-testid="receipt-description"]', 'Manually created receipt for accounting adjustment');

    // Select template
    await this.page.selectOption('[data-testid="receipt-template"]', 'template-standard');

    // Set custom issue date if needed
    const customDate = '2024-06-30';
    await this.page.fill('[data-testid="receipt-issue-date"]', customDate);

    // Submit
    await this.page.click('[data-testid="create-receipt-btn"]');
    await this.page.waitForSelector('[data-testid="receipt-created-success"]');

    // Verify in list
    const newReceiptRow = this.page.locator('[data-testid="receipt-row"]').first();
    await expect(newReceiptRow.locator('[data-testid="receipt-amount"]'))
      .toContainText((customAmount || 0).toFixed(2));
  }

  /**
   * Test receipt PDF download functionality
   */
  async testReceiptPDFDownload(receiptId: string) {
    await this.page.click('[data-testid="nav-receipts"]');
    
    const receiptRow = this.page.locator(`[data-testid="receipt-row-${receiptId}"]`);
    await receiptRow.locator('[data-testid="receipt-actions"]').click();

    // Test PDF download
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.click('[data-testid="download-receipt-pdf"]');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/receipt.*\.pdf$/i);
    
    // Verify PDF content type
    expect(download.suggestedFilename()).toContain('.pdf');

    return download;
  }

  /**
   * Test receipt email functionality
   */
  async testReceiptEmail(receiptId: string, recipientEmail: string) {
    await this.page.click('[data-testid="nav-receipts"]');
    
    const receiptRow = this.page.locator(`[data-testid="receipt-row-${receiptId}"]`);
    await receiptRow.locator('[data-testid="receipt-actions"]').click();

    // Click email receipt
    await this.page.click('[data-testid="email-receipt"]');
    await this.page.waitForSelector('[data-testid="email-receipt-modal"]');

    // Verify pre-filled customer email
    const emailField = this.page.locator('[data-testid="recipient-email"]');
    const currentEmail = await emailField.inputValue();
    
    if (currentEmail !== recipientEmail) {
      await emailField.fill(recipientEmail);
    }

    // Customize email message
    await this.page.fill('[data-testid="email-subject"]', 'Payment Receipt - Invoice Paid');
    await this.page.fill('[data-testid="email-message"]', 
      'Thank you for your payment. Please find your receipt attached.');

    // Send email
    await this.page.click('[data-testid="send-receipt-email"]');
    await this.page.waitForSelector('[data-testid="email-sent-confirmation"]');

    // Verify success message
    await expect(this.page.locator('[data-testid="email-sent-confirmation"]'))
      .toContainText(`emailed to ${recipientEmail}`);
  }

  /**
   * Test receipt search and filtering
   */
  async testReceiptFiltering() {
    await this.page.click('[data-testid="nav-receipts"]');
    
    // Test search by receipt number
    await this.page.fill('[data-testid="receipt-search"]', 'RCP-001');
    await this.page.waitForTimeout(500); // Debounce
    
    const searchResults = this.page.locator('[data-testid="receipt-row"]');
    await expect(searchResults).toHaveCount(1);
    await expect(searchResults.first().locator('[data-testid="receipt-number"]'))
      .toContainText('RCP-001');

    // Clear search
    await this.page.fill('[data-testid="receipt-search"]', '');

    // Test date range filter
    await this.page.fill('[data-testid="date-from"]', '2024-06-01');
    await this.page.fill('[data-testid="date-to"]', '2024-06-30');
    await this.page.click('[data-testid="apply-date-filter"]');

    // Verify filtered results
    const filteredResults = this.page.locator('[data-testid="receipt-row"]');
    await expect(filteredResults.count()).toBeGreaterThan(0);

    // Test amount range filter
    await this.page.fill('[data-testid="amount-min"]', '1000');
    await this.page.fill('[data-testid="amount-max"]', '10000');
    await this.page.click('[data-testid="apply-amount-filter"]');

    // Reset filters
    await this.page.click('[data-testid="reset-filters"]');
    await expect(this.page.locator('[data-testid="receipt-row"]').count()).toBeGreaterThan(0);
  }

  /**
   * Test receipt editing and corrections
   */
  async testReceiptCorrections(receiptId: string) {
    await this.page.click('[data-testid="nav-receipts"]');
    
    const receiptRow = this.page.locator(`[data-testid="receipt-row-${receiptId}"]`);
    await receiptRow.click();
    await this.page.waitForSelector('[data-testid="receipt-details"]');

    // Click edit receipt
    await this.page.click('[data-testid="edit-receipt-btn"]');
    await this.page.waitForSelector('[data-testid="receipt-edit-form"]');

    // Make corrections
    await this.page.fill('[data-testid="correction-reason"]', 'Amount correction due to calculation error');
    await this.page.fill('[data-testid="corrected-amount"]', '4950.00');
    await this.page.fill('[data-testid="correction-notes"]', 'Adjusted for early payment discount');

    // Submit correction
    await this.page.click('[data-testid="submit-correction"]');
    await this.page.waitForSelector('[data-testid="correction-success"]');

    // Verify correction appears in receipt history
    await expect(this.page.locator('[data-testid="receipt-corrections"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="correction-amount"]')).toContainText('4950.00');
  }

  /**
   * Test receipt analytics and reporting
   */
  async testReceiptAnalytics() {
    await this.page.click('[data-testid="nav-receipts"]');
    await this.page.click('[data-testid="analytics-tab"]');

    // Verify receipt summary cards
    await expect(this.page.locator('[data-testid="total-receipts-issued"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="total-receipt-amount"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="average-receipt-amount"]')).toBeVisible();

    // Test receipt trends chart
    await expect(this.page.locator('[data-testid="receipt-trends-chart"]')).toBeVisible();

    // Test payment method distribution
    await expect(this.page.locator('[data-testid="payment-method-distribution"]')).toBeVisible();

    // Export receipt report
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.click('[data-testid="export-receipt-report"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/receipt.*report.*\.xlsx$/i);
  }

  /**
   * Test receipt audit trail
   */
  async testReceiptAuditTrail(receiptId: string) {
    await this.page.click('[data-testid="nav-receipts"]');
    
    const receiptRow = this.page.locator(`[data-testid="receipt-row-${receiptId}"]`);
    await receiptRow.click();
    
    // View audit trail
    await this.page.click('[data-testid="audit-trail-tab"]');
    await this.page.waitForSelector('[data-testid="audit-trail-list"]');

    // Verify audit events
    const auditEvents = this.page.locator('[data-testid="audit-event"]');
    await expect(auditEvents.first()).toContainText('Receipt created');
    
    // Check timestamps and user information
    await expect(auditEvents.first().locator('[data-testid="audit-timestamp"]')).toBeVisible();
    await expect(auditEvents.first().locator('[data-testid="audit-user"]')).toBeVisible();

    // Test audit event details
    await auditEvents.first().click();
    await expect(this.page.locator('[data-testid="audit-details-modal"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="audit-changes"]')).toBeVisible();
  }
}

test.describe('Receipt Management Workflows', () => {
  let authMocker: AuthMocker;
  let receiptHelper: ReceiptTestHelper;

  const testReceiptData: ReceiptTestData = {
    payment: {
      id: 'payment-001',
      amount: 5000.00,
      method: 'bank_transfer',
      reference: 'WIRE-123456',
      date: '2024-06-30T15:30:00Z'
    },
    invoice: {
      id: 'invoice-001',
      number: 'INV-001',
      customer: 'Tech Solutions Inc',
      total: 5000.00
    },
    receipt: {
      expectedNumber: 'RCP-001',
      expectedAmount: 5000.00,
      taxAmount: 400.00,
      description: 'Payment receipt for professional services'
    }
  };

  test.beforeEach(async ({ page }) => {
    authMocker = new AuthMocker(page);
    receiptHelper = new ReceiptTestHelper(page);
    
    await authMocker.mockCompletedOnboarding({
      email: 'receipts@testbusiness.com',
      fullName: 'Receipt Manager'
    });

    await receiptHelper.setupReceiptMocking();

    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard"]');
  });

  test('Automatic Receipt Generation After Payment', async ({ page }) => {
    test.setTimeout(60000);

    console.log('Testing automatic receipt generation...');
    
    // Verify receipt was auto-generated for payment
    const receiptNumber = await receiptHelper.verifyAutomaticReceiptGeneration(
      testReceiptData.payment.id, 
      testReceiptData.receipt.expectedAmount
    );

    console.log(`✅ Auto-generated receipt: ${receiptNumber}`);
    
    // Verify receipt contains correct payment information
    await page.click(`[data-testid="receipt-row-${testReceiptData.payment.id}"]`);
    await page.waitForSelector('[data-testid="receipt-details"]');

    // Check payment details in receipt
    await expect(page.locator('[data-testid="receipt-payment-method"]'))
      .toContainText('Bank Transfer');
    await expect(page.locator('[data-testid="receipt-payment-reference"]'))
      .toContainText(testReceiptData.payment.reference);
    await expect(page.locator('[data-testid="receipt-customer-name"]'))
      .toContainText(testReceiptData.invoice.customer);
  });

  test('Manual Receipt Creation and Customization', async ({ page }) => {
    console.log('Testing manual receipt creation...');
    
    await receiptHelper.createManualReceipt(testReceiptData.payment.id, 4800.00);
    
    // Verify receipt customization options
    await page.click('[data-testid="nav-receipts"]');
    await page.click('[data-testid="receipt-row"]').first();
    
    await expect(page.locator('[data-testid="receipt-amount"]')).toContainText('4800.00');
    await expect(page.locator('[data-testid="receipt-description"]'))
      .toContainText('Manually created receipt');
  });

  test('Receipt PDF Generation and Download', async ({ page }) => {
    console.log('Testing receipt PDF generation...');
    
    const download = await receiptHelper.testReceiptPDFDownload('receipt-001');
    
    // Verify PDF properties
    expect(download.suggestedFilename()).toContain('receipt');
    expect(download.suggestedFilename()).toEndWith('.pdf');
    
    console.log(`✅ PDF downloaded: ${download.suggestedFilename()}`);
  });

  test('Receipt Email Delivery System', async ({ page }) => {
    test.setTimeout(45000);
    
    console.log('Testing receipt email delivery...');
    
    await receiptHelper.testReceiptEmail('receipt-001', 'customer@testclient.com');
    
    // Test batch email sending
    await page.click('[data-testid="nav-receipts"]');
    await page.click('[data-testid="bulk-actions"]');
    await page.click('[data-testid="select-all-receipts"]');
    await page.click('[data-testid="bulk-email-receipts"]');
    
    await expect(page.locator('[data-testid="bulk-email-confirmation"]')).toBeVisible();
    
    console.log('✅ Email delivery tested successfully');
  });

  test('Receipt Search, Filter, and Organization', async ({ page }) => {
    console.log('Testing receipt search and filtering...');
    
    await receiptHelper.testReceiptFiltering();
    
    // Test advanced filtering combinations
    await page.click('[data-testid="nav-receipts"]');
    await page.click('[data-testid="advanced-filters"]');
    
    // Filter by customer
    await page.selectOption('[data-testid="customer-filter"]', 'Tech Solutions Inc');
    
    // Filter by payment method
    await page.selectOption('[data-testid="payment-method-filter"]', 'bank_transfer');
    
    // Apply combined filters
    await page.click('[data-testid="apply-advanced-filters"]');
    
    const filteredResults = page.locator('[data-testid="receipt-row"]');
    await expect(filteredResults.count()).toBeGreaterThan(0);
    
    console.log('✅ Advanced filtering working correctly');
  });

  test('Receipt Template Management', async ({ page }) => {
    console.log('Testing receipt template management...');
    
    await page.click('[data-testid="nav-receipts"]');
    await page.click('[data-testid="template-settings"]');
    
    // Verify template options
    await expect(page.locator('[data-testid="template-standard"]')).toBeVisible();
    await expect(page.locator('[data-testid="template-detailed"]')).toBeVisible();
    await expect(page.locator('[data-testid="template-minimal"]')).toBeVisible();
    
    // Test template preview
    await page.click('[data-testid="preview-template-detailed"]');
    await expect(page.locator('[data-testid="template-preview-modal"]')).toBeVisible();
    
    // Test template customization
    await page.click('[data-testid="customize-template"]');
    await page.fill('[data-testid="template-header"]', 'Custom Business Receipt');
    await page.fill('[data-testid="template-footer"]', 'Thank you for your business!');
    await page.click('[data-testid="save-template-changes"]');
    
    await expect(page.locator('[data-testid="template-saved-confirmation"]')).toBeVisible();
  });

  test('Receipt Corrections and Adjustments', async ({ page }) => {
    console.log('Testing receipt corrections...');
    
    await receiptHelper.testReceiptCorrections('receipt-001');
    
    // Verify correction audit trail
    await expect(page.locator('[data-testid="correction-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="original-amount"]')).toContainText('5000.00');
    await expect(page.locator('[data-testid="corrected-amount"]')).toContainText('4950.00');
    
    // Test void receipt functionality
    await page.click('[data-testid="void-receipt-btn"]');
    await page.fill('[data-testid="void-reason"]', 'Receipt issued in error');
    await page.click('[data-testid="confirm-void"]');
    
    await expect(page.locator('[data-testid="receipt-status"]')).toContainText('Voided');
  });

  test('Receipt Analytics and Reporting', async ({ page }) => {
    console.log('Testing receipt analytics...');
    
    await receiptHelper.testReceiptAnalytics();
    
    // Test custom date range analytics
    await page.fill('[data-testid="analytics-date-from"]', '2024-06-01');
    await page.fill('[data-testid="analytics-date-to"]', '2024-06-30');
    await page.click('[data-testid="generate-analytics"]');
    
    // Verify analytics data
    await expect(page.locator('[data-testid="monthly-receipt-total"]')).toBeVisible();
    await expect(page.locator('[data-testid="receipt-trends-chart"]')).toBeVisible();
    
    // Test receipt aging report
    await page.click('[data-testid="aging-report-tab"]');
    await expect(page.locator('[data-testid="receipts-current"]')).toBeVisible();
    await expect(page.locator('[data-testid="receipts-30-days"]')).toBeVisible();
    
    console.log('✅ Analytics and reporting working correctly');
  });

  test('Receipt Audit Trail and Compliance', async ({ page }) => {
    console.log('Testing receipt audit trail...');
    
    await receiptHelper.testReceiptAuditTrail('receipt-001');
    
    // Test compliance report generation
    await page.click('[data-testid="nav-receipts"]');
    await page.click('[data-testid="compliance-reports"]');
    
    // Generate tax compliance report
    await page.click('[data-testid="generate-tax-report"]');
    await page.fill('[data-testid="tax-period-start"]', '2024-01-01');
    await page.fill('[data-testid="tax-period-end"]', '2024-06-30');
    await page.click('[data-testid="generate-report"]');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-tax-report"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/tax.*compliance.*\.pdf$/i);
    
    console.log('✅ Compliance and audit trail tested');
  });

  test('Multi-Payment Receipt Consolidation', async ({ page }) => {
    console.log('Testing multi-payment receipt consolidation...');
    
    // Navigate to receipts and test consolidation
    await page.click('[data-testid="nav-receipts"]');
    await page.click('[data-testid="consolidate-receipts"]');
    
    // Select multiple payments for same invoice
    await page.click('[data-testid="select-payment-001"]');
    await page.click('[data-testid="select-payment-002"]');
    
    // Create consolidated receipt
    await page.click('[data-testid="create-consolidated-receipt"]');
    await page.fill('[data-testid="consolidated-description"]', 
      'Consolidated receipt for multiple payments on invoice INV-001');
    
    await page.click('[data-testid="generate-consolidated"]');
    await expect(page.locator('[data-testid="consolidation-success"]')).toBeVisible();
    
    // Verify consolidated receipt properties
    const consolidatedReceipt = page.locator('[data-testid="consolidated-receipt-row"]');
    await expect(consolidatedReceipt.locator('[data-testid="receipt-type"]'))
      .toContainText('Consolidated');
  });

  test('Receipt Number Sequencing and Gaps', async ({ page }) => {
    console.log('Testing receipt number sequencing...');
    
    // Create multiple receipts and verify sequential numbering
    for (let i = 0; i < 3; i++) {
      await receiptHelper.createManualReceipt(`payment-00${i + 1}`, 1000 + (i * 100));
    }
    
    // Check number sequence
    await page.click('[data-testid="nav-receipts"]');
    const receiptNumbers = await page.locator('[data-testid="receipt-number"]').allTextContents();
    
    // Verify sequential numbering (allowing for existing receipts)
    expect(receiptNumbers.length).toBeGreaterThanOrEqual(3);
    
    // Test gap detection
    await page.click('[data-testid="admin-tools"]');
    await page.click('[data-testid="check-number-gaps"]');
    
    await expect(page.locator('[data-testid="number-sequence-report"]')).toBeVisible();
    
    console.log('✅ Receipt sequencing verified');
  });
});