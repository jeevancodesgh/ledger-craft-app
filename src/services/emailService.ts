// Browser-compatible email service that calls a backend API
export interface SendInvoiceEmailParams {
  to: string;
  invoiceNumber: string;
  businessName: string;
  customerName: string;
  total: number;
  currency: string;
  invoiceHtml: string;
  pdfBuffer?: ArrayBuffer;
}

export const emailService = {
  async sendInvoiceEmail({
    to,
    invoiceNumber,
    businessName,
    customerName,
    total,
    currency,
    invoiceHtml,
    pdfBuffer
  }: SendInvoiceEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      let pdfBase64 = '';
      
      if (pdfBuffer) {
        // Convert ArrayBuffer to base64 string for API transmission
        const uint8Array = new Uint8Array(pdfBuffer);
        const binaryString = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');
        pdfBase64 = btoa(binaryString);
      }

      // Call the Supabase Edge Function to send email
      const supabaseUrl = "https://viqckjmborlqaemavrzu.supabase.co";
      const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpcWNram1ib3JscWFlbWF2cnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NjIxMzIsImV4cCI6MjA2MDQzODEzMn0.ccFdzJbDBjGzYaGenOz8Gnsuyj-LtljPeXAjcFyPllA";

      const response = await fetch(`${supabaseUrl}/functions/v1/send-invoice-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          to,
          invoiceNumber,
          businessName,
          customerName,
          total,
          currency,
          invoiceHtml,
          pdfBase64
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('Error sending invoice email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  },

  async validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};