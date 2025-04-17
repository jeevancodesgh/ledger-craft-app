
import { supabase } from '@/integrations/supabase/client';
import { Customer, Invoice, BusinessProfile, LineItem } from '@/types';

// Customer service functions
export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
    
    return data || [];
  },

  async getCustomer(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
    
    return data;
  },

  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
    
    return data;
  },

  async updateCustomer(id: string, customer: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update(customer)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
    
    return data;
  },

  async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }
};

// Invoice service functions
export const invoiceService = {
  async getInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customers (name, email)
      `)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
    
    return data || [];
  },

  async getInvoice(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customers (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
    
    return data;
  },

  async getInvoicesForCustomer(customerId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('customer_id', customerId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching customer invoices:', error);
      throw error;
    }
    
    return data || [];
  },

  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>, lineItems: Omit<LineItem, 'id' | 'invoiceId' | 'createdAt' | 'updatedAt'>[]): Promise<Invoice> {
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert([invoice])
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      throw invoiceError;
    }

    if (lineItems.length > 0) {
      const itemsWithInvoiceId = lineItems.map(item => ({
        ...item,
        invoice_id: invoiceData.id
      }));

      const { error: lineItemsError } = await supabase
        .from('line_items')
        .insert(itemsWithInvoiceId);

      if (lineItemsError) {
        console.error('Error creating line items:', lineItemsError);
        throw lineItemsError;
      }
    }
    
    return invoiceData;
  },

  async updateInvoice(id: string, invoice: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update(invoice)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
    
    return data;
  },

  async deleteInvoice(id: string): Promise<void> {
    // Line items will cascade delete due to our foreign key constraint
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  },
  
  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating invoice status:', error);
      throw error;
    }
    
    return data;
  },

  async getLineItems(invoiceId: string): Promise<LineItem[]> {
    const { data, error } = await supabase
      .from('line_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at');

    if (error) {
      console.error('Error fetching line items:', error);
      throw error;
    }
    
    return data || [];
  },
  
  async addLineItem(invoiceId: string, lineItem: Omit<LineItem, 'id' | 'invoiceId' | 'createdAt' | 'updatedAt'>): Promise<LineItem> {
    const { data, error } = await supabase
      .from('line_items')
      .insert([{ ...lineItem, invoice_id: invoiceId }])
      .select()
      .single();

    if (error) {
      console.error('Error adding line item:', error);
      throw error;
    }
    
    return data;
  },
  
  async updateLineItem(id: string, lineItem: Partial<Omit<LineItem, 'id' | 'invoiceId' | 'createdAt' | 'updatedAt'>>): Promise<LineItem> {
    const { data, error } = await supabase
      .from('line_items')
      .update(lineItem)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating line item:', error);
      throw error;
    }
    
    return data;
  },
  
  async deleteLineItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('line_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting line item:', error);
      throw error;
    }
  }
};

// Business Profile service functions
export const businessProfileService = {
  async getBusinessProfile(): Promise<BusinessProfile | null> {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      console.error('Error fetching business profile:', error);
      throw error;
    }
    
    return data || null;
  },

  async createOrUpdateBusinessProfile(profile: Omit<BusinessProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<BusinessProfile> {
    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from('business_profiles')
      .select('id')
      .limit(1);
    
    let result;
    
    if (existingProfile && existingProfile.length > 0) {
      // Update existing profile
      const { data, error } = await supabase
        .from('business_profiles')
        .update(profile)
        .eq('id', existingProfile[0].id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating business profile:', error);
        throw error;
      }
      
      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('business_profiles')
        .insert([profile])
        .select()
        .single();
        
      if (error) {
        console.error('Error creating business profile:', error);
        throw error;
      }
      
      result = data;
    }
    
    return result;
  }
};

// Dashboard stats service
export const dashboardService = {
  async getDashboardStats() {
    // Get all invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*');
      
    if (invoicesError) {
      console.error('Error fetching invoices for stats:', invoicesError);
      throw invoicesError;
    }
    
    // Get customer count
    const { count: customerCount, error: customerError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
      
    if (customerError) {
      console.error('Error counting customers:', customerError);
      throw customerError;
    }
    
    const totalEarnings = invoices
      ?.filter(i => i.status === 'paid')
      .reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0) || 0;
      
    const paidInvoices = invoices?.filter(i => i.status === 'paid').length || 0;
    const unpaidInvoices = invoices?.filter(i => i.status === 'sent').length || 0;
    const overdueInvoices = invoices?.filter(i => i.status === 'overdue').length || 0;
    
    // Calculate revenue by month for the current year
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = Array(12).fill(0).map((_, i) => ({ month: i + 1, revenue: 0 }));
    
    invoices
      ?.filter(invoice => {
        const invoiceYear = new Date(invoice.date).getFullYear();
        return invoiceYear === currentYear && invoice.status === 'paid';
      })
      .forEach(invoice => {
        const month = new Date(invoice.date).getMonth();
        monthlyRevenue[month].revenue += Number(invoice.total) || 0;
      });
      
    return {
      totalEarnings,
      paidInvoices,
      unpaidInvoices,
      overdueInvoices,
      customerCount: customerCount || 0,
      revenueByMonth: monthlyRevenue
    };
  }
};
