/**
 * Simple React hook for accessing stable data
 * This hook is HMR-safe and performance-optimized
 */

import { useState, useEffect } from 'react';
import { solidDataManager } from '@/services/DataManagerSOLID';
import { Customer, Invoice, BusinessProfile, Item, ItemCategory, Account, Expense, ExpenseCategory } from "@/types";
import { Payment, Receipt, CreatePaymentRequest, EnhancedInvoice } from "@/types/payment";

interface AppData {
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

interface AppLoading {
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

export const useAppData = () => {
  const [data, setData] = useState<AppData>(() => solidDataManager.getData());
  const [loading, setLoading] = useState<AppLoading>(() => solidDataManager.getLoading());

  useEffect(() => {
    // Subscribe to SOLID data manager updates
    const unsubscribe = solidDataManager.subscribe((newData, newLoading) => {
      setData(newData);
      setLoading(newLoading);
    });

    return unsubscribe;
  }, []); // Empty dependency - this is safe because solidDataManager is a singleton

  // Refresh functions that delegate to SOLID data manager
  const refresh = {
    customers: () => solidDataManager.fetchCustomers(),
    invoices: () => solidDataManager.fetchInvoices(),
    businessProfile: () => solidDataManager.fetchBusinessProfile(),
    items: () => solidDataManager.fetchItems(),
    itemCategories: () => solidDataManager.fetchItemCategories(),
    accounts: () => solidDataManager.fetchAccounts(),
    expenses: () => solidDataManager.fetchExpenses(),
    expenseCategories: () => solidDataManager.fetchExpenseCategories(),
    payments: () => solidDataManager.fetchPayments(),
    receipts: () => solidDataManager.fetchReceipts(),
  };

  return {
    // Data
    ...data,
    
    // Loading states
    isLoadingCustomers: loading.customers,
    isLoadingInvoices: loading.invoices,
    isLoadingBusinessProfile: loading.businessProfile,
    isLoadingItems: loading.items,
    isLoadingItemCategories: loading.itemCategories,
    isLoadingAccounts: loading.accounts,
    isLoadingExpenses: loading.expenses,
    isLoadingExpenseCategories: loading.expenseCategories,
    isLoadingPayments: loading.payments,
    isLoadingReceipts: loading.receipts,
    
    // Refresh functions
    refreshCustomers: refresh.customers,
    refreshInvoices: refresh.invoices,
    refreshBusinessProfile: refresh.businessProfile,
    refreshItems: refresh.items,
    refreshItemCategories: refresh.itemCategories,
    refreshAccounts: refresh.accounts,
    refreshExpenses: refresh.expenses,
    refreshExpenseCategories: refresh.expenseCategories,
    refreshPayments: refresh.payments,
    refreshReceipts: refresh.receipts,
    
    // CRUD operations
    createInvoice: (invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt">) => solidDataManager.createInvoice(invoice),
    updateInvoice: (invoice: Invoice) => solidDataManager.updateInvoice(invoice),
    deleteInvoice: (id: string) => solidDataManager.deleteInvoice(id),
    getInvoice: (id: string) => solidDataManager.getInvoice(id),
    getNextInvoiceNumber: () => solidDataManager.getNextInvoiceNumber(),
    updateInvoiceStatus: (id: string, status: Invoice['status']) => solidDataManager.updateInvoiceStatus(id, status),
    
    createCustomer: (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => solidDataManager.createCustomer(customer),
    updateCustomer: (id: string, customer: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">>) => solidDataManager.updateCustomer(id, customer),
    deleteCustomer: (id: string) => solidDataManager.deleteCustomer(id),
    getCustomer: (id: string) => solidDataManager.getCustomer(id),
    
    saveBusinessProfile: (profile: Omit<BusinessProfile, "id" | "createdAt" | "updatedAt">) => solidDataManager.saveBusinessProfile(profile),
    updateBusinessProfile: (profile: BusinessProfile) => solidDataManager.updateBusinessProfile(profile),
    
    createPayment: (payment: CreatePaymentRequest) => solidDataManager.createPayment(payment),
    getInvoicesWithBalance: () => solidDataManager.getInvoicesWithBalance(),
  };
};
