import type { Database } from './db/client';
import type { Auth } from './modules/auth/auth';
import type { ReceiptScanner } from './modules/ai/scanner';
import type { InvoiceMailer } from './modules/invoices/mailer';
import type { ObjectStore } from './modules/storage/object-store';

export type AppEnv = {
  Variables: {
    requestId: string;
    checkDatabase?: () => Promise<boolean>;
    auth?: Auth;
    db?: Database;
    invoiceMailer?: InvoiceMailer;
    objectStore?: ObjectStore;
    receiptScanner?: ReceiptScanner;
  };
};

export type AppDependencies = {
  checkDatabase?: () => Promise<boolean>;
  auth?: Auth;
  db?: Database;
  invoiceMailer?: InvoiceMailer;
  objectStore?: ObjectStore;
  receiptScanner?: ReceiptScanner;
};
