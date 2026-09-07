import type { Database } from './db/client';
import type { Auth } from './modules/auth/auth';
import type { InvoiceMailer } from './modules/invoices/mailer';

export type AppEnv = {
  Variables: {
    requestId: string;
    checkDatabase?: () => Promise<boolean>;
    auth?: Auth;
    db?: Database;
    invoiceMailer?: InvoiceMailer;
  };
};

export type AppDependencies = {
  checkDatabase?: () => Promise<boolean>;
  auth?: Auth;
  db?: Database;
  invoiceMailer?: InvoiceMailer;
};
