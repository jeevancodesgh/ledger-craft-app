import { supabase } from '@/integrations/supabase/client';
import { 
  Customer, Invoice, BusinessProfile, LineItem,
  SupabaseCustomer, SupabaseInvoice, SupabaseLineItem, SupabaseBusinessProfile
} from '@/types';

// Converters between our app types and Supabase types
const mapSupabaseCustomerToCustomer = (customer: SupabaseCustomer): Customer => ({
  id: customer.id,
  name: customer.name,
  email: customer.email,
  address: customer.address,
  city: customer.city,
  state: customer.state,
  zip: customer.zip,
  country: customer.country,
  phone: customer.phone || undefined,
  isVip: customer.is_vip || false,
  tags: customer.tags || [],
  userId: customer.user_id,
  createdAt: customer.created_at,
  updatedAt: customer.updated_at
});

const mapCustomerToSupabaseCustomer = async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Omit<SupabaseCustomer, 'id' | 'created_at' | 'updated_at'>> => {
  // Get current user ID
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  return {
    name: customer.name,
    email: customer.email,
    address: customer.address || null,
    city: customer.city || null,
    state: customer.state || null,
    zip: customer.zip || null,
    country: customer.country || 'USA',
    phone: customer.phone || null,
    is_vip: customer.isVip || false,
    tags: customer.tags || null,
    user_id: customer.userId || userId
  };
};

const mapSupabaseInvoiceToInvoice = (invoice: SupabaseInvoice | any, items: SupabaseLineItem[] = []): Invoice => ({
  id: invoice.id,
  invoiceNumber: invoice.invoice_number,
  customerId: invoice.customer_id,
  customer: invoice.customers ? {
    id: invoice.customer_id,
    name: invoice.customers.name,
    email: invoice.customers.email,
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA'
  } : undefined,
  date: invoice.date,
  dueDate: invoice.due_date,
  items: items.map(item => ({
    id: item.id,
    invoiceId: item.invoice_id,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit || 'each', // Handle missing unit field with default
    rate: item.rate,
    tax: item.tax,
    total: item.total
  })),
  subtotal: invoice.subtotal,
  taxAmount: invoice.tax_amount,
  discount: invoice.discount,
  additionalCharges: invoice.additional_charges,
  total: invoice.total,
  status: invoice.status,
  notes: invoice.notes || undefined,
  terms: invoice.terms || undefined,
  currency: invoice.currency,
  userId: invoice.user_id,
  createdAt: invoice.created_at,
  updatedAt: invoice.updated_at
});

const mapInvoiceToSupabaseInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Omit<SupabaseInvoice, 'id' | 'created_at' | 'updated_at'>> => {
  // Get current user ID
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  return {
    invoice_number: invoice.invoiceNumber,
    customer_id: invoice.customerId,
    date: invoice.date,
    due_date: invoice.dueDate,
    subtotal: invoice.subtotal,
    tax_amount: invoice.taxAmount,
    discount: invoice.discount || null,
    additional_charges: invoice.additionalCharges || null,
    total: invoice.total,
    status: invoice.status,
    notes: invoice.notes || null,
    terms: invoice.terms || null,
    currency: invoice.currency,
    user_id: invoice.userId || userId
  };
};

const mapSupabaseBusinessProfileToBusinessProfile = (profile: SupabaseBusinessProfile): BusinessProfile => ({
  id: profile.id,
  name: profile.name,
  email: profile.email,
  phone: profile.phone,
  address: profile.address,
  city: profile.city,
  state: profile.state,
  zip: profile.zip,
  country: profile.country,
  taxId: profile.tax_id,
  logoUrl: profile.logo_url,
  website: profile.website,
  defaultTaxRate: profile.default_tax_rate,
  defaultTerms: profile.default_terms,
  defaultNotes: profile.default_notes,
  bankInfo: profile.bank_info,
  userId: profile.user_id,
  createdAt: profile.created_at,
  updatedAt: profile.updated_at,
  invoiceNumberFormat: profile.invoice_number_format,
  invoiceNumberSequence: profile.invoice_number_sequence
});

const mapBusinessProfileToSupabaseBusinessProfile = async (
  profile: Omit<BusinessProfile, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Omit<SupabaseBusinessProfile, 'id' | 'created_at' | 'updated_at'>> => {
  // Get current user ID
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  return {
    name: profile.name,
    email: profile.email,
    phone: profile.phone || null,
    address: profile.address || null,
    city: profile.city || null,
    state: profile.state || null,
    zip: profile.zip || null,
    country: profile.country || 'USA',
    tax_id: profile.taxId || null,
    logo_url: profile.logoUrl || null,
    website: profile.website || null,
    default_tax_rate: profile.defaultTaxRate || null,
    default_terms: profile.defaultTerms || null,
    default_notes: profile.defaultNotes || null,
    bank_info: profile.bankInfo || null,
    user_id: profile.userId || userId,
    invoice_number_format: profile.invoiceNumberFormat || null,
    invoice_number_sequence: profile.invoiceNumberSequence ?? null
  };
};

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
    
    return (data as SupabaseCustomer[]).map(mapSupabaseCustomerToCustomer) || [];
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
    
    return data ? mapSupabaseCustomerToCustomer(data as SupabaseCustomer) : null;
  },

  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const supabaseCustomer = await mapCustomerToSupabaseCustomer(customer);
    
    const { data, error } = await supabase
      .from('customers')
      .insert([supabaseCustomer])
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
    
    return mapSupabaseCustomerToCustomer(data as SupabaseCustomer);
  },

  async updateCustomer(id: string, customer: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Customer> {
    // First get the existing customer to properly merge with updates
    const existingCustomer = await this.getCustomer(id);
    if (!existingCustomer) {
      throw new Error(`Customer with id ${id} not found`);
    }
    
    // Merge existing with updates
    const mergedCustomer = {
      ...existingCustomer,
      ...customer,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined
    };
    
    // Convert to Supabase format
    const supabaseCustomer = await mapCustomerToSupabaseCustomer(mergedCustomer as Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>);
    
    const { data, error } = await supabase
      .from('customers')
      .update(supabaseCustomer)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
    
    return mapSupabaseCustomerToCustomer(data as SupabaseCustomer);
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
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        customers (name, email)
      `)
      .order('date', { ascending: false });

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
      throw invoicesError;
    }
    
    // For each invoice, fetch its line items
    const invoices = await Promise.all((invoicesData as SupabaseInvoice[]).map(async (invoice) => {
      const { data: lineItemsData } = await supabase
        .from('line_items')
        .select('*')
        .eq('invoice_id', invoice.id);
      
      // Cast to unknown first to avoid TypeScript errors with potentially missing fields
      return mapSupabaseInvoiceToInvoice(invoice as unknown as SupabaseInvoice, lineItemsData as SupabaseLineItem[]);
    }));
    
    return invoices || [];
  },

  async getInvoice(id: string): Promise<Invoice | null> {
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customers (*)
      `)
      .eq('id', id)
      .single();

    if (invoiceError) {
      console.error('Error fetching invoice:', invoiceError);
      throw invoiceError;
    }
    
    if (!invoiceData) {
      return null;
    }
    
    // Fetch line items for this invoice
    const { data: lineItemsData, error: lineItemsError } = await supabase
      .from('line_items')
      .select('*')
      .eq('invoice_id', id);
      
    if (lineItemsError) {
      console.error('Error fetching line items:', lineItemsError);
      throw lineItemsError;
    }
    
    // Cast to unknown first to avoid TypeScript errors with potentially missing fields
    return mapSupabaseInvoiceToInvoice(invoiceData as unknown as SupabaseInvoice, lineItemsData as SupabaseLineItem[]);
  },

  async getInvoicesForCustomer(customerId: string): Promise<Invoice[]> {
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('customer_id', customerId)
      .order('date', { ascending: false });

    if (invoicesError) {
      console.error('Error fetching customer invoices:', invoicesError);
      throw invoicesError;
    }
    
    // For each invoice, fetch its line items
    const invoices = await Promise.all((invoicesData as any[]).map(async (invoice) => {
      const { data: lineItemsData } = await supabase
        .from('line_items')
        .select('*')
        .eq('invoice_id', invoice.id);
      
      // Cast to unknown first to avoid TypeScript errors with potentially missing fields
      return mapSupabaseInvoiceToInvoice(invoice as unknown as SupabaseInvoice, lineItemsData as SupabaseLineItem[]);
    }));
    
    return invoices || [];
  },

  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>, lineItems: Omit<LineItem, 'id' | 'invoiceId' | 'createdAt' | 'updatedAt'>[]): Promise<Invoice> {
    // Convert invoice to Supabase format - make sure to await the result
    const supabaseInvoice = await mapInvoiceToSupabaseInvoice(invoice);
    
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert([supabaseInvoice])
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      throw invoiceError;
    }

    if (lineItems.length > 0) {
      const itemsWithInvoiceId = lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || 'each', // Added unit with default value
        rate: item.rate,
        tax: item.tax || null,
        total: item.total,
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
    
    // Fetch the complete invoice with line items
    return this.getInvoice(invoiceData.id) as Promise<Invoice>;
  },

  async updateInvoice(id: string, invoice: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Invoice> {
    // First get the existing invoice to properly merge with updates
    const existingInvoice = await this.getInvoice(id);
    if (!existingInvoice) {
      throw new Error(`Invoice with id ${id} not found`);
    }
    
    // Extract only updatable fields
    const { items, customer, ...updatableInvoice } = invoice;
    
    // Create a merged object with all fields mapped to Supabase format
    const updatedInvoiceFields: Partial<SupabaseInvoice> = {};
    
    if (updatableInvoice.invoiceNumber) updatedInvoiceFields.invoice_number = updatableInvoice.invoiceNumber;
    if (updatableInvoice.customerId) updatedInvoiceFields.customer_id = updatableInvoice.customerId;
    if (updatableInvoice.date) updatedInvoiceFields.date = updatableInvoice.date;
    if (updatableInvoice.dueDate) updatedInvoiceFields.due_date = updatableInvoice.dueDate;
    if (updatableInvoice.subtotal) updatedInvoiceFields.subtotal = updatableInvoice.subtotal;
    if (updatableInvoice.taxAmount !== undefined) updatedInvoiceFields.tax_amount = updatableInvoice.taxAmount;
    if (updatableInvoice.discount !== undefined) updatedInvoiceFields.discount = updatableInvoice.discount;
    if (updatableInvoice.additionalCharges !== undefined) updatedInvoiceFields.additional_charges = updatableInvoice.additionalCharges;
    if (updatableInvoice.total) updatedInvoiceFields.total = updatableInvoice.total;
    if (updatableInvoice.status) updatedInvoiceFields.status = updatableInvoice.status;
    if (updatableInvoice.notes !== undefined) updatedInvoiceFields.notes = updatableInvoice.notes;
    if (updatableInvoice.terms !== undefined) updatedInvoiceFields.terms = updatableInvoice.terms;
    if (updatableInvoice.currency) updatedInvoiceFields.currency = updatableInvoice.currency;
    
    const { data, error } = await supabase
      .from('invoices')
      .update(updatedInvoiceFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
    
    // Handle line items updates if provided
    if (items && items.length > 0) {
      // For simplicity, we're replacing all line items
      // Delete existing items
      await supabase
        .from('line_items')
        .delete()
        .eq('invoice_id', id);
        
      // Insert new items
      const newItems = items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || 'each', // Added unit with default value
        rate: item.rate,
        tax: item.tax || null,
        total: item.total,
        invoice_id: id
      }));
      
      await supabase
        .from('line_items')
        .insert(newItems);
    }
    
    // Return the complete updated invoice
    return this.getInvoice(id) as Promise<Invoice>;
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
    
    // Return full invoice with line items
    return this.getInvoice(id) as Promise<Invoice>;
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
    
    return (data as SupabaseLineItem[]).map(item => ({
      id: item.id,
      invoiceId: item.invoice_id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit || 'each', // Handle missing unit field with default
      rate: item.rate,
      tax: item.tax,
      total: item.total,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    })) || [];
  },
  
  async addLineItem(invoiceId: string, lineItem: Omit<LineItem, 'id' | 'invoiceId' | 'createdAt' | 'updatedAt'>): Promise<LineItem> {
    const { data, error } = await supabase
      .from('line_items')
      .insert([{ 
        description: lineItem.description,
        quantity: lineItem.quantity,
        unit: lineItem.unit || 'each', // Added unit with default value
        rate: lineItem.rate,
        tax: lineItem.tax || null,
        total: lineItem.total,
        invoice_id: invoiceId 
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding line item:', error);
      throw error;
    }
    
    return {
      id: data.id,
      invoiceId: data.invoice_id,
      description: data.description,
      quantity: data.quantity,
      unit: data.unit || 'each', // Handle missing unit field with default
      rate: data.rate,
      tax: data.tax,
      total: data.total,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },
  
  async updateLineItem(id: string, lineItem: Partial<Omit<LineItem, 'id' | 'invoiceId' | 'createdAt' | 'updatedAt'>>): Promise<LineItem> {
    const updateData: any = {};
    if (lineItem.description !== undefined) updateData.description = lineItem.description;
    if (lineItem.quantity !== undefined) updateData.quantity = lineItem.quantity;
    if (lineItem.unit !== undefined) updateData.unit = lineItem.unit; // Added unit
    if (lineItem.rate !== undefined) updateData.rate = lineItem.rate;
    if (lineItem.tax !== undefined) updateData.tax = lineItem.tax;
    if (lineItem.total !== undefined) updateData.total = lineItem.total;
    
    const { data, error } = await supabase
      .from('line_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating line item:', error);
      throw error;
    }
    
    return {
      id: data.id,
      invoiceId: data.invoice_id,
      description: data.description,
      quantity: data.quantity,
      unit: data.unit || 'each', // Handle missing unit field with default
      rate: data.rate,
      tax: data.tax,
      total: data.total,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      console.error('No authenticated user found');
      return null;
    }
    
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching business profile:', error);
      throw error;
    }
    
    return data ? mapSupabaseBusinessProfileToBusinessProfile(data as SupabaseBusinessProfile) : null;
  },

  async createOrUpdateBusinessProfile(profile: Omit<BusinessProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<BusinessProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      throw new Error('No authenticated user');
    }
    
    // Add the user_id to the profile
    const profileWithUserId = {
      ...profile,
      userId: user.id
    };
    
    const supabaseProfile = await mapBusinessProfileToSupabaseBusinessProfile(profileWithUserId);
    
    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
    
    let result;
    
    if (existingProfile && existingProfile.length > 0) {
      // Update existing profile
      const { data, error } = await supabase
        .from('business_profiles')
        .update(supabaseProfile)
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
        .insert([supabaseProfile])
        .select()
        .single();
        
      if (error) {
        console.error('Error creating business profile:', error);
        throw error;
      }
      
      result = data;
    }
    
    return mapSupabaseBusinessProfileToBusinessProfile(result as SupabaseBusinessProfile);
  }
};

// Dashboard stats service
export const dashboardService = {
  async getDashboardStats() {
    const user = await supabase.auth.getUser();
    if (!user.data.user?.id) {
      throw new Error('No authenticated user');
    }
    
    // Get all invoices for the current user
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.data.user.id);
      
    if (invoicesError) {
      console.error('Error fetching invoices for stats:', invoicesError);
      throw invoicesError;
    }
    
    // Get customer count for the current user
    const { count: customerCount, error: customerError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.data.user.id);
      
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
