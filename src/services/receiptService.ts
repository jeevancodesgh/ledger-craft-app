import { Receipt, ReceiptData, Payment, EnhancedInvoice, Customer, BusinessProfile } from '@/types/payment';
import { supabaseService } from './supabaseService';
import { emailService } from './emailService';

export class ReceiptService {
  /**
   * Generate receipt for a payment
   */
  async generate(
    paymentId: string, 
    emailToCustomer: boolean = false
  ): Promise<Receipt> {
    // Get payment details
    const payment = await this.getPaymentWithDetails(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Generate receipt number
    const receiptNumber = await this.generateReceiptNumber(payment.userId);

    // Create receipt data
    const receiptData = this.createReceiptData(payment);

    // Save receipt to database
    const receipt: Omit<Receipt, 'id' | 'createdAt'> = {
      paymentId,
      receiptNumber,
      userId: payment.userId,
      generatedAt: new Date().toISOString(),
      isEmailed: false,
      receiptData
    };

    const savedReceipt = await supabaseService.createReceipt(receipt);

    // Send email if requested
    if (emailToCustomer && payment.invoice?.customer?.email) {
      try {
        await this.emailReceipt(savedReceipt);
        await this.markReceiptAsEmailed(savedReceipt.id);
        savedReceipt.isEmailed = true;
        savedReceipt.emailSentAt = new Date().toISOString();
      } catch (error) {
        console.error('Failed to email receipt:', error);
        // Don't fail the receipt generation if email fails
      }
    }

    return savedReceipt;
  }

  /**
   * Get payment with all related details for receipt
   */
  private async getPaymentWithDetails(paymentId: string): Promise<{
    payment: Payment;
    invoice: EnhancedInvoice;
    customer: Customer;
    business: BusinessProfile;
    userId: string;
  } | null> {
    // This would fetch from database with joins
    // Implementation depends on your Supabase service
    return null; // Placeholder
  }

  /**
   * Generate unique receipt number
   */
  private async generateReceiptNumber(userId: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Get next sequence number for this user/month
    const sequence = await this.getNextReceiptSequence(userId, year, month);
    
    return `REC-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Get next receipt sequence number
   */
  private async getNextReceiptSequence(
    userId: string, 
    year: number, 
    month: string
  ): Promise<number> {
    // Query database for highest sequence in this period
    // For now, return 1 as placeholder
    return 1;
  }

  /**
   * Create receipt data structure
   */
  private createReceiptData(paymentDetails: any): ReceiptData {
    const { payment, invoice, customer, business } = paymentDetails;

    return {
      payment,
      invoice,
      customer,
      business,
      receiptNumber: '', // Will be set by caller
      paymentDate: payment.paymentDate,
      amountPaid: payment.amount,
      paymentMethod: this.formatPaymentMethod(payment.paymentMethod),
      balanceAfterPayment: invoice.balanceDue - payment.amount,
      taxBreakdown: invoice.taxBreakdown
    };
  }

  /**
   * Format payment method for display
   */
  private formatPaymentMethod(method: string): string {
    const methodMap: Record<string, string> = {
      'bank_transfer': 'Bank Transfer',
      'cash': 'Cash',
      'cheque': 'Cheque',
      'credit_card': 'Credit Card',
      'online': 'Online Payment'
    };
    
    return methodMap[method] || method;
  }

  /**
   * Generate receipt HTML for email/PDF
   */
  generateReceiptHTML(receiptData: ReceiptData): string {
    const { business, customer, payment, invoice } = receiptData;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Receipt - ${receiptData.receiptNumber}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
          }
          .receipt-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .receipt-header {
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .receipt-header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .receipt-header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
          }
          .receipt-content {
            padding: 30px;
          }
          .receipt-section {
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e5e5e5;
          }
          .receipt-section:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .info-item {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .info-value {
            font-size: 14px;
            font-weight: 500;
            color: #333;
          }
          .payment-amount {
            background: #f0fdf4;
            border: 2px solid #10B981;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
          }
          .payment-amount .amount {
            font-size: 32px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 5px;
          }
          .payment-amount .label {
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .tax-breakdown {
            background: #fafafa;
            border-radius: 6px;
            padding: 15px;
            margin-top: 15px;
          }
          .tax-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .tax-line:last-child {
            margin-bottom: 0;
            font-weight: bold;
            padding-top: 8px;
            border-top: 1px solid #ddd;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          @media print {
            body { background-color: white; }
            .receipt-container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <!-- Header -->
          <div class="receipt-header">
            <h1>Payment Receipt</h1>
            <p>Receipt #${receiptData.receiptNumber}</p>
          </div>

          <!-- Content -->
          <div class="receipt-content">
            <!-- Business Information -->
            <div class="receipt-section">
              <div class="section-title">From</div>
              <div class="info-item">
                <div class="info-label">Business Name</div>
                <div class="info-value">${business.name}</div>
              </div>
              ${business.email ? `
                <div class="info-item" style="margin-top: 10px;">
                  <div class="info-label">Email</div>
                  <div class="info-value">${business.email}</div>
                </div>
              ` : ''}
              ${business.phone ? `
                <div class="info-item" style="margin-top: 10px;">
                  <div class="info-label">Phone</div>
                  <div class="info-value">${business.phone}</div>
                </div>
              ` : ''}
              ${business.address ? `
                <div class="info-item" style="margin-top: 10px;">
                  <div class="info-label">Address</div>
                  <div class="info-value">${business.address}</div>
                </div>
              ` : ''}
            </div>

            <!-- Customer Information -->
            <div class="receipt-section">
              <div class="section-title">To</div>
              <div class="info-item">
                <div class="info-label">Customer Name</div>
                <div class="info-value">${customer.name}</div>
              </div>
              ${customer.email ? `
                <div class="info-item" style="margin-top: 10px;">
                  <div class="info-label">Email</div>
                  <div class="info-value">${customer.email}</div>
                </div>
              ` : ''}
              ${customer.address ? `
                <div class="info-item" style="margin-top: 10px;">
                  <div class="info-label">Address</div>
                  <div class="info-value">${customer.address}${customer.city ? ', ' + customer.city : ''}${customer.state ? ', ' + customer.state : ''}</div>
                </div>
              ` : ''}
            </div>

            <!-- Payment Details -->
            <div class="receipt-section">
              <div class="section-title">Payment Details</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Invoice Number</div>
                  <div class="info-value">${invoice.invoiceNumber}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Payment Date</div>
                  <div class="info-value">${new Date(receiptData.paymentDate).toLocaleDateString()}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Payment Method</div>
                  <div class="info-value">${receiptData.paymentMethod}</div>
                </div>
                ${payment.referenceNumber ? `
                  <div class="info-item">
                    <div class="info-label">Reference</div>
                    <div class="info-value">${payment.referenceNumber}</div>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Payment Amount -->
            <div class="payment-amount">
              <div class="amount">${invoice.currency}${receiptData.amountPaid.toFixed(2)}</div>
              <div class="label">Amount Paid</div>
            </div>

            <!-- Tax Breakdown -->
            ${receiptData.taxBreakdown ? `
              <div class="receipt-section">
                <div class="section-title">Tax Breakdown</div>
                <div class="tax-breakdown">
                  <div class="tax-line">
                    <span>Subtotal:</span>
                    <span>${invoice.currency}${receiptData.taxBreakdown.subtotal.toFixed(2)}</span>
                  </div>
                  <div class="tax-line">
                    <span>${receiptData.taxBreakdown.taxName} (${(receiptData.taxBreakdown.taxRate * 100).toFixed(1)}%):</span>
                    <span>${invoice.currency}${receiptData.taxBreakdown.taxAmount.toFixed(2)}</span>
                  </div>
                  <div class="tax-line">
                    <span>Total:</span>
                    <span>${invoice.currency}${receiptData.taxBreakdown.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Balance Information -->
            <div class="receipt-section">
              <div class="section-title">Balance Information</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Original Invoice Total</div>
                  <div class="info-value">${invoice.currency}${invoice.total.toFixed(2)}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Total Paid</div>
                  <div class="info-value">${invoice.currency}${invoice.totalPaid.toFixed(2)}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Remaining Balance</div>
                  <div class="info-value" style="color: ${receiptData.balanceAfterPayment > 0 ? '#dc2626' : '#059669'}">${invoice.currency}${receiptData.balanceAfterPayment.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Thank you for your payment!</p>
            <p>This receipt was generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            ${business.website ? `<p>Visit us at ${business.website}</p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Email receipt to customer
   */
  private async emailReceipt(receipt: Receipt): Promise<void> {
    if (!receipt.receiptData) {
      throw new Error('Receipt data is required for emailing');
    }

    const receiptHTML = this.generateReceiptHTML(receipt.receiptData);
    const customer = receipt.receiptData.customer;
    const business = receipt.receiptData.business;

    const emailSubject = `Payment Receipt - ${receipt.receiptNumber}`;
    
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Received - Thank You!</h2>
        
        <p>Dear ${customer.name},</p>
        
        <p>We have successfully received your payment. Please find your receipt details below:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Receipt Number:</strong> ${receipt.receiptNumber}</p>
          <p><strong>Payment Amount:</strong> ${receipt.receiptData.invoice.currency}${receipt.receiptData.amountPaid.toFixed(2)}</p>
          <p><strong>Payment Date:</strong> ${new Date(receipt.receiptData.paymentDate).toLocaleDateString()}</p>
          <p><strong>Invoice Number:</strong> ${receipt.receiptData.invoice.invoiceNumber}</p>
        </div>
        
        <p>If you have any questions about this payment, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br/>${business.name}</p>
        
        ${business.phone ? `<p>Phone: ${business.phone}</p>` : ''}
        ${business.email ? `<p>Email: ${business.email}</p>` : ''}
      </div>
    `;

    await emailService.sendReceiptEmail({
      to: customer.email,
      subject: emailSubject,
      htmlContent: emailBody,
      receiptHTML: receiptHTML,
      receiptNumber: receipt.receiptNumber
    });
  }

  /**
   * Mark receipt as emailed
   */
  private async markReceiptAsEmailed(receiptId: string): Promise<void> {
    await supabaseService.updateReceipt(receiptId, {
      isEmailed: true,
      emailSentAt: new Date().toISOString()
    });
  }

  /**
   * Get receipt by ID
   */
  async getById(receiptId: string): Promise<Receipt | null> {
    return await supabaseService.getReceiptById(receiptId);
  }

  /**
   * Get receipts by payment ID
   */
  async getByPaymentId(paymentId: string): Promise<Receipt[]> {
    return await supabaseService.getReceiptsByPaymentId(paymentId);
  }

  /**
   * Get receipts by user ID with pagination
   */
  async getByUserId(
    userId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<Receipt[]> {
    return await supabaseService.getReceiptsByUserId(userId, limit, offset);
  }

  /**
   * Generate PDF receipt
   */
  async generatePDF(receiptId: string): Promise<Buffer> {
    const receipt = await this.getById(receiptId);
    if (!receipt || !receipt.receiptData) {
      throw new Error('Receipt not found');
    }

    const html = this.generateReceiptHTML(receipt.receiptData);
    
    // This would use a PDF generation library like Puppeteer
    // For now, return empty buffer as placeholder
    return Buffer.from('');
  }

  /**
   * Resend receipt email
   */
  async resendEmail(receiptId: string): Promise<void> {
    const receipt = await this.getById(receiptId);
    if (!receipt) {
      throw new Error('Receipt not found');
    }

    await this.emailReceipt(receipt);
    await this.markReceiptAsEmailed(receipt.id);
  }

  /**
   * Validate receipt data
   */
  validateReceiptData(receiptData: ReceiptData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!receiptData.payment) {
      errors.push('Payment information is required');
    }

    if (!receiptData.invoice) {
      errors.push('Invoice information is required');
    }

    if (!receiptData.customer) {
      errors.push('Customer information is required');
    }

    if (!receiptData.business) {
      errors.push('Business information is required');
    }

    if (receiptData.amountPaid <= 0) {
      errors.push('Payment amount must be positive');
    }

    if (!receiptData.paymentDate) {
      errors.push('Payment date is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const receiptService = new ReceiptService();