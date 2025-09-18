/**
 * Simple React hook for accessing stable data
 * This hook is HMR-safe and performance-optimized
 */

import { useState, useEffect, useCallback } from 'react';
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
  units: string[];
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

  // Memoized CRUD operations to prevent infinite loops in useEffect dependencies
  const createInvoice = useCallback((invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt">) => 
    solidDataManager.createInvoice(invoice), []);
  
  const updateInvoice = useCallback((invoice: Invoice) => 
    solidDataManager.updateInvoice(invoice), []);
  
  const deleteInvoice = useCallback((id: string) => 
    solidDataManager.deleteInvoice(id), []);
  
  const getInvoice = useCallback((id: string) => 
    solidDataManager.getInvoice(id), []);
  
  const getNextInvoiceNumber = useCallback(() => 
    solidDataManager.getNextInvoiceNumber(), []);
  
  const updateInvoiceStatus = useCallback((id: string, status: Invoice['status']) => 
    solidDataManager.updateInvoiceStatus(id, status), []);
  
  const createCustomer = useCallback((customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => 
    solidDataManager.createCustomer(customer), []);
  
  const updateCustomer = useCallback((id: string, customer: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">>) => 
    solidDataManager.updateCustomer(id, customer), []);
  
  const deleteCustomer = useCallback((id: string) => 
    solidDataManager.deleteCustomer(id), []);
  
  const getCustomer = useCallback((id: string) => 
    solidDataManager.getCustomer(id), []);
  
  const saveBusinessProfile = useCallback((profile: Omit<BusinessProfile, "id" | "createdAt" | "updatedAt">) => 
    solidDataManager.saveBusinessProfile(profile), []);
  
  const updateBusinessProfile = useCallback((profile: BusinessProfile) => 
    solidDataManager.updateBusinessProfile(profile), []);
  
  const createPayment = useCallback((payment: CreatePaymentRequest) => 
    solidDataManager.createPayment(payment), []);
  
  const getInvoicesWithBalance = useCallback(() => 
    solidDataManager.getInvoicesWithBalance(), []);

  const createItem = useCallback((item: Omit<Item, "id" | "createdAt" | "updatedAt" | "category">) => 
    solidDataManager.createItem(item), []);
  
  const updateItem = useCallback((id: string, item: Partial<Omit<Item, "id" | "createdAt" | "updatedAt" | "category">>) => 
    solidDataManager.updateItem(id, item), []);
  
  const deleteItem = useCallback((id: string) => 
    solidDataManager.deleteItem(id), []);
  
  const getItem = useCallback((id: string) => 
    solidDataManager.getItem(id), []);

  const createItemCategory = useCallback((category: Omit<ItemCategory, "id" | "createdAt" | "updatedAt">) => 
    solidDataManager.createItemCategory(category), []);
  
  const updateItemCategory = useCallback((id: string, category: Partial<Omit<ItemCategory, "id" | "createdAt" | "updatedAt">>) => 
    solidDataManager.updateItemCategory(id, category), []);
  
  const deleteItemCategory = useCallback((id: string) => 
    solidDataManager.deleteItemCategory(id), []);
  
  const getItemCategory = useCallback((id: string) => 
    solidDataManager.getItemCategory(id), []);

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
    
    // Memoized CRUD operations
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoice,
    getNextInvoiceNumber,
    updateInvoiceStatus,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,
    saveBusinessProfile,
    updateBusinessProfile,
    createPayment,
    getInvoicesWithBalance,
    createItem,
    updateItem,
    deleteItem,
    getItem,
    createItemCategory,
    updateItemCategory,
    deleteItemCategory,
    getItemCategory,
  };
};
