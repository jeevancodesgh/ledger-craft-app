/**
 * Interface Segregation Principle - Separate interfaces for different responsibilities
 */

import { Customer, Invoice, BusinessProfile, Item, ItemCategory, Account, Expense, ExpenseCategory } from "@/types";
import { Payment, Receipt, CreatePaymentRequest, EnhancedInvoice } from "@/types/payment";

// Data state interface
export interface IDataState {
  customers: Customer[];
  invoices: Invoice[];
  businessProfile: BusinessProfile | null;
  items: Item[];
  itemCategories: ItemCategory[];
  accounts: Account[];
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  payments: Payment[];
  receipts: Receipt[];
}

// Loading state interface
export interface ILoadingState {
  customers: boolean;
  invoices: boolean;
  businessProfile: boolean;
  items: boolean;
  itemCategories: boolean;
  accounts: boolean;
  expenses: boolean;
  expenseCategories: boolean;
  payments: boolean;
  receipts: boolean;
}

// Data subscriber interface
export interface IDataSubscriber {
  (data: IDataState, loading: ILoadingState): void;
}

// Data fetching interface
export interface IDataFetcher {
  fetchCustomers(): Promise<void>;
  fetchInvoices(): Promise<void>;
  fetchBusinessProfile(): Promise<void>;
  fetchItems(): Promise<void>;
  fetchItemCategories(): Promise<void>;
  fetchAccounts(): Promise<void>;
  fetchExpenses(): Promise<void>;
  fetchExpenseCategories(): Promise<void>;
  fetchPayments(): Promise<void>;
  fetchReceipts(): Promise<void>;
}

// CRUD operations interface
export interface IDataCRUD {
  // Invoice operations
  createInvoice(invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt">): Promise<Invoice>;
  updateInvoice(invoice: Invoice): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;
  getInvoice(id: string): Promise<Invoice | null>;
  getNextInvoiceNumber(): Promise<string>;
  updateInvoiceStatus(id: string, status: Invoice['status']): Promise<Invoice>;
  
  // Customer operations
  createCustomer(customer: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  getCustomer(id: string): Promise<Customer | null>;
  
  // Business Profile operations
  saveBusinessProfile(profile: Omit<BusinessProfile, "id" | "createdAt" | "updatedAt">): Promise<BusinessProfile>;
  updateBusinessProfile(profile: BusinessProfile): Promise<BusinessProfile>;
  
  // Payment operations
  createPayment(payment: CreatePaymentRequest): Promise<Payment>;
  getInvoicesWithBalance(): Promise<EnhancedInvoice[]>;
}

// Subscription management interface
export interface ISubscriptionManager {
  subscribe(callback: IDataSubscriber): () => void;
  unsubscribe(callback: IDataSubscriber): void;
  notify(): void;
}

// Lifecycle management interface
export interface ILifecycleManager {
  initialize(userId: string): Promise<void>;
  reset(): void;
  isInitialized(): boolean;
  getCurrentUserId(): string | null;
}

// Main data manager interface combining all responsibilities
export interface IDataManager extends IDataFetcher, IDataCRUD, ISubscriptionManager, ILifecycleManager {
  getData(): IDataState;
  getLoading(): ILoadingState;
}
