import { test, expect, Page } from '@playwright/test';
import { AuthMocker } from './auth-utils';

/**
 * Comprehensive Finance Workflow E2E Tests
 * 
 * These tests simulate real-world financial workflows from a finance expert's perspective,
 * covering the complete invoice-to-payment-to-receipt cycle with accuracy validations
 * and accounting compliance checks.
 */

interface FinancialTestData {
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  invoice: {
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      expectedTotal: number;
    }>;
    tax: {
      rate: number;
      expectedAmount: number;
    };
    expectedSubtotal: number;
    expectedTotal: number;
    dueDate: string;
  };
  payment: {
    amount: number;
    method: 'bank_transfer' | 'cash' | 'cheque' | 'credit_card' | 'online';
    referenceNumber: string;
    notes: string;
  };
}

class FinanceTestHelper {
  constructor(private page: Page) {}

  /**
   * Mock comprehensive financial data for testing
   */
  async setupFinancialMocking() {
    await this.page.route('**/rest/v1/customers**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'customer-1',
              name: 'Acme Corporation',
              email: 'billing@acme.com',
              phone: '+1-555-0123',
              address: '123 Business Ave, Suite 100\nNew York, NY 10001'
            }
          ])
        });
      } else if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'new-customer-id',
            ...body
          }])
        });
      } else {
        await route.continue();
      }
    });

    await this.page.route('**/rest/v1/items**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'item-1',
              name: 'Professional Consulting',
              description: 'Strategic business consulting services',
              unit_price: 150.00,
              category: 'Services'
            },
            {
              id: 'item-2',
              name: 'Software License',
              description: 'Annual software license fee',
              unit_price: 2500.00,
              category: 'Software'
            }
          ])
        });
      } else {
        await route.continue();
      }
    });

    await this.page.route('**/rest/v1/invoices**', async route => {
      if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        const invoiceNumber = `INV-${Date.now()}`;
        
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'new-invoice-id',
            invoice_number: invoiceNumber,
            ...body,
            payment_status: 'unpaid',
            total_paid: 0,
            balance_due: body.total
          }])
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'invoice-1',
              invoice_number: 'INV-001',
              customer_id: 'customer-1',
              total: 3975.00,
              subtotal: 3750.00,
              tax_amount: 225.00,
              payment_status: 'unpaid',
              total_paid: 0,
              balance_due: 3975.00,
              due_date: '2024-07-30',
              created_at: '2024-06-30T10:00:00Z',
              customer: {
                name: 'Acme Corporation',
                email: 'billing@acme.com'
              }
            }
          ])
        });
      } else {
        await route.continue();
      }
    });

    await this.page.route('**/rest/v1/payments**', async route => {
      if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'new-payment-id',
            ...body,
            status: 'completed',
            payment_date: new Date().toISOString(),
            created_at: new Date().toISOString()
          }])
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'payment-1',
              invoice_id: 'invoice-1',
              amount: 3975.00,
              payment_method: 'bank_transfer',
              reference_number: 'TXN-123456',
              status: 'completed',
              payment_date: '2024-06-30T15:30:00Z',
              notes: 'Full payment received'
            }
          ])
        });
      } else {
        await route.continue();
      }
    });

    await this.page.route('**/rest/v1/receipts**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'receipt-1',
              payment_id: 'payment-1',
              receipt_number: 'RCP-001',
              amount: 3975.00,
              issued_date: '2024-06-30T15:30:00Z'
            }
          ])
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Create a test invoice with precise financial calculations
   */
  async createTestInvoice(data: FinancialTestData): Promise<string> {
    // Navigate to invoice creation
    await this.page.click('text=Create Invoice');
    await this.page.waitForSelector('[data-testid="invoice-form"]', { timeout: 10000 });

    // Select customer
    await this.page.click('[data-testid="customer-select"]');
    await this.page.click(`text=${data.customer.name}`);

    // Add items with precise quantities and prices
    for (const item of data.invoice.items) {
      await this.page.click('[data-testid="add-item-btn"]');
      
      const lastItemRow = this.page.locator('[data-testid^="item-row-"]').last();
      await lastItemRow.locator('[data-testid="item-description"]').fill(item.description);
      await lastItemRow.locator('[data-testid="item-quantity"]').fill(item.quantity.toString());
      await lastItemRow.locator('[data-testid="item-unit-price"]').fill(item.unitPrice.toString());
      
      // Verify calculated total for this line item
      const calculatedTotal = await lastItemRow.locator('[data-testid="item-total"]').textContent();
      expect(calculatedTotal?.replace(/[^0-9.]/g, '')).toBe(item.expectedTotal.toString());
    }

    // Set due date
    await this.page.fill('[data-testid="due-date"]', data.invoice.dueDate);

    // Verify subtotal calculation
    const subtotalElement = this.page.locator('[data-testid="invoice-subtotal"]');
    await expect(subtotalElement).toContainText(data.invoice.expectedSubtotal.toFixed(2));

    // Verify tax calculation
    const taxElement = this.page.locator('[data-testid="invoice-tax"]');
    await expect(taxElement).toContainText(data.invoice.tax.expectedAmount.toFixed(2));

    // Verify total calculation
    const totalElement = this.page.locator('[data-testid="invoice-total"]');
    await expect(totalElement).toContainText(data.invoice.expectedTotal.toFixed(2));

    // Save invoice
    await this.page.click('[data-testid="save-invoice-btn"]');
    await this.page.waitForSelector('[data-testid="invoice-success-message"]');

    // Extract invoice ID from success message or URL
    const currentUrl = this.page.url();
    const invoiceId = currentUrl.split('/').pop() || 'new-invoice-id';
    
    return invoiceId;
  }

  /**
   * Record payment with financial validation
   */
  async recordPayment(invoiceId: string, paymentData: FinancialTestData['payment']) {
    // Navigate to payments page
    await this.page.click('[data-testid="nav-payments"]');
    await this.page.waitForSelector('[data-testid="payments-page"]');

    // Click record payment
    await this.page.click('[data-testid="record-payment-btn"]');
    await this.page.waitForSelector('[data-testid="payment-form"]');

    // Select the invoice
    await this.page.click(`[data-testid="select-invoice-${invoiceId}"]`);

    // Fill payment details
    await this.page.fill('[data-testid="payment-amount"]', paymentData.amount.toString());
    await this.page.selectOption('[data-testid="payment-method"]', paymentData.method);
    await this.page.fill('[data-testid="payment-reference"]', paymentData.referenceNumber);
    await this.page.fill('[data-testid="payment-notes"]', paymentData.notes);

    // Set payment date to today
    const today = new Date().toISOString().split('T')[0];
    await this.page.fill('[data-testid="payment-date"]', today);

    // Verify payment amount matches invoice balance
    const balanceDueElement = this.page.locator('[data-testid="invoice-balance-due"]');
    const balanceDue = await balanceDueElement.textContent();
    const balanceAmount = parseFloat(balanceDue?.replace(/[^0-9.]/g, '') || '0');
    
    // Ensure payment amount doesn't exceed balance due
    expect(paymentData.amount).toBeLessThanOrEqual(balanceAmount);

    // Submit payment
    await this.page.click('[data-testid="submit-payment-btn"]');
    await this.page.waitForSelector('[data-testid="payment-success-message"]');
  }

  /**
   * Verify receipt generation and content
   */
  async verifyReceiptGeneration(paymentId: string, expectedAmount: number) {
    // Navigate to receipts page
    await this.page.click('[data-testid="nav-receipts"]');
    await this.page.waitForSelector('[data-testid="receipts-page"]');

    // Find the receipt for this payment
    const receiptRow = this.page.locator(`[data-testid="receipt-row-${paymentId}"]`);
    await expect(receiptRow).toBeVisible();

    // Verify receipt amount
    const receiptAmount = receiptRow.locator('[data-testid="receipt-amount"]');
    await expect(receiptAmount).toContainText(expectedAmount.toFixed(2));

    // Verify receipt number format
    const receiptNumber = receiptRow.locator('[data-testid="receipt-number"]');
    const receiptNumberText = await receiptNumber.textContent();
    expect(receiptNumberText).toMatch(/RCP-\d+/);

    // Click to view receipt details
    await receiptRow.click();
    await this.page.waitForSelector('[data-testid="receipt-details"]');

    // Verify receipt details
    await expect(this.page.locator('[data-testid="receipt-payment-amount"]'))
      .toContainText(expectedAmount.toFixed(2));
    
    await expect(this.page.locator('[data-testid="receipt-issue-date"]'))
      .toBeVisible();

    return receiptNumberText || '';
  }

  /**
   * Verify financial data accuracy across the system
   */
  async verifyFinancialAccuracy(invoiceId: string, paymentAmount: number) {
    // Check invoice status update
    await this.page.click('[data-testid="nav-invoices"]');
    await this.page.waitForSelector('[data-testid="invoices-page"]');

    const invoiceRow = this.page.locator(`[data-testid="invoice-row-${invoiceId}"]`);
    
    // Verify payment status
    const paymentStatus = invoiceRow.locator('[data-testid="payment-status"]');
    await expect(paymentStatus).toContainText('Paid');

    // Verify balance due is zero for full payment
    const balanceDue = invoiceRow.locator('[data-testid="balance-due"]');
    await expect(balanceDue).toContainText('0.00');

    // Check payment history
    await this.page.click('[data-testid="nav-payments"]');
    await this.page.waitForSelector('[data-testid="payments-page"]');

    // Verify payment appears in history
    const paymentRow = this.page.locator(`[data-testid="payment-row"]`).first();
    await expect(paymentRow.locator('[data-testid="payment-amount"]'))
      .toContainText(paymentAmount.toFixed(2));

    // Verify summary statistics
    const totalReceived = this.page.locator('[data-testid="total-received"]');
    await expect(totalReceived).toBeVisible();

    const totalPayments = this.page.locator('[data-testid="total-payments"]');
    await expect(totalPayments).toBeVisible();
  }

  /**
   * Test partial payment scenario
   */
  async testPartialPayment(invoiceId: string, partialAmount: number, invoiceTotal: number) {
    await this.recordPayment(invoiceId, {
      amount: partialAmount,
      method: 'bank_transfer',
      referenceNumber: 'PARTIAL-001',
      notes: 'Partial payment'
    });

    // Verify invoice still shows as partially paid
    await this.page.click('[data-testid="nav-invoices"]');
    const invoiceRow = this.page.locator(`[data-testid="invoice-row-${invoiceId}"]`);
    
    const paymentStatus = invoiceRow.locator('[data-testid="payment-status"]');
    await expect(paymentStatus).toContainText('Partially Paid');

    const balanceDue = invoiceRow.locator('[data-testid="balance-due"]');
    const expectedBalance = invoiceTotal - partialAmount;
    await expect(balanceDue).toContainText(expectedBalance.toFixed(2));
  }
}

test.describe('Complete Finance Workflow Tests', () => {
  let authMocker: AuthMocker;
  let financeHelper: FinanceTestHelper;

  const testData: FinancialTestData = {
    customer: {
      name: 'Acme Corporation',
      email: 'billing@acme.com',
      phone: '+1-555-0123',
      address: '123 Business Ave, Suite 100\nNew York, NY 10001'
    },
    invoice: {
      items: [
        {
          description: 'Professional Consulting Services',
          quantity: 25,
          unitPrice: 150.00,
          expectedTotal: 3750.00
        }
      ],
      tax: {
        rate: 0.06,
        expectedAmount: 225.00
      },
      expectedSubtotal: 3750.00,
      expectedTotal: 3975.00,
      dueDate: '2024-07-30'
    },
    payment: {
      amount: 3975.00,
      method: 'bank_transfer',
      referenceNumber: 'TXN-ACME-001',
      notes: 'Payment for professional consulting services - Invoice INV-001'
    }
  };

  test.beforeEach(async ({ page }) => {
    authMocker = new AuthMocker(page);
    financeHelper = new FinanceTestHelper(page);
    
    // Set up authenticated user with business profile
    await authMocker.mockCompletedOnboarding({
      email: 'finance@testbusiness.com',
      fullName: 'Finance Manager'
    });

    // Set up financial data mocking
    await financeHelper.setupFinancialMocking();

    // Navigate to dashboard
    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard"]');
  });

  test('Complete Invoice-to-Payment-to-Receipt Workflow', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for complex workflow

    // Step 1: Create Invoice with Financial Validation
    console.log('Step 1: Creating invoice with precise financial calculations...');
    const invoiceId = await financeHelper.createTestInvoice(testData);
    
    // Step 2: Record Payment
    console.log('Step 2: Recording payment with validation...');
    await financeHelper.recordPayment(invoiceId, testData.payment);
    
    // Step 3: Verify Receipt Generation
    console.log('Step 3: Verifying automatic receipt generation...');
    const receiptNumber = await financeHelper.verifyReceiptGeneration('new-payment-id', testData.payment.amount);
    
    // Step 4: Verify Financial Accuracy
    console.log('Step 4: Validating financial accuracy across system...');
    await financeHelper.verifyFinancialAccuracy(invoiceId, testData.payment.amount);
    
    console.log(`✅ Complete workflow test passed. Receipt: ${receiptNumber}`);
  });

  test('Multi-Item Invoice with Complex Tax Calculations', async ({ page }) => {
    const complexInvoiceData: FinancialTestData = {
      ...testData,
      invoice: {
        items: [
          {
            description: 'Software Development - Phase 1',
            quantity: 40,
            unitPrice: 125.00,
            expectedTotal: 5000.00
          },
          {
            description: 'Project Management Services',
            quantity: 20,
            unitPrice: 100.00,
            expectedTotal: 2000.00
          },
          {
            description: 'Quality Assurance Testing',
            quantity: 15,
            unitPrice: 75.00,
            expectedTotal: 1125.00
          }
        ],
        tax: {
          rate: 0.08,
          expectedAmount: 650.00 // 8% of 8125
        },
        expectedSubtotal: 8125.00,
        expectedTotal: 8775.00,
        dueDate: '2024-08-15'
      },
      payment: {
        amount: 8775.00,
        method: 'credit_card',
        referenceNumber: 'CC-PAYMENT-001',
        notes: 'Full payment for software development project'
      }
    };

    const invoiceId = await financeHelper.createTestInvoice(complexInvoiceData);
    await financeHelper.recordPayment(invoiceId, complexInvoiceData.payment);
    await financeHelper.verifyReceiptGeneration('new-payment-id', complexInvoiceData.payment.amount);
    await financeHelper.verifyFinancialAccuracy(invoiceId, complexInvoiceData.payment.amount);
  });

  test('Partial Payment Workflow', async ({ page }) => {
    const invoiceId = await financeHelper.createTestInvoice(testData);
    
    // First partial payment
    const firstPayment = 2000.00;
    await financeHelper.testPartialPayment(invoiceId, firstPayment, testData.invoice.expectedTotal);
    
    // Second partial payment to complete
    const secondPayment = testData.invoice.expectedTotal - firstPayment;
    await financeHelper.recordPayment(invoiceId, {
      amount: secondPayment,
      method: 'cash',
      referenceNumber: 'CASH-FINAL',
      notes: 'Final payment to complete invoice'
    });
    
    // Verify final payment status
    await financeHelper.verifyFinancialAccuracy(invoiceId, testData.invoice.expectedTotal);
  });

  test('Receipt Download and Email Functionality', async ({ page }) => {
    const invoiceId = await financeHelper.createTestInvoice(testData);
    await financeHelper.recordPayment(invoiceId, testData.payment);
    
    // Navigate to payment history
    await page.click('[data-testid="nav-payments"]');
    
    // Find payment and test actions
    const paymentRow = page.locator('[data-testid="payment-row"]').first();
    await paymentRow.locator('[data-testid="payment-actions"]').click();
    
    // Test receipt download
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-receipt"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/receipt.*\.pdf/i);
    
    // Test receipt email
    await paymentRow.locator('[data-testid="payment-actions"]').click();
    await page.click('[data-testid="email-receipt"]');
    await expect(page.locator('[data-testid="email-success-message"]')).toBeVisible();
  });

  test('Financial Data Export and Reporting', async ({ page }) => {
    // Create multiple transactions for reporting
    const invoice1 = await financeHelper.createTestInvoice(testData);
    await financeHelper.recordPayment(invoice1, testData.payment);
    
    // Navigate to financial reports
    await page.click('[data-testid="nav-financial-reports"]');
    await page.waitForSelector('[data-testid="financial-reports-page"]');
    
    // Verify summary cards show correct data
    const totalRevenue = page.locator('[data-testid="total-revenue"]');
    await expect(totalRevenue).toContainText(testData.invoice.expectedTotal.toFixed(2));
    
    const paymentsReceived = page.locator('[data-testid="payments-received"]');
    await expect(paymentsReceived).toContainText('1');
    
    // Test export functionality
    await page.click('[data-testid="export-payments"]');
    await expect(page.locator('[data-testid="export-success-message"]')).toBeVisible();
  });

  test('Error Handling and Edge Cases', async ({ page }) => {
    const invoiceId = await financeHelper.createTestInvoice(testData);
    
    // Test overpayment validation
    await page.click('[data-testid="nav-payments"]');
    await page.click('[data-testid="record-payment-btn"]');
    await page.click(`[data-testid="select-invoice-${invoiceId}"]`);
    
    // Try to enter amount greater than balance due
    const overpaymentAmount = testData.invoice.expectedTotal + 1000;
    await page.fill('[data-testid="payment-amount"]', overpaymentAmount.toString());
    
    // Should show validation error
    await expect(page.locator('[data-testid="overpayment-error"]')).toBeVisible();
    
    // Test negative amount
    await page.fill('[data-testid="payment-amount"]', '-100');
    await expect(page.locator('[data-testid="negative-amount-error"]')).toBeVisible();
    
    // Test empty required fields
    await page.fill('[data-testid="payment-amount"]', '');
    await page.click('[data-testid="submit-payment-btn"]');
    await expect(page.locator('[data-testid="required-field-error"]')).toBeVisible();
  });

  test('Currency Formatting and Precision', async ({ page }) => {
    const precisionTestData: FinancialTestData = {
      ...testData,
      invoice: {
        items: [
          {
            description: 'Precision Test Item',
            quantity: 3,
            unitPrice: 33.33,
            expectedTotal: 99.99
          }
        ],
        tax: {
          rate: 0.0825, // 8.25% tax rate
          expectedAmount: 8.25 // Should round properly
        },
        expectedSubtotal: 99.99,
        expectedTotal: 108.24,
        dueDate: '2024-07-30'
      },
      payment: {
        amount: 108.24,
        method: 'bank_transfer',
        referenceNumber: 'PRECISION-001',
        notes: 'Testing currency precision'
      }
    };

    const invoiceId = await financeHelper.createTestInvoice(precisionTestData);
    await financeHelper.recordPayment(invoiceId, precisionTestData.payment);
    
    // Verify all currency displays are properly formatted to 2 decimal places
    await page.click('[data-testid="nav-payments"]');
    const paymentAmount = page.locator('[data-testid="payment-amount"]').first();
    const amountText = await paymentAmount.textContent();
    expect(amountText).toMatch(/\$108\.24/);
  });
});