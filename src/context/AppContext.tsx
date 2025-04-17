
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Customer, Invoice, BusinessProfile } from '@/types';
import { customerApi, invoiceApi, businessProfileApi, dashboardApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalEarnings: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  customerCount: number;
  revenueByMonth: { month: number; revenue: number }[];
}

interface AppContextType {
  // Data
  customers: Customer[];
  invoices: Invoice[];
  businessProfile: BusinessProfile | null;
  dashboardStats: DashboardStats | null;
  
  // Loading states
  isLoadingCustomers: boolean;
  isLoadingInvoices: boolean;
  isLoadingProfile: boolean;
  isLoadingStats: boolean;
  
  // Customer methods
  getCustomer: (id: string) => Promise<Customer | undefined>;
  createCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer>;
  updateCustomer: (customer: Customer) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  
  // Invoice methods
  getInvoice: (id: string) => Promise<Invoice | undefined>;
  getInvoicesForCustomer: (customerId: string) => Promise<Invoice[]>;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => Promise<Invoice>;
  updateInvoice: (invoice: Invoice) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<void>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<Invoice | undefined>;
  
  // Business profile methods
  updateBusinessProfile: (profile: BusinessProfile) => Promise<BusinessProfile>;
  
  // Refresh methods
  refreshCustomers: () => Promise<void>;
  refreshInvoices: () => Promise<void>;
  refreshBusinessProfile: () => Promise<void>;
  refreshDashboardStats: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  
  // Loading states
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // Load initial data
  useEffect(() => {
    refreshCustomers();
    refreshInvoices();
    refreshBusinessProfile();
    refreshDashboardStats();
  }, []);
  
  // Customers methods
  const refreshCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const data = await customerApi.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customers',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCustomers(false);
    }
  };
  
  const getCustomer = async (id: string) => {
    try {
      return await customerApi.getCustomer(id);
    } catch (error) {
      console.error('Error getting customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to get customer details',
        variant: 'destructive',
      });
      return undefined;
    }
  };
  
  const createCustomer = async (customer: Omit<Customer, 'id'>) => {
    try {
      const newCustomer = await customerApi.createCustomer(customer);
      await refreshCustomers();
      toast({
        title: 'Success',
        description: 'Customer created successfully',
      });
      return newCustomer;
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to create customer',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  const updateCustomer = async (customer: Customer) => {
    try {
      const updatedCustomer = await customerApi.updateCustomer(customer);
      await refreshCustomers();
      toast({
        title: 'Success',
        description: 'Customer updated successfully',
      });
      return updatedCustomer;
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to update customer',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  const deleteCustomer = async (id: string) => {
    try {
      await customerApi.deleteCustomer(id);
      await refreshCustomers();
      toast({
        title: 'Success',
        description: 'Customer deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  // Invoice methods
  const refreshInvoices = async () => {
    setIsLoadingInvoices(true);
    try {
      const data = await invoiceApi.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoices',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingInvoices(false);
    }
  };
  
  const getInvoice = async (id: string) => {
    try {
      return await invoiceApi.getInvoice(id);
    } catch (error) {
      console.error('Error getting invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to get invoice details',
        variant: 'destructive',
      });
      return undefined;
    }
  };
  
  const getInvoicesForCustomer = async (customerId: string) => {
    try {
      return await invoiceApi.getInvoicesForCustomer(customerId);
    } catch (error) {
      console.error('Error getting customer invoices:', error);
      toast({
        title: 'Error',
        description: 'Failed to get customer invoices',
        variant: 'destructive',
      });
      return [];
    }
  };
  
  const createInvoice = async (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newInvoice = await invoiceApi.createInvoice(invoice);
      await refreshInvoices();
      toast({
        title: 'Success',
        description: 'Invoice created successfully',
      });
      return newInvoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  const updateInvoice = async (invoice: Invoice) => {
    try {
      const updatedInvoice = await invoiceApi.updateInvoice(invoice);
      await refreshInvoices();
      toast({
        title: 'Success',
        description: 'Invoice updated successfully',
      });
      return updatedInvoice;
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to update invoice',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  const deleteInvoice = async (id: string) => {
    try {
      await invoiceApi.deleteInvoice(id);
      await refreshInvoices();
      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete invoice',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    try {
      const updatedInvoice = await invoiceApi.updateInvoiceStatus(id, status);
      await refreshInvoices();
      toast({
        title: 'Success',
        description: 'Invoice status updated successfully',
      });
      return updatedInvoice;
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update invoice status',
        variant: 'destructive',
      });
      return undefined;
    }
  };
  
  // Business profile methods
  const refreshBusinessProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const data = await businessProfileApi.getBusinessProfile();
      setBusinessProfile(data);
    } catch (error) {
      console.error('Error loading business profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load business profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };
  
  const updateBusinessProfile = async (profile: BusinessProfile) => {
    try {
      const updatedProfile = await businessProfileApi.updateBusinessProfile(profile);
      setBusinessProfile(updatedProfile);
      toast({
        title: 'Success',
        description: 'Business profile updated successfully',
      });
      return updatedProfile;
    } catch (error) {
      console.error('Error updating business profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update business profile',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  // Dashboard stats
  const refreshDashboardStats = async () => {
    setIsLoadingStats(true);
    try {
      const [stats, revenueByMonth] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRevenueByMonth()
      ]);
      
      setDashboardStats({
        ...stats,
        revenueByMonth
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard statistics',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingStats(false);
    }
  };
  
  const value = {
    // Data
    customers,
    invoices,
    businessProfile,
    dashboardStats,
    
    // Loading states
    isLoadingCustomers,
    isLoadingInvoices,
    isLoadingProfile,
    isLoadingStats,
    
    // Customer methods
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    
    // Invoice methods
    getInvoice,
    getInvoicesForCustomer,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    
    // Business profile methods
    updateBusinessProfile,
    
    // Refresh methods
    refreshCustomers,
    refreshInvoices,
    refreshBusinessProfile,
    refreshDashboardStats,
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
