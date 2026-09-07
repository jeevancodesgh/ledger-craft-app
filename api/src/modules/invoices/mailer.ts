export type InvoiceMail = {
  invoiceId: string;
  invoiceNumber: string;
  to: string[];
};

export type InvoiceMailer = {
  sendInvoice(mail: InvoiceMail): Promise<void>;
};

export function createLoggingInvoiceMailer(): InvoiceMailer {
  return {
    async sendInvoice(mail) {
      console.info(JSON.stringify({ msg: 'invoice_email_queued', ...mail }));
    },
  };
}
