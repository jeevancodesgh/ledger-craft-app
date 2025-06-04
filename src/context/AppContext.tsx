import React, { createContext, useContext, useState, useEffect } from "react";
import { customerService, invoiceService, businessProfileService, itemService, itemCategoryService, accountService } from "@/services/supabaseService";
import { Customer, Invoice, BusinessProfile, Item, ItemCategory, Account } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface AppContextType {
  customers: Customer[];
  isLoadingCustomers: boolean;
  getCustomer: (id: string) => Promise<Customer | null>;
  createCustomer: (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => Promise<Customer>;
  updateCustomer: (id: string, customer: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  invoices: Invoice[];
  isLoadingInvoices: boolean;
  getInvoice: (id: string) => Promise<Invoice | null>;
  createInvoice: (invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt">) => Promise<Invoice>;
  updateInvoice: (invoice: Invoice) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<void>;
  refreshInvoices: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  businessProfile: BusinessProfile | null;
  isLoadingBusinessProfile: boolean;
  saveBusinessProfile: (profile: Omit<BusinessProfile, "id" | "createdAt" | "updatedAt">) => Promise<BusinessProfile>;
  updateBusinessProfile: (profile: BusinessProfile) => Promise<BusinessProfile>;
  refreshBusinessProfile: () => Promise<void>;
  items: Item[];
  isLoadingItems: boolean;
  getItem: (id: string) => Promise<Item | null>;
  createItem: (item: Omit<Item, "id" | "createdAt" | "updatedAt" | "category">) => Promise<Item>;
  updateItem: (id: string, item: Partial<Omit<Item, "id" | "createdAt" | "updatedAt" | "category">>) => Promise<Item>;
  deleteItem: (id: string) => Promise<void>;
  itemCategories: ItemCategory[];
  isLoadingItemCategories: boolean;
  createItemCategory: (category: Omit<ItemCategory, "id" | "createdAt" | "updatedAt">) => Promise<ItemCategory>;
  updateItemCategory: (id: string, category: Partial<Omit<ItemCategory, "id" | "createdAt" | "updatedAt">>) => Promise<ItemCategory>;
  deleteItemCategory: (id: string) => Promise<void>;
  fetchItemCategories: () => Promise<void>;
  getNextInvoiceNumber: () => Promise<string>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<Invoice>;
  accounts: Account[];
  isLoadingAccounts: boolean;
  getAccount: (id: string) => Promise<Account | null>;
  createAccount: (account: Omit<Account, "id" | "createdAt" | "updatedAt">) => Promise<Account>;
  updateAccount: (id: string, account: Partial<Omit<Account, "id" | "createdAt" | "updatedAt">>) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
  units: string[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [isLoadingBusinessProfile, setIsLoadingBusinessProfile] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [itemCategories, setItemCategories] = useState<ItemCategory[]>([]);
  const [isLoadingItemCategories, setIsLoadingItemCategories] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const defaultUnits = ['each', 'hour', 'kg', 'g', 'mg', 'liter', 'ml', 'meter', 'cm', 'mm', 'sq meter', 'sq foot', 'cubic meter', 'cubic foot', 'gallon', 'quart', 'pint', 'ounce', 'lb', 'box', 'pack', 'pair', 'roll', 'set', 'sheet', 'unit'];
  const [units, setUnits] = useState<string[]>(defaultUnits);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
    fetchInvoices();
    fetchBusinessProfile();
    fetchItems();
    fetchItemCategories();
    fetchAccounts();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const getCustomer = async (id: string) => {
    try {
      return await customerService.getCustomer(id);
    } catch (error) {
      console.error("Error loading customer:", error);
      toast({
        title: "Error",
        description: "Failed to load customer details. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const createCustomer = async (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newCustomer = await customerService.createCustomer(customer);
      setCustomers([...customers, newCustomer]);
      toast({
        title: "Success",
        description: "Customer created successfully.",
      });
      return newCustomer;
    } catch (error) {
      console.error("Error creating customer:", error);
      toast({
        title: "Error",
        description: "Failed to create customer. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCustomer = async (id: string, customer: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">>) => {
    try {
      const updatedCustomer = await customerService.updateCustomer(id, customer);
      setCustomers(customers.map(c => c.id === id ? updatedCustomer : c));
      toast({
        title: "Success",
        description: "Customer updated successfully.",
      });
      return updatedCustomer;
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({
        title: "Error",
        description: "Failed to update customer. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await customerService.deleteCustomer(id);
      setCustomers(customers.filter(c => c.id !== id));
      toast({
        title: "Success",
        description: "Customer deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const fetchInvoices = async () => {
    try {
      setIsLoadingInvoices(true);
      const data = await invoiceService.getInvoices();
      // Sort invoices by createdAt in descending order
      const sortedData = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setInvoices(sortedData);
    } catch (error) {
      console.error("Error loading invoices:", error);
      toast({
        title: "Error",
        description: "Failed to load invoices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const getInvoice = async (id: string) => {
    try {
      return await invoiceService.getInvoice(id);
    } catch (error) {
      console.error("Error loading invoice:", error);
      toast({
        title: "Error",
        description: "Failed to load invoice details. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const createInvoice = async (invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newInvoice = await invoiceService.createInvoice(invoice, invoice.items);
      setInvoices([...invoices, newInvoice]);
      toast({
        title: "Success",
        description: "Invoice created successfully.",
      });
      return newInvoice;
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateInvoice = async (invoice: Invoice) => {
    try {
      const { id, items, ...rest } = invoice;
      const updatedInvoice = await invoiceService.updateInvoice(id, { ...rest, items });
      setInvoices(invoices.map(i => i.id === id ? updatedInvoice : i));
      toast({
        title: "Success",
        description: "Invoice updated successfully.",
      });
      return updatedInvoice;
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      await invoiceService.deleteInvoice(id);
      setInvoices(invoices.filter(i => i.id !== id));
      toast({
        title: "Success",
        description: "Invoice deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Error",
        description: "Failed to delete invoice. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const refreshInvoices = async () => {
    await fetchInvoices();
  };

  const fetchBusinessProfile = async () => {
    try {
      setIsLoadingBusinessProfile(true);
      const data = await businessProfileService.getBusinessProfile();
      setBusinessProfile(data);
    } catch (error) {
      console.error("Error loading business profile:", error);
      toast({
        title: "Error",
        description: "Failed to load business profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBusinessProfile(false);
    }
  };

  const refreshBusinessProfile = async () => {
    await fetchBusinessProfile();
  };

  const saveBusinessProfile = async (profile: Omit<BusinessProfile, "id" | "createdAt" | "updatedAt">) => {
    try {
      const updatedProfile = await businessProfileService.createOrUpdateBusinessProfile(profile);
      setBusinessProfile(updatedProfile);
      toast({
        title: "Success",
        description: "Business profile saved successfully.",
      });
      return updatedProfile;
    } catch (error) {
      console.error("Error saving business profile:", error);
      toast({
        title: "Error",
        description: "Failed to save business profile. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateBusinessProfile = async (profile: BusinessProfile) => {
    try {
      const { id, ...rest } = profile;
      const updatedProfile = await businessProfileService.createOrUpdateBusinessProfile(rest);
      setBusinessProfile(updatedProfile);
      toast({
        title: "Success",
        description: "Business profile updated successfully.",
      });
      return updatedProfile;
    } catch (error) {
      console.error("Error updating business profile:", error);
      toast({
        title: "Error",
        description: "Failed to update business profile. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // New functions for items
  const fetchItems = async () => {
    try {
      setIsLoadingItems(true);
      const data = await itemService.getItems();
      setItems(data);
    } catch (error) {
      console.error("Error loading items:", error);
      toast({
        title: "Error",
        description: "Failed to load items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingItems(false);
    }
  };

  const getItem = async (id: string) => {
    try {
      return await itemService.getItem(id);
    } catch (error) {
      console.error("Error loading item:", error);
      toast({
        title: "Error",
        description: "Failed to load item details. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const createItem = async (item: Omit<Item, "id" | "createdAt" | "updatedAt" | "category">) => {
    try {
      const newItem = await itemService.createItem(item);
      setItems([...items, newItem]);
      toast({
        title: "Success",
        description: "Item created successfully.",
      });
      return newItem;
    } catch (error) {
      console.error("Error creating item:", error);
      toast({
        title: "Error",
        description: "Failed to create item. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateItem = async (id: string, item: Partial<Omit<Item, "id" | "createdAt" | "updatedAt" | "category">>) => {
    try {
      const updatedItem = await itemService.updateItem(id, item);
      setItems(items.map(i => i.id === id ? updatedItem : i));
      toast({
        title: "Success",
        description: "Item updated successfully.",
      });
      return updatedItem;
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await itemService.deleteItem(id);
      setItems(items.filter(i => i.id !== id));
      toast({
        title: "Success",
        description: "Item deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // New functions for item categories
  const fetchItemCategories = async () => {
    try {
      setIsLoadingItemCategories(true);
      const data = await itemCategoryService.getItemCategories();
      setItemCategories(data);
    } catch (error) {
      console.error("Error loading item categories:", error);
      toast({
        title: "Error",
        description: "Failed to load item categories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingItemCategories(false);
    }
  };

  const createItemCategory = async (category: Omit<ItemCategory, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newCategory = await itemCategoryService.createItemCategory(category);
      setItemCategories([...itemCategories, newCategory]);
      toast({
        title: "Success",
        description: "Category created successfully.",
      });
      return newCategory;
    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateItemCategory = async (id: string, category: Partial<Omit<ItemCategory, "id" | "createdAt" | "updatedAt">>) => {
    try {
      const updatedCategory = await itemCategoryService.updateItemCategory(id, category);
      setItemCategories(itemCategories.map(c => c.id === id ? updatedCategory : c));
      toast({
        title: "Success",
        description: "Category updated successfully.",
      });
      return updatedCategory;
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteItemCategory = async (id: string) => {
    try {
      await itemCategoryService.deleteItemCategory(id);
      setItemCategories(itemCategories.filter(c => c.id !== id));
      toast({
        title: "Success",
        description: "Category deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getNextInvoiceNumber = async () => {
    return await invoiceService.getNextInvoiceNumber();
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    try {
      const updatedInvoice = await invoiceService.updateInvoiceStatus(id, status);
      setInvoices(invoices.map(i => i.id === id ? updatedInvoice : i));
      toast({
        title: 'Success',
        description: 'Invoice status updated successfully.',
      });
      return updatedInvoice;
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update invoice status. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const refreshCustomers = async () => {
    await fetchCustomers();
  };

  const fetchAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const data = await accountService.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Error loading accounts:", error);
      toast({
        title: "Error",
        description: "Failed to load accounts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const getAccount = async (id: string) => {
    try {
      return await accountService.getAccount(id);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load account.", variant: "destructive" });
      return null;
    }
  };

  const createAccount = async (account: Omit<Account, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newAccount = await accountService.createAccount(account);
      setAccounts([...accounts, newAccount]);
      toast({ title: "Success", description: "Account created." });
      return newAccount;
    } catch (error) {
      toast({ title: "Error", description: "Failed to create account.", variant: "destructive" });
      throw error;
    }
  };

  const updateAccount = async (id: string, account: Partial<Omit<Account, "id" | "createdAt" | "updatedAt">>) => {
    try {
      const updated = await accountService.updateAccount(id, account);
      setAccounts(accounts.map(a => a.id === id ? updated : a));
      toast({ title: "Success", description: "Account updated." });
      return updated;
    } catch (error) {
      toast({ title: "Error", description: "Failed to update account.", variant: "destructive" });
      throw error;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await accountService.deleteAccount(id);
      setAccounts(accounts.filter(a => a.id !== id));
      toast({ title: "Success", description: "Account deleted." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete account.", variant: "destructive" });
      throw error;
    }
  };

  const refreshAccounts = async () => {
    await fetchAccounts();
  };

  return (
    <AppContext.Provider value={{
      customers,
      isLoadingCustomers,
      getCustomer,
      createCustomer,
      updateCustomer,
      deleteCustomer,
      invoices,
      isLoadingInvoices,
      getInvoice,
      createInvoice,
      updateInvoice,
      deleteInvoice,
      refreshInvoices,
      refreshCustomers,
      businessProfile,
      isLoadingBusinessProfile,
      saveBusinessProfile,
      updateBusinessProfile,
      refreshBusinessProfile,
      items,
      isLoadingItems,
      getItem,
      createItem,
      updateItem,
      deleteItem,
      itemCategories,
      isLoadingItemCategories,
      createItemCategory,
      updateItemCategory,
      deleteItemCategory,
      fetchItemCategories,
      getNextInvoiceNumber,
      updateInvoiceStatus,
      accounts,
      isLoadingAccounts,
      getAccount,
      createAccount,
      updateAccount,
      deleteAccount,
      refreshAccounts,
      units
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
