
import { Customer, Invoice, BusinessProfile, LineItem } from '@/types';
import { mockCustomers, mockInvoices, mockBusinessProfile } from './mockData';
import { generateInvoiceNumber, calculateSubtotal, calculateTaxAmount, calculateTotal } from '@/utils/invoiceUtils';

// Simulate API latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory store
let customers = [...mockCustomers];
let invoices = [...mockInvoices];
let businessProfile = { ...mockBusinessProfile };

// Customer API
export const customerApi = {
  async getCustomers(): Promise<Customer[]> {
    await delay(300);
    return [...customers];
  },

  async getCustomer(id: string): Promise<Customer | undefined> {
    await delay(200);
    return customers.find(c => c.id === id);
  },

  async createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    await delay(400);
    const newCustomer = {
      ...customer,
      id: `c${customers.length + 1}`,
    };
    customers = [...customers, newCustomer];
    return newCustomer;
  },

  async updateCustomer(customer: Customer): Promise<Customer> {
    await delay(400);
    customers = customers.map(c => c.id === customer.id ? customer : c);
    return customer;
  },

  async deleteCustomer(id: string): Promise<void> {
    await delay(300);
    customers = customers.filter(c => c.id !== id);
  }
};

// Invoice API
export const invoiceApi = {
  async getInvoices(): Promise<Invoice[]> {
    await delay(400);
    return [...invoices];
  },

  async getInvoice(id: string): Promise<Invoice | undefined> {
    await delay(200);
    return invoices.find(i => i.id === id);
  },

  async getInvoicesForCustomer(customerId: string): Promise<Invoice[]> {
    await delay(300);
    return invoices.filter(i => i.customerId === customerId);
  },

  async createInvoice(invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    await delay(500);
    const newInvoice: Invoice = {
      ...invoice,
      id: `i${invoices.length + 1}`,
      invoiceNumber: generateInvoiceNumber(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    invoices = [...invoices, newInvoice];
    return newInvoice;
  },

  async updateInvoice(invoice: Invoice): Promise<Invoice> {
    await delay(400);
    const updatedInvoice = {
      ...invoice,
      updatedAt: new Date().toISOString()
    };
    invoices = invoices.map(i => i.id === invoice.id ? updatedInvoice : i);
    return updatedInvoice;
  },

  async deleteInvoice(id: string): Promise<void> {
    await delay(300);
    invoices = invoices.filter(i => i.id !== id);
  },

  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<Invoice | undefined> {
    await delay(300);
    const invoice = invoices.find(i => i.id === id);
    if (!invoice) return undefined;
    
    const updatedInvoice = {
      ...invoice,
      status,
      updatedAt: new Date().toISOString()
    };
    
    invoices = invoices.map(i => i.id === id ? updatedInvoice : i);
    return updatedInvoice;
  },

  async getInvoiceWithCustomer(id: string): Promise<Invoice | undefined> {
    await delay(300);
    const invoice = invoices.find(i => i.id === id);
    if (!invoice) return undefined;
    
    const customer = customers.find(c => c.id === invoice.customerId);
    if (!customer) return invoice;
    
    return {
      ...invoice,
      customer
    };
  }
};

// Business Profile API
export const businessProfileApi = {
  async getBusinessProfile(): Promise<BusinessProfile> {
    await delay(200);
    return { ...businessProfile };
  },

  async updateBusinessProfile(profile: BusinessProfile): Promise<BusinessProfile> {
    await delay(300);
    businessProfile = { ...profile };
    return businessProfile;
  }
};

// Invoice calculators
export const invoiceCalculator = {
  async calculateInvoiceItems(items: Omit<LineItem, 'id' | 'total'>[]): Promise<LineItem[]> {
    await delay(100);
    return items.map(item => ({
      ...item,
      id: `item-${Math.random().toString(36).substring(2, 9)}`,
      total: item.quantity * item.rate
    }));
  },

  async calculateInvoiceTotals(items: LineItem[]): Promise<{ subtotal: number; taxAmount: number; total: number; }> {
    await delay(100);
    const subtotal = calculateSubtotal(items);
    const taxAmount = calculateTaxAmount(items);
    const total = calculateTotal(subtotal, taxAmount);
    
    return { subtotal, taxAmount, total };
  }
};

// Dashboard API
export const dashboardApi = {
  async getStats(): Promise<{
    totalEarnings: number;
    paidInvoices: number;
    unpaidInvoices: number;
    overdueInvoices: number;
    customerCount: number;
  }> {
    await delay(500);
    
    const totalEarnings = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total, 0);
      
    const paidInvoices = invoices.filter(i => i.status === 'paid').length;
    const unpaidInvoices = invoices.filter(i => i.status === 'sent').length;
    const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;
    
    return {
      totalEarnings,
      paidInvoices,
      unpaidInvoices,
      overdueInvoices,
      customerCount: customers.length
    };
  },
  
  async getRevenueByMonth(year = new Date().getFullYear()): Promise<{ month: number; revenue: number }[]> {
    await delay(400);
    
    const monthlyRevenue = Array(12).fill(0).map((_, i) => ({ month: i + 1, revenue: 0 }));
    
    invoices
      .filter(invoice => {
        const invoiceYear = new Date(invoice.date).getFullYear();
        return invoiceYear === year && invoice.status === 'paid';
      })
      .forEach(invoice => {
        const month = new Date(invoice.date).getMonth();
        monthlyRevenue[month].revenue += invoice.total;
      });
      
    return monthlyRevenue;
  }
};
