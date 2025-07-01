import { test, expect, Page } from '@playwright/test';
import { AuthMocker } from './auth-utils';

/**
 * Payment Processing E2E Tests
 * 
 * Focused tests for payment processing workflows, covering different payment methods,
 * statuses, and business scenarios from a finance operations perspective.
 */

interface PaymentTestScenario {
  name: string;
  invoice: {
    amount: number;
    customerName: string;
  };
  payments: Array<{
    amount: number;
    method: 'bank_transfer' | 'cash' | 'cheque' | 'credit_card' | 'online';
    reference: string;
    notes: string;
    expectedStatus: 'completed' | 'pending' | 'failed';
    delay?: number; // milliseconds to simulate processing time
  }>;
  expectedFinalStatus: 'paid' | 'partially_paid' | 'overdue';
  expectedBalance: number;
}

class PaymentTestHelper {
  constructor(private page: Page) {}

  async setupPaymentMocking() {
    // Mock invoices with various payment statuses
    await this.page.route('**/rest/v1/invoices**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'invoice-001',
              invoice_number: 'INV-001',
              customer_id: 'customer-1',
              total: 5000.00,
              subtotal: 4629.63,
              tax_amount: 370.37,
              payment_status: 'unpaid',
              total_paid: 0,
              balance_due: 5000.00,
              due_date: '2024-07-15',
              created_at: '2024-06-15T10:00:00Z',
              customer: {
                name: 'Tech Solutions Inc',
                email: 'accounting@techsolutions.com'
              }
            },
            {
              id: 'invoice-002',
              invoice_number: 'INV-002',
              customer_id: 'customer-2',
              total: 2750.00,
              subtotal: 2547.22,
              tax_amount: 202.78,
              payment_status: 'partially_paid',
              total_paid: 1000.00,
              balance_due: 1750.00,
              due_date: '2024-08-01',
              created_at: '2024-06-20T14:30:00Z',
              customer: {
                name: 'Design Studio LLC',
                email: 'finance@designstudio.com'
              }
            },
            {
              id: 'invoice-003',
              invoice_number: 'INV-003',
              customer_id: 'customer-3',
              total: 1200.00,
              subtotal: 1111.11,
              tax_amount: 88.89,
              payment_status: 'overdue',
              total_paid: 0,
              balance_due: 1200.00,
              due_date: '2024-06-01',
              created_at: '2024-05-15T09:15:00Z',
              customer: {
                name: 'Startup Ventures',
                email: 'billing@startup.com'
              }
            }
          ])
        });
      } else {
        await route.continue();
      }
    });

    // Mock payment creation with realistic processing
    await this.page.route('**/rest/v1/payments**', async route => {
      if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        
        // Simulate different payment processing outcomes
        let status = 'completed';
        if (body.payment_method === 'cheque') {
          status = 'pending'; // Cheques need clearance time
        } else if (body.amount > 10000) {
          status = 'pending'; // Large amounts need approval
        }

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: `payment-${Date.now()}`,
            ...body,
            status,
            payment_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            reference_number: body.reference_number || `AUTO-${Date.now()}`
          }])
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'payment-001',
              invoice_id: 'invoice-002',
              amount: 1000.00,
              payment_method: 'bank_transfer',
              reference_number: 'TXN-PARTIAL-001',
              status: 'completed',
              payment_date: '2024-06-25T10:30:00Z',
              notes: 'Partial payment - first installment'
            },
            {
              id: 'payment-002',
              invoice_id: 'invoice-001',
              amount: 5000.00,
              payment_method: 'credit_card',
              reference_number: 'CC-FULL-001',
              status: 'completed',
              payment_date: '2024-06-30T16:45:00Z',
              notes: 'Full payment via corporate credit card'
            }
          ])
        });
      } else {
        await route.continue();
      }
    });

    // Mock payment status updates (for pending payments)
    await this.page.route('**/rest/v1/payments/*', async route => {
      if (route.request().method() === 'PATCH') {
        const body = await route.request().postDataJSON();
        const paymentId = route.request().url().split('/').pop();
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: paymentId,
            ...body,
            updated_at: new Date().toISOString()
          }])
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Test payment method-specific workflows
   */
  async testPaymentMethod(
    invoiceId: string, 
    method: string, 
    amount: number, 
    reference: string,
    expectedStatus: string = 'completed'
  ) {
    await this.page.click('[data-testid="record-payment-btn"]');
    await this.page.waitForSelector('[data-testid="payment-form"]');

    // Select invoice
    await this.page.click(`[data-testid="select-invoice-${invoiceId}"]`);

    // Fill payment details
    await this.page.fill('[data-testid="payment-amount"]', amount.toString());
    await this.page.selectOption('[data-testid="payment-method"]', method);
    await this.page.fill('[data-testid="payment-reference"]', reference);

    // Method-specific handling
    switch (method) {
      case 'cheque':
        await this.page.fill('[data-testid="payment-notes"]', `Cheque #${reference} - Please allow 3-5 business days for clearance`);
        break;
      case 'cash':
        await this.page.fill('[data-testid="payment-notes"]', 'Cash payment received in person');
        break;
      case 'bank_transfer':
        await this.page.fill('[data-testid="payment-notes"]', `Wire transfer reference: ${reference}`);
        break;
      case 'credit_card':
        await this.page.fill('[data-testid="payment-notes"]', `Credit card payment - Auth code: ${reference}`);
        break;
      case 'online':
        await this.page.fill('[data-testid="payment-notes"]', `Online payment gateway transaction: ${reference}`);
        break;
    }

    // Submit payment
    await this.page.click('[data-testid="submit-payment-btn"]');
    await this.page.waitForSelector('[data-testid="payment-success-message"]');

    // Verify payment appears in list with correct status
    await this.page.click('[data-testid="nav-payments"]');
    await this.page.waitForSelector('[data-testid="payments-page"]');

    const paymentRow = this.page.locator('[data-testid="payment-row"]').first();
    await expect(paymentRow.locator('[data-testid="payment-method"]')).toContainText(this.getMethodLabel(method));
    await expect(paymentRow.locator('[data-testid="payment-status"]')).toContainText(expectedStatus);
    await expect(paymentRow.locator('[data-testid="payment-amount"]')).toContainText(amount.toFixed(2));
  }

  private getMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      'bank_transfer': 'Bank Transfer',
      'cash': 'Cash',
      'cheque': 'Cheque',
      'credit_card': 'Credit Card',
      'online': 'Online Payment'
    };
    return labels[method] || method;
  }

  /**
   * Test bulk payment operations
   */
  async testBulkPaymentProcessing(payments: Array<{invoiceId: string, amount: number, method: string}>) {
    for (const payment of payments) {
      await this.testPaymentMethod(
        payment.invoiceId,
        payment.method,
        payment.amount,
        `BULK-${Date.now()}-${payment.invoiceId}`
      );
      
      // Small delay between payments to simulate real workflow
      await this.page.waitForTimeout(500);
    }

    // Verify all payments in summary
    await this.page.click('[data-testid="nav-payments"]');
    const totalPayments = await this.page.locator('[data-testid="total-payments"]').textContent();
    expect(parseInt(totalPayments || '0')).toBeGreaterThanOrEqual(payments.length);
  }

  /**
   * Test payment refund workflow
   */
  async testPaymentRefund(paymentId: string, refundAmount: number, reason: string) {
    await this.page.click('[data-testid="nav-payments"]');
    
    const paymentRow = this.page.locator(`[data-testid="payment-row-${paymentId}"]`);
    await paymentRow.locator('[data-testid="payment-actions"]').click();
    await this.page.click('[data-testid="refund-payment"]');

    await this.page.waitForSelector('[data-testid="refund-form"]');
    await this.page.fill('[data-testid="refund-amount"]', refundAmount.toString());
    await this.page.fill('[data-testid="refund-reason"]', reason);
    
    await this.page.click('[data-testid="process-refund-btn"]');
    await this.page.waitForSelector('[data-testid="refund-success-message"]');

    // Verify refund appears in payment history
    await expect(paymentRow.locator('[data-testid="payment-status"]')).toContainText('Refunded');
  }

  /**
   * Test payment reconciliation features
   */
  async testPaymentReconciliation() {
    await this.page.click('[data-testid="nav-payments"]');
    await this.page.click('[data-testid="reconciliation-tab"]');

    // Verify unreconciled payments list
    await expect(this.page.locator('[data-testid="unreconciled-payments"]')).toBeVisible();

    // Test bulk reconciliation
    await this.page.click('[data-testid="select-all-payments"]');
    await this.page.click('[data-testid="mark-reconciled-btn"]');
    
    await this.page.fill('[data-testid="reconciliation-date"]', new Date().toISOString().split('T')[0]);
    await this.page.fill('[data-testid="bank-statement-reference"]', 'STMT-2024-06');
    
    await this.page.click('[data-testid="confirm-reconciliation"]');
    await expect(this.page.locator('[data-testid="reconciliation-success"]')).toBeVisible();
  }
}

test.describe('Payment Processing Workflows', () => {
  let authMocker: AuthMocker;
  let paymentHelper: PaymentTestHelper;

  const paymentScenarios: PaymentTestScenario[] = [
    {
      name: 'Full Payment - Bank Transfer',
      invoice: { amount: 5000.00, customerName: 'Tech Solutions Inc' },
      payments: [{
        amount: 5000.00,
        method: 'bank_transfer',
        reference: 'WIRE-123456',
        notes: 'Full payment via wire transfer',
        expectedStatus: 'completed'
      }],
      expectedFinalStatus: 'paid',
      expectedBalance: 0
    },
    {
      name: 'Partial Payments - Multiple Methods',
      invoice: { amount: 2750.00, customerName: 'Design Studio LLC' },
      payments: [
        {
          amount: 1000.00,
          method: 'credit_card',
          reference: 'CC-AUTH-789',
          notes: 'First installment',
          expectedStatus: 'completed'
        },
        {
          amount: 1750.00,
          method: 'cheque',
          reference: 'CHQ-001234',
          notes: 'Final payment by cheque',
          expectedStatus: 'pending'
        }
      ],
      expectedFinalStatus: 'paid',
      expectedBalance: 0
    },
    {
      name: 'Cash Payment with Exact Change',
      invoice: { amount: 1200.00, customerName: 'Startup Ventures' },
      payments: [{
        amount: 1200.00,
        method: 'cash',
        reference: 'CASH-001',
        notes: 'Cash payment received in office',
        expectedStatus: 'completed'
      }],
      expectedFinalStatus: 'paid',
      expectedBalance: 0
    }
  ];

  test.beforeEach(async ({ page }) => {
    authMocker = new AuthMocker(page);
    paymentHelper = new PaymentTestHelper(page);
    
    await authMocker.mockCompletedOnboarding({
      email: 'payments@testbusiness.com',
      fullName: 'Payment Processor'
    });

    await paymentHelper.setupPaymentMocking();

    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard"]');
  });

  // Test each payment scenario
  paymentScenarios.forEach(scenario => {
    test(`Payment Scenario: ${scenario.name}`, async ({ page }) => {
      test.setTimeout(90000);

      console.log(`Testing: ${scenario.name}`);
      
      // Navigate to payments page
      await page.click('[data-testid="nav-payments"]');
      await page.waitForSelector('[data-testid="payments-page"]');

      // Process each payment in the scenario
      for (const payment of scenario.payments) {
        console.log(`Processing ${payment.method} payment of $${payment.amount}`);
        
        await paymentHelper.testPaymentMethod(
          'invoice-001', // Using mock invoice
          payment.method,
          payment.amount,
          payment.reference,
          payment.expectedStatus
        );

        // Wait for processing if needed
        if (payment.delay) {
          await page.waitForTimeout(payment.delay);
        }
      }

      // Verify final invoice status
      await page.click('[data-testid="nav-invoices"]');
      await page.waitForSelector('[data-testid="invoices-page"]');

      const invoiceRow = page.locator('[data-testid="invoice-row"]').first();
      await expect(invoiceRow.locator('[data-testid="payment-status"]'))
        .toContainText(scenario.expectedFinalStatus === 'paid' ? 'Paid' : 'Partially Paid');

      console.log(`✅ ${scenario.name} completed successfully`);
    });
  });

  test('Payment Method Validation and UX', async ({ page }) => {
    await page.click('[data-testid="nav-payments"]');
    await page.click('[data-testid="record-payment-btn"]');
    await page.click('[data-testid="select-invoice-invoice-001"]');

    // Test each payment method's specific validation
    const methods = ['bank_transfer', 'credit_card', 'cheque', 'cash', 'online'];
    
    for (const method of methods) {
      await page.selectOption('[data-testid="payment-method"]', method);
      
      // Verify method-specific fields appear
      switch (method) {
        case 'bank_transfer':
          await expect(page.locator('[data-testid="payment-reference"]')).toBeVisible();
          await expect(page.locator('[placeholder*="reference"]')).toBeVisible();
          break;
        case 'credit_card':
          await expect(page.locator('[data-testid="payment-reference"]')).toBeVisible();
          break;
        case 'cheque':
          await expect(page.locator('[data-testid="payment-reference"]')).toBeVisible();
          await expect(page.locator('[placeholder*="cheque"]')).toBeVisible();
          break;
      }
    }
  });

  test('Large Payment Processing and Approval Workflow', async ({ page }) => {
    const largeAmount = 25000.00;
    
    await paymentHelper.testPaymentMethod(
      'invoice-001',
      'bank_transfer',
      largeAmount,
      'LARGE-PAYMENT-001',
      'pending' // Large payments should be pending
    );

    // Simulate approval process
    await page.click('[data-testid="nav-payments"]');
    const pendingPayment = page.locator('[data-testid="payment-status"]:has-text("Pending")').first();
    await expect(pendingPayment).toBeVisible();

    // Finance manager approves payment
    const paymentRow = pendingPayment.locator('..').locator('..');
    await paymentRow.locator('[data-testid="payment-actions"]').click();
    await page.click('[data-testid="approve-payment"]');
    
    await page.fill('[data-testid="approval-notes"]', 'Approved by Finance Manager - Large payment verified');
    await page.click('[data-testid="confirm-approval"]');

    // Verify status update
    await expect(paymentRow.locator('[data-testid="payment-status"]')).toContainText('Completed');
  });

  test('Payment Failure and Retry Workflow', async ({ page }) => {
    // Mock a payment failure
    await page.route('**/rest/v1/payments**', async route => {
      if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        
        // Simulate payment failure for credit card
        if (body.payment_method === 'credit_card' && body.amount > 1000) {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify([{
              id: `payment-failed-${Date.now()}`,
              ...body,
              status: 'failed',
              failure_reason: 'Insufficient funds',
              created_at: new Date().toISOString()
            }])
          });
        } else {
          await route.continue();
        }
      } else {
        await route.continue();
      }
    });

    // Attempt payment that will fail
    await paymentHelper.testPaymentMethod(
      'invoice-001',
      'credit_card',
      2000.00,
      'CC-FAIL-001',
      'failed'
    );

    // Verify failure notification
    await expect(page.locator('[data-testid="payment-failure-message"]')).toBeVisible();

    // Retry with different method
    await paymentHelper.testPaymentMethod(
      'invoice-001',
      'bank_transfer',
      2000.00,
      'RETRY-WIRE-001',
      'completed'
    );
  });

  test('Multi-Currency Payment Support', async ({ page }) => {
    // Mock foreign exchange rates
    await page.route('**/api/exchange-rates**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          USD: 1.0,
          EUR: 0.85,
          GBP: 0.73,
          CAD: 1.25
        })
      });
    });

    await page.click('[data-testid="nav-payments"]');
    await page.click('[data-testid="record-payment-btn"]');
    await page.click('[data-testid="select-invoice-invoice-001"]');

    // Test currency conversion
    await page.selectOption('[data-testid="payment-currency"]', 'EUR');
    await page.fill('[data-testid="payment-amount"]', '4250.00'); // Equivalent to $5000 USD

    // Verify conversion display
    const convertedAmount = page.locator('[data-testid="converted-amount"]');
    await expect(convertedAmount).toContainText('$5,000.00 USD');

    await page.selectOption('[data-testid="payment-method"]', 'bank_transfer');
    await page.fill('[data-testid="payment-reference"]', 'EUR-WIRE-001');
    await page.click('[data-testid="submit-payment-btn"]');

    await expect(page.locator('[data-testid="payment-success-message"]')).toBeVisible();
  });

  test('Payment Analytics and Reporting', async ({ page }) => {
    // Create multiple payments for analytics
    const testPayments = [
      { invoiceId: 'invoice-001', amount: 1000, method: 'bank_transfer' },
      { invoiceId: 'invoice-002', amount: 1500, method: 'credit_card' },
      { invoiceId: 'invoice-003', amount: 800, method: 'cash' }
    ];

    await paymentHelper.testBulkPaymentProcessing(testPayments);

    // Navigate to payment analytics
    await page.click('[data-testid="nav-payments"]');
    await page.click('[data-testid="analytics-tab"]');

    // Verify payment method distribution
    await expect(page.locator('[data-testid="payment-method-chart"]')).toBeVisible();
    
    // Verify payment trends
    await expect(page.locator('[data-testid="payment-trends-chart"]')).toBeVisible();
    
    // Test date range filtering
    await page.fill('[data-testid="date-from"]', '2024-06-01');
    await page.fill('[data-testid="date-to"]', '2024-06-30');
    await page.click('[data-testid="apply-filter"]');

    // Verify filtered results
    const filteredTotal = page.locator('[data-testid="filtered-total"]');
    await expect(filteredTotal).toBeVisible();

    // Export analytics report
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-analytics"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/payment.*analytics.*\.xlsx/i);
  });

  test('Payment Security and Fraud Prevention', async ({ page }) => {
    // Test rapid payment detection
    await page.click('[data-testid="nav-payments"]');
    
    // Attempt multiple rapid payments
    for (let i = 0; i < 3; i++) {
      await page.click('[data-testid="record-payment-btn"]');
      await page.click('[data-testid="select-invoice-invoice-001"]');
      await page.fill('[data-testid="payment-amount"]', '100.00');
      await page.selectOption('[data-testid="payment-method"]', 'credit_card');
      await page.fill('[data-testid="payment-reference"]', `RAPID-${i}`);
      await page.click('[data-testid="submit-payment-btn"]');
      
      if (i === 2) {
        // Third rapid payment should trigger security check
        await expect(page.locator('[data-testid="security-check-modal"]')).toBeVisible();
        await page.fill('[data-testid="security-verification"]', 'VERIFIED');
        await page.click('[data-testid="confirm-security-check"]');
      }
      
      await page.waitForSelector('[data-testid="payment-success-message"]');
    }

    // Test unusual amount detection
    await page.click('[data-testid="record-payment-btn"]');
    await page.click('[data-testid="select-invoice-invoice-001"]');
    await page.fill('[data-testid="payment-amount"]', '50000.00'); // Unusually large
    
    await expect(page.locator('[data-testid="unusual-amount-warning"]')).toBeVisible();
    await page.click('[data-testid="confirm-unusual-amount"]');
  });
});