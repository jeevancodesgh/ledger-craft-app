import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface SendInvoiceEmailRequest {
  to: string;
  invoiceNumber: string;
  businessName: string;
  customerName: string;
  total: number;
  currency: string;
  invoiceHtml: string;
  pdfBase64?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const {
      to,
      invoiceNumber,
      businessName,
      customerName,
      total,
      currency,
      invoiceHtml,
      pdfBase64
    }: SendInvoiceEmailRequest = await req.json();

    if (!to || !invoiceNumber || !businessName) {
      throw new Error('Missing required fields');
    }

    const attachments = [];
    
    if (pdfBase64) {
      attachments.push({
        filename: `invoice-${invoiceNumber}.pdf`,
        content: pdfBase64,
        contentType: 'application/pdf'
      });
    }

    const emailData = {
      from: `${businessName} <noreply@resend.dev>`, // Use resend.dev domain for testing
      to: [to],
      subject: `Invoice ${invoiceNumber} from ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Invoice ${invoiceNumber}</h2>
          <p>Dear ${customerName},</p>
          <p>Please find your invoice attached. The total amount is <strong>${currency} ${total.toFixed(2)}</strong>.</p>
          <div style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            ${invoiceHtml}
          </div>
          <p>Thank you for your business!</p>
          <p>Best regards,<br/>${businessName}</p>
        </div>
      `,
      attachments
    };

    const data = await resend.emails.send(emailData);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: data.id
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});