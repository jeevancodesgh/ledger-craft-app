import { Invoice, BusinessProfile } from '@/types';
import { createEmailCompatibleInvoiceHtml } from './invoiceTemplateRenderer';

export interface PaymentReminderParams {
  to: string;
  invoice: Invoice;
  businessProfile?: BusinessProfile | null;
  reminderType: 'gentle' | 'firm' | 'final';
  daysPastDue: number;
}

export const paymentReminderService = {
  // Calculate days past due
  calculateDaysPastDue(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  },

  // Determine appropriate reminder type based on days past due
  getReminderType(daysPastDue: number): 'gentle' | 'firm' | 'final' {
    if (daysPastDue <= 7) return 'gentle';
    if (daysPastDue <= 30) return 'firm';
    return 'final';
  },

  // Generate reminder email content
  generateReminderContent(params: PaymentReminderParams): {
    subject: string;
    content: string;
    urgencyLevel: 'low' | 'medium' | 'high';
  } {
    const { invoice, businessProfile, reminderType, daysPastDue } = params;
    const businessName = businessProfile?.name || 'Your Business';
    const customerName = invoice.customer?.name || 'Valued Customer';
    const amount = `${invoice.currency}${invoice.total.toFixed(2)}`;
    const dueDate = new Date(invoice.dueDate).toLocaleDateString();

    let subject: string;
    let content: string;
    let urgencyLevel: 'low' | 'medium' | 'high';

    switch (reminderType) {
      case 'gentle':
        urgencyLevel = 'low';
        subject = `Friendly Reminder: Invoice ${invoice.invoiceNumber} Payment Due`;
        content = `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #374151;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Payment Reminder</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Invoice ${invoice.invoiceNumber}</p>
            </div>
            
            <div style="padding: 30px; background-color: #ffffff;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">Dear ${customerName},</p>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6;">
                We hope this message finds you well. We wanted to kindly remind you that payment for Invoice ${invoice.invoiceNumber} 
                was due on <strong>${dueDate}</strong> and appears to be ${daysPastDue} day${daysPastDue !== 1 ? 's' : ''} overdue.
              </p>
              
              <div style="background-color: #eff6ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; font-weight: bold; color: #1e40af;">Outstanding Amount: ${amount}</p>
                <p style="margin: 5px 0 0 0; color: #3730a3; font-size: 14px;">Due Date: ${dueDate}</p>
              </div>
              
              <p style="margin: 20px 0; font-size: 14px; line-height: 1.6;">
                If you have already processed this payment, please disregard this reminder. However, if the payment 
                is still pending, we would greatly appreciate your prompt attention to settle this invoice.
              </p>
              
              <p style="margin: 20px 0; font-size: 14px; line-height: 1.6;">
                <strong>Payment can be made via:</strong><br/>
                • Bank transfer<br/>
                • Online payment portal<br/>
                • Check payment<br/>
                Please contact us if you need payment details or have any questions.
              </p>
              
              <p style="margin: 20px 0; font-size: 14px; line-height: 1.6;">
                We value our business relationship and appreciate your continued partnership. If you're experiencing 
                any issues with payment, please don't hesitate to reach out so we can work together to find a solution.
              </p>
            </div>
          </div>
        `;
        break;

      case 'firm':
        urgencyLevel = 'medium';
        subject = `Important: Overdue Payment Required - Invoice ${invoice.invoiceNumber}`;
        content = `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #374151;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Payment Overdue Notice</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Invoice ${invoice.invoiceNumber}</p>
            </div>
            
            <div style="padding: 30px; background-color: #ffffff;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">Dear ${customerName},</p>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6;">
                <strong>This is an important notice</strong> regarding Invoice ${invoice.invoiceNumber}, which is now 
                <strong>${daysPastDue} days overdue</strong>. Despite our previous reminder, we have not yet received payment.
              </p>
              
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-weight: bold; color: #92400e;">Outstanding Amount: ${amount}</p>
                <p style="margin: 5px 0 0 0; color: #b45309; font-size: 14px;">Original Due Date: ${dueDate}</p>
                <p style="margin: 5px 0 0 0; color: #b45309; font-size: 14px;">Days Overdue: ${daysPastDue}</p>
              </div>
              
              <p style="margin: 20px 0; font-size: 14px; line-height: 1.6;">
                <strong>Immediate action is required</strong> to avoid any disruption to our services and maintain 
                your account in good standing. Please process payment within the next <strong>7 business days</strong>.
              </p>
              
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #374151;">
                  <strong>Payment Options:</strong><br/>
                  Please contact our accounts department for payment instructions or to discuss payment arrangements.
                </p>
              </div>
              
              <p style="margin: 20px 0; font-size: 14px; line-height: 1.6;">
                If you're experiencing financial difficulties, we encourage you to contact us immediately to discuss 
                possible payment arrangements. We are committed to working with our valued customers to find mutually 
                acceptable solutions.
              </p>
              
              <p style="margin: 20px 0; font-size: 14px; line-height: 1.6;">
                <strong>Please note:</strong> Continued delays in payment may result in:
              </p>
              <ul style="margin: 10px 0 20px 20px; color: #6b7280; font-size: 14px;">
                <li>Late payment fees as per our terms and conditions</li>
                <li>Suspension of services</li>
                <li>Transfer to collections</li>
              </ul>
            </div>
          </div>
        `;
        break;

      case 'final':
        urgencyLevel = 'high';
        subject = `FINAL NOTICE: Immediate Payment Required - Invoice ${invoice.invoiceNumber}`;
        content = `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #374151;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">FINAL PAYMENT NOTICE</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Invoice ${invoice.invoiceNumber}</p>
            </div>
            
            <div style="padding: 30px; background-color: #ffffff;">
              <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: bold; color: #dc2626;">URGENT - FINAL NOTICE</p>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6;">
                Dear ${customerName},
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6;">
                <strong>THIS IS A FINAL NOTICE</strong> for Invoice ${invoice.invoiceNumber}, which is now 
                <strong>${daysPastDue} days overdue</strong>. Despite multiple attempts to contact you, this invoice 
                remains unpaid.
              </p>
              
              <div style="background-color: #fef2f2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <p style="margin: 0; font-weight: bold; color: #991b1b; font-size: 16px;">Amount Due: ${amount}</p>
                <p style="margin: 5px 0 0 0; color: #b91c1c; font-size: 14px;">Original Due Date: ${dueDate}</p>
                <p style="margin: 5px 0 0 0; color: #b91c1c; font-size: 14px;">Days Overdue: ${daysPastDue}</p>
              </div>
              
              <div style="background-color: #fbbf24; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-weight: bold; color: #92400e; font-size: 16px;">
                  PAYMENT MUST BE RECEIVED WITHIN 48 HOURS
                </p>
              </div>
              
              <p style="margin: 20px 0; font-size: 14px; line-height: 1.6;">
                <strong>Failure to remit payment within 48 hours will result in:</strong>
              </p>
              <ul style="margin: 10px 0 20px 20px; color: #dc2626; font-size: 14px; font-weight: bold;">
                <li>Immediate suspension of all services</li>
                <li>Additional late fees and interest charges</li>
                <li>Transfer of this debt to our collections agency</li>
                <li>Potential legal action to recover the debt</li>
                <li>Negative reporting to credit agencies</li>
              </ul>
              
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #374151;">
                  <strong>TO AVOID FURTHER ACTION:</strong><br/>
                  Contact our accounts department immediately at [phone] or [email] to arrange immediate payment 
                  or discuss this matter urgently.
                </p>
              </div>
              
              <p style="margin: 20px 0; font-size: 14px; line-height: 1.6;">
                This notice serves as our final attempt to resolve this matter amicably. We have no choice but to 
                pursue all available legal remedies if payment is not received or suitable arrangements are not made 
                within the specified timeframe.
              </p>
              
              <p style="margin: 20px 0; font-size: 14px; line-height: 1.6;">
                We sincerely hope to resolve this matter promptly and maintain our business relationship.
              </p>
            </div>
          </div>
        `;
        break;
    }

    return { subject, content, urgencyLevel };
  },

  // Create complete payment reminder email
  async createPaymentReminderEmail(params: PaymentReminderParams): Promise<{
    subject: string;
    html: string;
    urgencyLevel: 'low' | 'medium' | 'high';
  }> {
    const { invoice, businessProfile } = params;
    const businessName = businessProfile?.name || 'Your Business';
    
    // Generate reminder content
    const { subject, content, urgencyLevel } = this.generateReminderContent(params);
    
    // Generate invoice HTML
    const invoiceHtml = createEmailCompatibleInvoiceHtml(invoice, businessProfile);
    
    // Create complete email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
          <tr>
            <td align="center">
              <!-- Reminder Content -->
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin-bottom: 20px;">
                <tr>
                  <td>
                    ${content}
                  </td>
                </tr>
              </table>
              
              <!-- Invoice Copy -->
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px; background-color: #f8f9fa; border-radius: 8px 8px 0 0; text-align: center;">
                    <h3 style="margin: 0; color: #374151; font-size: 18px;">Invoice Copy Attached</h3>
                    <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">For your reference</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    ${invoiceHtml}
                  </td>
                </tr>
              </table>
              
              <!-- Contact Information -->
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <h4 style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">Need Help?</h4>
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                      If you have questions about this invoice or need to discuss payment options, please contact us:
                    </p>
                    ${businessProfile?.phone ? `<p style="margin: 5px 0; color: #059669; font-size: 14px;"><strong>Phone:</strong> ${businessProfile.phone}</p>` : ''}
                    ${businessProfile?.email ? `<p style="margin: 5px 0; color: #059669; font-size: 14px;"><strong>Email:</strong> ${businessProfile.email}</p>` : ''}
                    <p style="margin: 15px 0 0 0; color: #374151; font-size: 14px; font-weight: bold;">
                      ${businessName}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return { subject, html: emailHtml, urgencyLevel };
  }
};