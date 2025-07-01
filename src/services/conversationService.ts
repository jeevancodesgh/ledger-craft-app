import { 
  ConversationSession, 
  ConversationMessage, 
  ConversationContext, 
  ConversationRole,
  SupabaseConversation,
  SupabaseConversationMessage,
  Customer,
  Invoice,
  Expense,
  Item,
  BusinessProfile
} from '../types';
import { supabase } from '@/integrations/supabase/client';

export class ConversationService {
  
  async createConversation(
    userId: string, 
    initialContext?: Partial<ConversationContext>
  ): Promise<ConversationSession> {
    const defaultContext: ConversationContext = {
      recentEntities: {
        customers: [],
        invoices: [],
        expenses: [],
        items: []
      },
      userPreferences: {
        defaultTemplate: 'modern',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        language: 'en'
      },
      ...initialContext
    };

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        context: defaultContext,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    return this.mapSupabaseToConversation(data, []);
  }

  async getConversation(conversationId: string): Promise<ConversationSession | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        conversation_messages (
          id,
          role,
          content,
          metadata,
          created_at
        )
      `)
      .eq('id', conversationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get conversation: ${error.message}`);
    }

    return this.mapSupabaseToConversation(data, data.conversation_messages || []);
  }

  async getUserConversations(userId: string, limit = 20): Promise<ConversationSession[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        conversation_messages!inner (
          id,
          role,
          content,
          metadata,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get user conversations: ${error.message}`);
    }

    return data.map(conv => this.mapSupabaseToConversation(conv, conv.conversation_messages));
  }

  async addMessage(
    conversationId: string,
    role: ConversationRole,
    content: string,
    metadata?: any
  ): Promise<ConversationMessage> {
    const { data, error } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        metadata
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add message: ${error.message}`);
    }

    return this.mapSupabaseToMessage(data);
  }

  async updateConversationContext(
    conversationId: string,
    context: Partial<ConversationContext>
  ): Promise<void> {
    // First get current context
    const { data: current, error: fetchError } = await supabase
      .from('conversations')
      .select('context')
      .eq('id', conversationId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch current context: ${fetchError.message}`);
    }

    // Merge contexts
    const mergedContext = {
      ...current.context,
      ...context,
      recentEntities: {
        ...current.context.recentEntities,
        ...context.recentEntities
      },
      userPreferences: {
        ...current.context.userPreferences,
        ...context.userPreferences
      }
    };

    const { error } = await supabase
      .from('conversations')
      .update({ 
        context: mergedContext,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) {
      throw new Error(`Failed to update conversation context: ${error.message}`);
    }
  }

  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ 
        title,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) {
      throw new Error(`Failed to update conversation title: ${error.message}`);
    }
  }

  async updateConversationStatus(
    conversationId: string, 
    status: 'active' | 'completed' | 'paused'
  ): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) {
      throw new Error(`Failed to update conversation status: ${error.message}`);
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }
  }

  async buildContextFromCurrentData(userId: string): Promise<ConversationContext> {
    try {
      // Fetch recent business data in parallel
      const [customersResult, invoicesResult, expensesResult, itemsResult, profileResult] = 
        await Promise.allSettled([
          supabase.from('customers').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(10),
          supabase.from('invoices').select('*, customers(name, email)').eq('user_id', userId).order('updated_at', { ascending: false }).limit(10),
          supabase.from('expenses').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(10),
          supabase.from('items').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(20),
          supabase.from('business_profiles').select('*').eq('user_id', userId).single()
        ]);

      const customers: Customer[] = customersResult.status === 'fulfilled' ? 
        (customersResult.value.data || []).map(this.mapSupabaseCustomer) : [];

      const invoices: Invoice[] = invoicesResult.status === 'fulfilled' ? 
        (invoicesResult.value.data || []).map(this.mapSupabaseInvoice) : [];

      const expenses: Expense[] = expensesResult.status === 'fulfilled' ? 
        (expensesResult.value.data || []).map(this.mapSupabaseExpense) : [];

      const items: Item[] = itemsResult.status === 'fulfilled' ? 
        (itemsResult.value.data || []).map(this.mapSupabaseItem) : [];

      const businessProfile: BusinessProfile | undefined = profileResult.status === 'fulfilled' && profileResult.value.data ? 
        this.mapSupabaseBusinessProfile(profileResult.value.data) : undefined;

      // Build recent activity summary
      const recentActivity: string[] = [];
      
      if (invoices.length > 0) {
        const recentInvoice = invoices[0];
        recentActivity.push(`Recent invoice: ${recentInvoice.invoiceNumber} for ${recentInvoice.customer?.name || 'customer'}`);
      }
      
      if (expenses.length > 0) {
        const recentExpense = expenses[0];
        recentActivity.push(`Recent expense: $${recentExpense.amount} for ${recentExpense.description}`);
      }

      return {
        recentEntities: {
          customers: customers.slice(0, 5),
          invoices: invoices.slice(0, 5),
          expenses: expenses.slice(0, 5),
          items: items.slice(0, 10)
        },
        userPreferences: {
          defaultTemplate: businessProfile?.invoiceNumberFormat || 'modern',
          currency: invoices[0]?.currency || expenses[0]?.currency || 'USD',
          dateFormat: 'MM/DD/YYYY',
          language: 'en'
        },
        businessContext: {
          businessProfile,
          recentActivity
        }
      };
    } catch (error) {
      console.error('Error building context from current data:', error);
      
      // Return minimal context on error
      return {
        recentEntities: {
          customers: [],
          invoices: [],
          expenses: [],
          items: []
        },
        userPreferences: {
          defaultTemplate: 'modern',
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
          language: 'en'
        }
      };
    }
  }

  async addEntityToContext(
    conversationId: string,
    entityType: 'customers' | 'invoices' | 'expenses' | 'items',
    entity: Customer | Invoice | Expense | Item
  ): Promise<void> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) return;

    const currentEntities = conversation.context.recentEntities[entityType];
    const updatedEntities = [entity, ...currentEntities.filter((e: any) => e.id !== entity.id)].slice(0, 10);

    await this.updateConversationContext(conversationId, {
      recentEntities: {
        ...conversation.context.recentEntities,
        [entityType]: updatedEntities
      }
    });
  }

  private mapSupabaseToConversation(
    data: SupabaseConversation & { conversation_messages?: SupabaseConversationMessage[] },
    messages: SupabaseConversationMessage[]
  ): ConversationSession {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title || undefined,
      messages: messages.map(this.mapSupabaseToMessage),
      context: data.context || {
        recentEntities: { customers: [], invoices: [], expenses: [], items: [] },
        userPreferences: { defaultTemplate: 'modern', currency: 'USD', dateFormat: 'MM/DD/YYYY', language: 'en' }
      },
      status: data.status as 'active' | 'completed' | 'paused',
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapSupabaseToMessage(data: SupabaseConversationMessage): ConversationMessage {
    return {
      id: data.id,
      conversationId: data.conversation_id,
      role: data.role as ConversationRole,
      content: data.content,
      timestamp: new Date(data.created_at),
      metadata: data.metadata
    };
  }

  // Helper methods for mapping Supabase data to frontend types
  private mapSupabaseCustomer(data: any): Customer {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      country: data.country,
      phone: data.phone,
      isVip: data.is_vip,
      tags: data.tags,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapSupabaseInvoice(data: any): Invoice {
    return {
      id: data.id,
      invoiceNumber: data.invoice_number,
      customerId: data.customer_id,
      customer: data.customers ? {
        id: data.customer_id,
        name: data.customers.name,
        email: data.customers.email,
        country: '',
        address: null,
        city: null,
        state: null,
        zip: null
      } : undefined,
      date: data.date,
      dueDate: data.due_date,
      items: [],
      subtotal: data.subtotal,
      taxAmount: data.tax_amount,
      discount: data.discount,
      total: data.total,
      status: data.status,
      notes: data.notes,
      terms: data.terms,
      currency: data.currency,
      templateName: data.template_name,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapSupabaseExpense(data: any): Expense {
    return {
      id: data.id,
      description: data.description,
      amount: data.amount,
      categoryId: data.category_id,
      accountId: data.account_id,
      vendorName: data.vendor_name,
      receiptUrl: data.receipt_url,
      expenseDate: data.expense_date,
      status: data.status,
      isBillable: data.is_billable,
      customerId: data.customer_id,
      taxAmount: data.tax_amount,
      currency: data.currency,
      paymentMethod: data.payment_method,
      notes: data.notes,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapSupabaseItem(data: any): Item {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      categoryId: data.category_id,
      salePrice: data.sale_price,
      purchasePrice: data.purchase_price,
      taxRate: data.tax_rate,
      enableSaleInfo: data.enable_sale_info,
      enablePurchaseInfo: data.enable_purchase_info,
      unit: data.unit,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapSupabaseBusinessProfile(data: any): BusinessProfile {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      country: data.country,
      taxId: data.tax_id,
      logoUrl: data.logo_url,
      website: data.website,
      defaultTaxRate: data.default_tax_rate,
      defaultTerms: data.default_terms,
      defaultNotes: data.default_notes,
      bankInfo: data.bank_info,
      theme: data.theme,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      invoiceNumberFormat: data.invoice_number_format,
      invoiceNumberSequence: data.invoice_number_sequence
    };
  }
}

export const conversationService = new ConversationService();