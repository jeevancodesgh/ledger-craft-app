import { supabase } from '@/integrations/supabase/client';
import { 
  Customer, Invoice, BusinessProfile, LineItem, ItemCategory, Item,
  SupabaseCustomer, SupabaseInvoice, SupabaseLineItem, SupabaseBusinessProfile, SupabaseItemCategory, SupabaseItem,
  Account, SupabaseAccount, AccountType
} from '@/types';

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
    unit: item.unit || 'each',
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

const mapSupabaseItemCategoryToItemCategory = (category: SupabaseItemCategory): ItemCategory => ({
  id: category.id,
  name: category.name,
  userId: category.user_id,
  createdAt: category.created_at,
  updatedAt: category.updated_at
});

const mapItemCategoryToSupabaseItemCategory = async (category: Omit<ItemCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Omit<SupabaseItemCategory, 'id' | 'created_at' | 'updated_at'>> => {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  return {
    name: category.name,
    user_id: category.userId || userId
  };
};

const mapSupabaseItemToItem = (supabaseItem: any): Item => {
  return {
    id: supabaseItem.id,
    name: supabaseItem.name,
    description: supabaseItem.description,
    type: supabaseItem.type as 'product' | 'service',  // Ensure it's cast to the right type
    categoryId: supabaseItem.category_id,
    salePrice: supabaseItem.sale_price,
    purchasePrice: supabaseItem.purchase_price,
    taxRate: supabaseItem.tax_rate,
    enableSaleInfo: supabaseItem.enable_sale_info,
    enablePurchaseInfo: supabaseItem.enable_purchase_info,
    unit: supabaseItem.unit || 'each',
    category: supabaseItem.item_categories ? {
      id: supabaseItem.item_categories.id,
      name: supabaseItem.item_categories.name,
    } : undefined,
    createdAt: supabaseItem.created_at,
    updatedAt: supabaseItem.updated_at
  };
};

const mapItemToSupabaseItem = async (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'category'>): Promise<Omit<SupabaseItem, 'id' | 'created_at' | 'updated_at'>> => {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  return {
    name: item.name,
    description: item.description || null,
    type: item.type,
    category_id: item.categoryId || null,
    sale_price: item.salePrice || null,
    purchase_price: item.purchasePrice || null,
    tax_rate: item.taxRate || null,
    enable_sale_info: item.enableSaleInfo,
    enable_purchase_info: item.enablePurchaseInfo,
    unit: item.unit || 'each',
    user_id: item.userId || userId
  };
};

const mapSupabaseAccountToAccount = (account: SupabaseAccount): Account => ({
  id: account.id,
  name: account.name,
  type: account.type,
  currency: account.currency,
  openingBalance: account.opening_balance,
  currentBalance: account.current_balance,
  userId: account.user_id,
  createdAt: account.created_at,
  updatedAt: account.updated_at,
});

const mapAccountToSupabaseAccount = async (
  account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Omit<SupabaseAccount, 'id' | 'created_at' | 'updated_at'>> => {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';
  return {
    name: account.name,
    type: account.type,
    currency: account.currency,
    opening_balance: account.openingBalance,
    current_balance: account.currentBalance,
    user_id: account.userId || userId,
  };
};

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
    const existingCustomer = await this.getCustomer(id);
    if (!existingCustomer) {
      throw new Error(`Customer with id ${id} not found`);
    }
    
    const mergedCustomer = {
      ...existingCustomer,
      ...customer,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined
    };
    
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
    
    const invoices = await Promise.all((invoicesData as SupabaseInvoice[]).map(async (invoice) => {
      const { data: lineItemsData } = await supabase
        .from('line_items')
        .select('*')
        .eq('invoice_id', invoice.id);
      
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
    
    const { data: lineItemsData, error: lineItemsError } = await supabase
      .from('line_items')
      .select('*')
      .eq('invoice_id', id);
      
    if (lineItemsError) {
      console.error('Error fetching line items:', lineItemsError);
      throw lineItemsError;
    }
    
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
    
    const invoices = await Promise.all((invoicesData as any[]).map(async (invoice) => {
      const { data: lineItemsData } = await supabase
        .from('line_items')
        .select('*')
        .eq('invoice_id', invoice.id);
      
      return mapSupabaseInvoiceToInvoice(invoice as unknown as SupabaseInvoice, lineItemsData as SupabaseLineItem[]);
    }));
    
    return invoices || [];
  },

  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>, lineItems: Omit<LineItem, 'id' | 'invoiceId' | 'createdAt' | 'updatedAt'>[]): Promise<Invoice> {
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
        unit: item.unit || 'each',
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
    
    return this.getInvoice(invoiceData.id) as Promise<Invoice>;
  },

  async updateInvoice(id: string, invoice: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Invoice> {
    const existingInvoice = await this.getInvoice(id);
    if (!existingInvoice) {
      throw new Error(`Invoice with id ${id} not found`);
    }
    
    const { items, customer, ...updatableInvoice } = invoice;
    
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
    
    if (items && items.length > 0) {
      await supabase
        .from('line_items')
        .delete()
        .eq('invoice_id', id);
        
      const newItems = items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || 'each',
        rate: item.rate,
        tax: item.tax || null,
        total: item.total,
        invoice_id: id
      }));
      
      await supabase
        .from('line_items')
        .insert(newItems);
    }
    
    return this.getInvoice(id) as Promise<Invoice>;
  },

  async deleteInvoice(id: string): Promise<void> {
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
      unit: 'each',
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
        unit: lineItem.unit || 'each',
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
      unit: 'each',
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
    if (lineItem.unit !== undefined) updateData.unit = lineItem.unit;
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
      unit: 'each',
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
  },

  async getNextInvoiceNumber(): Promise<string> {
    // Get business profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) throw new Error('No authenticated user');
    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) throw new Error('Business profile not found');
    const format = profile.invoice_number_format || 'INV-{YYYY}-{MM}-{SEQ}';

    // Fetch the latest invoice for this user
    const { data: lastInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('invoice_number, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (invoiceError) throw invoiceError;

    // Extract last sequence
    let lastSeq = 0;
    if (lastInvoice && lastInvoice.invoice_number) {
      // Try to extract the last sequence from the invoice number
      const match = lastInvoice.invoice_number.match(/(\d{3,})$/);
      if (match) {
        lastSeq = parseInt(match[1], 10);
      }
    }
    const nextSeq = lastSeq + 1;

    // Format the new invoice number
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const seq = String(nextSeq).padStart(4, '0');
    let invoiceNumber = format
      .replace('{YYYY}', year.toString())
      .replace('{MM}', month)
      .replace('{SEQ}', seq);

    // Optionally update the business profile's sequence (if you want to keep it in sync)
    await supabase
      .from('business_profiles')
      .update({ invoice_number_sequence: nextSeq })
      .eq('user_id', user.id);

    return invoiceNumber;
  }
};

export const itemCategoryService = {
  async getItemCategories(): Promise<ItemCategory[]> {
    const { data, error } = await supabase
      .from('item_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching item categories:', error);
      throw error;
    }
    
    return (data as SupabaseItemCategory[]).map(mapSupabaseItemCategoryToItemCategory) || [];
  },

  async createItemCategory(category: Omit<ItemCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ItemCategory> {
    const supabaseCategory = await mapItemCategoryToSupabaseItemCategory(category);
    
    const { data, error } = await supabase
      .from('item_categories')
      .insert([supabaseCategory])
      .select()
      .single();

    if (error) {
      console.error('Error creating item category:', error);
      throw error;
    }
    
    return mapSupabaseItemCategoryToItemCategory(data as SupabaseItemCategory);
  },

  async updateItemCategory(id: string, category: Partial<Omit<ItemCategory, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ItemCategory> {
    const { data: existingData } = await supabase
      .from('item_categories')
      .select()
      .eq('id', id)
      .single();
      
    if (!existingData) {
      throw new Error(`Category with id ${id} not found`);
    }
    
    const { data, error } = await supabase
      .from('item_categories')
      .update({ name: category.name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating item category:', error);
      throw error;
    }
    
    return mapSupabaseItemCategoryToItemCategory(data as SupabaseItemCategory);
  },

  async deleteItemCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('item_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting item category:', error);
      throw error;
    }
  }
};

export const itemService = {
  async getItems(): Promise<Item[]> {
    const { data: itemsData, error: itemsError } = await supabase
      .from('items')
      .select(`*, item_categories(*)`)
      .order('name');

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
      throw itemsError;
    }
    
    return itemsData.map(item => {
      let category = undefined;
      if (item.item_categories) {
        category = mapSupabaseItemCategoryToItemCategory(item.item_categories);
      }
      
      return mapSupabaseItemToItem(item, category);
    }) || [];
  },

  async getItem(id: string): Promise<Item | null> {
    const { data, error } = await supabase
      .from('items')
      .select(`*, item_categories(*)`)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching item:', error);
      throw error;
    }

    let category = undefined;
    if (data.item_categories) {
      category = mapSupabaseItemCategoryToItemCategory(data.item_categories);
    }
    
    return data ? mapSupabaseItemToItem(data, category) : null;
  },

  async createItem(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'category'>): Promise<Item> {
    const supabaseItem = await mapItemToSupabaseItem(item);
    
    const { data, error } = await supabase
      .from('items')
      .insert([supabaseItem])
      .select(`*, item_categories(*)`)
      .single();

    if (error) {
      console.error('Error creating item:', error);
      throw error;
    }

    let category = undefined;
    if (data.item_categories) {
      category = mapSupabaseItemCategoryToItemCategory(data.item_categories);
    }
    
    return mapSupabaseItemToItem(data, category);
  },

  async updateItem(id: string, item: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'category'>>): Promise<Item> {
    const updateData: any = {};
    
    if (item.name !== undefined) updateData.name = item.name;
    if (item.description !== undefined) updateData.description = item.description;
    if (item.type !== undefined) updateData.type = item.type;
    if (item.categoryId !== undefined) updateData.category_id = item.categoryId;
    if (item.salePrice !== undefined) updateData.sale_price = item.salePrice;
    if (item.purchasePrice !== undefined) updateData.purchase_price = item.purchasePrice;
    if (item.taxRate !== undefined) updateData.tax_rate = item.taxRate;
    if (item.enableSaleInfo !== undefined) updateData.enable_sale_info = item.enableSaleInfo;
    if (item.enablePurchaseInfo !== undefined) updateData.enable_purchase_info = item.enablePurchaseInfo;
    if (item.unit !== undefined) updateData.unit = item.unit;
    
    const { data, error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', id)
      .select(`*, item_categories(*)`)
      .single();

    if (error) {
      console.error('Error updating item:', error);
      throw error;
    }

    let category = undefined;
    if (data.item_categories) {
      category = mapSupabaseItemCategoryToItemCategory(data.item_categories);
    }
    
    return mapSupabaseItemToItem(data, category);
  },

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  },
  
  async getItemsByType(type: 'product' | 'service'): Promise<Item[]> {
    const { data, error } = await supabase
      .from('items')
      .select(`*, item_categories(*)`)
      .eq('type', type)
      .order('name');

    if (error) {
      console.error(`Error fetching items by type ${type}:`, error);
      throw error;
    }
    
    return data.map(item => {
      let category = undefined;
      if (item.item_categories) {
        category = mapSupabaseItemCategoryToItemCategory(item.item_categories);
      }
      
      return mapSupabaseItemToItem(item, category);
    }) || [];
  }
};

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
    
    const profileWithUserId = {
      ...profile,
      userId: user.id
    };
    
    const supabaseProfile = await mapBusinessProfileToSupabaseBusinessProfile(profileWithUserId);
    
    const { data: existingProfile } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
    
    let result;
    
    if (existingProfile && existingProfile.length > 0) {
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

export const dashboardService = {
  async getDashboardStats() {
    const user = await supabase.auth.getUser();
    if (!user.data.user?.id) {
      throw new Error('No authenticated user');
    }
    
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.data.user.id);
      
    if (invoicesError) {
      console.error('Error fetching invoices for stats:', invoicesError);
      throw invoicesError;
    }
    
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

export const accountService = {
  async getAccounts(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('name');
    if (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
    return (data as SupabaseAccount[]).map(mapSupabaseAccountToAccount) || [];
  },

  async getAccount(id: string): Promise<Account | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.error('Error fetching account:', error);
      throw error;
    }
    return data ? mapSupabaseAccountToAccount(data as SupabaseAccount) : null;
  },

  async createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    const supabaseAccount = await mapAccountToSupabaseAccount(account);
    const { data, error } = await supabase
      .from('accounts')
      .insert([supabaseAccount])
      .select()
      .single();
    if (error) {
      console.error('Error creating account:', error);
      throw error;
    }
    return mapSupabaseAccountToAccount(data as SupabaseAccount);
  },

  async updateAccount(id: string, account: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Account> {
    const existingAccount = await this.getAccount(id);
    if (!existingAccount) {
      throw new Error(`Account with id ${id} not found`);
    }
    const mergedAccount = {
      ...existingAccount,
      ...account,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };
    const supabaseAccount = await mapAccountToSupabaseAccount(mergedAccount as Omit<Account, 'id' | 'createdAt' | 'updatedAt'>);
    const { data, error } = await supabase
      .from('accounts')
      .update(supabaseAccount)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Error updating account:', error);
      throw error;
    }
    return mapSupabaseAccountToAccount(data as SupabaseAccount);
  },

  async deleteAccount(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },
};
