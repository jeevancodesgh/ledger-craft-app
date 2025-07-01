import { supabase } from './supabase';

export type ConversationRole = 'user' | 'assistant' | 'system';

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: ConversationRole;
  content: string;
  metadata?: any;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  context: any;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface InvoiceCreationContext {
  step: 'customer_search' | 'customer_disambiguation' | 'item_selection' | 'additional_charges' | 'template_selection' | 'invoice_creation';
  customer_search_term?: string;
  customer_candidates?: any[];
  selected_customer?: any;
  selected_items?: any[];
  additional_charges?: any[];
  selected_template?: string;
  invoice_data?: any;
}

class AIConversationService {
  async createConversation(title?: string, context: any = {}): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        title,
        context,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getConversation(id: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async updateConversationContext(id: string, context: any): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ context, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  async addMessage(conversationId: string, role: ConversationRole, content: string, metadata?: any): Promise<ConversationMessage> {
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

    if (error) throw error;
    return data;
  }

  async getConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async searchCustomers(searchTerm: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .limit(10);

    if (error) throw error;
    return data || [];
  }

  async searchItems(searchTerm?: string): Promise<any[]> {
    let query = supabase
      .from('items')
      .select('*')
      .eq('enable_sale_info', true);

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query.limit(20);

    if (error) throw error;
    return data || [];
  }

  async generateInvoiceNumber(): Promise<string> {
    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('invoice_number_format, invoice_number_sequence')
      .single();

    if (profileError) throw profileError;

    const format = profile.invoice_number_format || 'INV-{YYYY}-{SEQ}';
    const sequence = (profile.invoice_number_sequence || 0) + 1;
    const year = new Date().getFullYear();

    const invoiceNumber = format
      .replace('{YYYY}', year.toString())
      .replace('{SEQ}', sequence.toString().padStart(3, '0'));

    await supabase
      .from('business_profiles')
      .update({ invoice_number_sequence: sequence })
      .eq('id', profile.id);

    return invoiceNumber;
  }

  async createInvoice(invoiceData: any): Promise<any> {
    const invoiceNumber = await this.generateInvoiceNumber();
    
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        customer_id: invoiceData.customer_id,
        date: invoiceData.date || new Date().toISOString().split('T')[0],
        due_date: invoiceData.due_date,
        subtotal: invoiceData.subtotal,
        tax_amount: invoiceData.tax_amount || 0,
        discount: invoiceData.discount || 0,
        total: invoiceData.total,
        status: 'draft',
        notes: invoiceData.notes,
        terms: invoiceData.terms,
        additional_charges_list: invoiceData.additional_charges_list,
        additional_charges_total: invoiceData.additional_charges_total || 0,
        template_name: invoiceData.template_name || 'classic'
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    if (invoiceData.line_items && invoiceData.line_items.length > 0) {
      const lineItemsData = invoiceData.line_items.map((item: any) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        tax: item.tax || 0,
        total: item.total,
        unit: item.unit || 'each'
      }));

      const { error: lineItemsError } = await supabase
        .from('line_items')
        .insert(lineItemsData);

      if (lineItemsError) throw lineItemsError;
    }

    return invoice;
  }

  async processInvoiceCreationRequest(userMessage: string, conversationId?: string): Promise<{
    response: string;
    conversationId: string;
    context: InvoiceCreationContext;
    action?: 'search_customers' | 'show_customers' | 'suggest_items' | 'create_invoice';
    data?: any;
  }> {
    let conversation: Conversation;
    
    if (conversationId) {
      conversation = await this.getConversation(conversationId) as Conversation;
    } else {
      conversation = await this.createConversation('Invoice Creation', {
        step: 'customer_search',
        invoice_type: 'create'
      } as InvoiceCreationContext);
    }

    await this.addMessage(conversation.id, 'user', userMessage);

    const context = conversation.context as InvoiceCreationContext;
    
    // Parse user intent and extract customer name
    const customerNameMatch = userMessage.match(/(?:invoice|bill|create).*?for\s+([A-Za-z\s]+)/i);
    const customerName = customerNameMatch ? customerNameMatch[1].trim() : null;

    if (customerName && context.step === 'customer_search') {
      const customers = await this.searchCustomers(customerName);
      
      if (customers.length === 0) {
        const response = `I couldn't find any customers named "${customerName}". Would you like to create a new customer or search for a different name?`;
        await this.addMessage(conversation.id, 'assistant', response);
        return {
          response,
          conversationId: conversation.id,
          context,
          action: 'search_customers'
        };
      } else if (customers.length === 1) {
        const customer = customers[0];
        const newContext: InvoiceCreationContext = {
          ...context,
          step: 'item_selection',
          selected_customer: customer
        };
        
        await this.updateConversationContext(conversation.id, newContext);
        
        const items = await this.searchItems();
        const response = `Great! I found ${customer.name}. Now let's add some items to the invoice. Here are some available items:\n\n${items.slice(0, 5).map((item, index) => `${index + 1}. ${item.name} - $${item.sale_price} (${item.description || 'No description'})`).join('\n')}\n\nYou can select items by number or tell me what items you'd like to add.`;
        
        await this.addMessage(conversation.id, 'assistant', response);
        return {
          response,
          conversationId: conversation.id,
          context: newContext,
          action: 'suggest_items',
          data: { customer, items }
        };
      } else {
        const newContext: InvoiceCreationContext = {
          ...context,
          step: 'customer_disambiguation',
          customer_search_term: customerName,
          customer_candidates: customers
        };
        
        await this.updateConversationContext(conversation.id, newContext);
        
        const response = `I found ${customers.length} customers named "${customerName}". Please choose which one:\n\n${customers.map((customer, index) => `${index + 1}. ${customer.name} - ${customer.email} (${customer.city || 'No city'})`).join('\n')}\n\nPlease tell me the number of the customer you want to create an invoice for.`;
        
        await this.addMessage(conversation.id, 'assistant', response);
        return {
          response,
          conversationId: conversation.id,
          context: newContext,
          action: 'show_customers',
          data: { customers }
        };
      }
    }

    // Handle customer selection from disambiguation
    if (context.step === 'customer_disambiguation') {
      const selectionMatch = userMessage.match(/(\d+)/);
      if (selectionMatch && context.customer_candidates) {
        const selectedIndex = parseInt(selectionMatch[1]) - 1;
        if (selectedIndex >= 0 && selectedIndex < context.customer_candidates.length) {
          const customer = context.customer_candidates[selectedIndex];
          const newContext: InvoiceCreationContext = {
            ...context,
            step: 'item_selection',
            selected_customer: customer,
            customer_candidates: undefined
          };
          
          await this.updateConversationContext(conversation.id, newContext);
          
          const items = await this.searchItems();
          const response = `Perfect! I've selected ${customer.name}. Now let's add items to the invoice. Here are some available items:\n\n${items.slice(0, 5).map((item, index) => `${index + 1}. ${item.name} - $${item.sale_price} (${item.description || 'No description'})`).join('\n')}\n\nYou can select items by number, tell me specific items you want, or say "create invoice" if you're ready to finish.`;
          
          await this.addMessage(conversation.id, 'assistant', response);
          return {
            response,
            conversationId: conversation.id,
            context: newContext,
            action: 'suggest_items',
            data: { customer, items }
          };
        }
      }
    }

    // Handle item selection
    if (context.step === 'item_selection') {
      if (userMessage.toLowerCase().includes('create invoice') || userMessage.toLowerCase().includes('finish')) {
        if (!context.selected_items || context.selected_items.length === 0) {
          const response = "You haven't selected any items yet. Please add some items to the invoice first.";
          await this.addMessage(conversation.id, 'assistant', response);
          return {
            response,
            conversationId: conversation.id,
            context
          };
        }

        // Create the invoice
        const subtotal = context.selected_items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
        const taxAmount = subtotal * 0.1; // Assuming 10% tax
        const total = subtotal + taxAmount;

        const invoiceData = {
          customer_id: context.selected_customer.id,
          subtotal,
          tax_amount: taxAmount,
          total,
          line_items: context.selected_items.map(item => ({
            description: item.name,
            quantity: item.quantity || 1,
            rate: item.rate || item.sale_price,
            total: (item.quantity || 1) * (item.rate || item.sale_price)
          })),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
        };

        const invoice = await this.createInvoice(invoiceData);
        
        const newContext: InvoiceCreationContext = {
          ...context,
          step: 'invoice_creation',
          invoice_data: invoice
        };
        
        await this.updateConversationContext(conversation.id, newContext);
        
        const response = `🎉 Invoice created successfully!\n\n**Invoice #${invoice.invoice_number}**\nCustomer: ${context.selected_customer.name}\nTotal: $${total.toFixed(2)}\n\n[Click here to view/edit the invoice](/invoices/${invoice.id}/edit)`;
        
        await this.addMessage(conversation.id, 'assistant', response);
        return {
          response,
          conversationId: conversation.id,
          context: newContext,
          action: 'create_invoice',
          data: { invoice, editUrl: `/invoices/${invoice.id}/edit` }
        };
      }

      // Handle item selection by number or name
      const items = await this.searchItems();
      const numberMatch = userMessage.match(/(\d+)/g);
      let selectedItems = context.selected_items || [];

      if (numberMatch) {
        numberMatch.forEach(num => {
          const index = parseInt(num) - 1;
          if (index >= 0 && index < items.length) {
            const item = items[index];
            const existingItem = selectedItems.find(si => si.id === item.id);
            if (!existingItem) {
              selectedItems.push({
                ...item,
                quantity: 1,
                rate: item.sale_price
              });
            }
          }
        });
      }

      const newContext: InvoiceCreationContext = {
        ...context,
        selected_items: selectedItems
      };
      
      await this.updateConversationContext(conversation.id, newContext);
      
      const response = selectedItems.length > 0 
        ? `Added items to invoice:\n\n${selectedItems.map((item, index) => `${index + 1}. ${item.name} - Qty: ${item.quantity} x $${item.rate} = $${(item.quantity * item.rate).toFixed(2)}`).join('\n')}\n\nSubtotal: $${selectedItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0).toFixed(2)}\n\nYou can add more items by number, or say "create invoice" when ready.`
        : "Please select items by their numbers (e.g., '1, 3, 5') or tell me which items you'd like to add.";
      
      await this.addMessage(conversation.id, 'assistant', response);
      return {
        response,
        conversationId: conversation.id,
        context: newContext,
        data: { selectedItems }
      };
    }

    // Default response
    const response = "I can help you create an invoice! Please tell me which customer you'd like to create an invoice for. For example: 'Create an invoice for John Smith' or 'I need to bill Sarah Johnson'.";
    await this.addMessage(conversation.id, 'assistant', response);
    
    return {
      response,
      conversationId: conversation.id,
      context
    };
  }
}

export const aiConversationService = new AIConversationService();