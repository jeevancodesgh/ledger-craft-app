/**
 * Navigation Types
 */

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Signup: undefined;
  Onboarding: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Invoices: undefined;
  InvoiceCreate: undefined;
  InvoiceEdit: { invoiceId: string };
  InvoiceDetail: { invoiceId: string };
  Expenses: undefined;
  ExpenseCreate: undefined;
  ExpenseEdit: { expenseId: string };
  ExpenseDetail: { expenseId: string };
  Settings: undefined;
  BusinessSettings: undefined;
};

export type AppTabParamList = MainTabParamList;

