import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  Onboarding: undefined;
};

export type HomeStackParamList = {
  DashboardHome: undefined;
};

export type InvoiceStackParamList = {
  InvoiceList: undefined;
  InvoiceCreate: undefined;
  InvoiceEdit: { invoiceId: string };
  InvoiceDetail: { invoiceId: string };
};

export type ExpenseStackParamList = {
  ExpenseList: undefined;
  ExpenseCreate: undefined;
  ExpenseEdit: { expenseId: string };
};

export type SettingsStackParamList = {
  SettingsList: undefined;
  BusinessSettings: undefined;
};

export type MainTabParamList = {
  Dashboard: NavigatorScreenParams<HomeStackParamList>;
  Invoices: NavigatorScreenParams<InvoiceStackParamList>;
  Expenses: NavigatorScreenParams<ExpenseStackParamList>;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};

/** @deprecated Use nested stack param lists. Kept for existing screen imports. */
export type AppTabParamList = InvoiceStackParamList &
  ExpenseStackParamList &
  SettingsStackParamList &
  HomeStackParamList;
