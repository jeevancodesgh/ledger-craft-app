import { apiError } from '../../http-error';
import type { InvoiceMail, InvoiceMailer } from './mailer';

type ResendOptions = {
  apiKey?: string;
  from?: string;
  fetchImpl?: typeof fetch;
};

export function createResendInvoiceMailer(opts: ResendOptions = {}): InvoiceMailer {
  const apiKey = opts.apiKey ?? process.env.RESEND_API_KEY;
  const from = opts.from ?? process.env.RESEND_FROM ?? 'LedgerCraft <noreply@easybizinvoice.com>';
  const fetchImpl = opts.fetchImpl ?? fetch;

  return {
    async sendInvoice(mail: InvoiceMail) {
      if (!apiKey || apiKey === 'your_resend_api_key') {
        throw apiError(503, 'EMAIL_UNAVAILABLE', 'Email is not configured');
      }
      const response = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: mail.to,
          subject: `Invoice ${mail.invoiceNumber}`,
          html: `<p>Invoice ${mail.invoiceNumber} is ready.</p>`,
        }),
      });
      if (!response.ok) {
        throw apiError(502, 'EMAIL_ERROR', 'Failed to send invoice email');
      }
    },
  };
}

export function createRuntimeInvoiceMailer(): InvoiceMailer {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'your_resend_api_key') {
    return {
      async sendInvoice(mail) {
        console.info(JSON.stringify({ msg: 'invoice_email_queued', ...mail }));
      },
    };
  }
  return createResendInvoiceMailer({ apiKey });
}
