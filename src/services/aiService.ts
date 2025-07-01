import { 
  ConversationMessage, 
  ConversationIntent, 
  ConversationEntity, 
  ConversationAction, 
  ConversationContext, 
  AIResponse, 
  ActionResult 
} from '../types';
import { supabase } from '@/integrations/supabase/client';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class AIConversationService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. AI conversation features will be disabled.');
    }
  }

  async processMessage(
    message: string, 
    context: ConversationContext,
    conversationHistory: ConversationMessage[] = []
  ): Promise<AIResponse> {
    try {
      // 1. Intent classification and entity extraction
      const analysis = await this.analyzeMessage(message, context, conversationHistory);
      
      // 2. Generate appropriate response
      const response = await this.generateResponse(analysis, context);
      
      return response;
    } catch (error) {
      console.error('Error processing AI message:', error);
      return {
        message: "I'm sorry, I'm having trouble understanding your request right now. Could you please try again?",
        intent: 'unknown',
        entities: [],
        actions: [],
        needsConfirmation: false,
        suggestedActions: ['Try rephrasing your request', 'Ask for help with a specific task']
      };
    }
  }

  private async analyzeMessage(
    message: string,
    context: ConversationContext,
    history: ConversationMessage[]
  ): Promise<{
    intent: ConversationIntent;
    entities: ConversationEntity[];
    confidence: number;
  }> {
    const systemPrompt = this.buildAnalysisPrompt(context);
    const conversationMessages = this.buildConversationHistory(history, message);

    const response = await this.callOpenAI([
      { role: 'system', content: systemPrompt },
      ...conversationMessages
    ]);

    try {
      const analysis = JSON.parse(response);
      return {
        intent: analysis.intent || 'unknown',
        entities: analysis.entities || [],
        confidence: analysis.confidence || 0.5
      };
    } catch (error) {
      console.error('Error parsing AI analysis:', error);
      return {
        intent: 'unknown',
        entities: [],
        confidence: 0.1
      };
    }
  }

  private async generateResponse(
    analysis: { intent: ConversationIntent; entities: ConversationEntity[]; confidence: number },
    context: ConversationContext
  ): Promise<AIResponse> {
    const { intent, entities, confidence } = analysis;

    // Determine if we need more information
    const missingInfo = this.identifyMissingInformation(intent, entities, context);
    
    if (missingInfo.length > 0) {
      return {
        message: this.generateInfoRequestMessage(intent, missingInfo),
        intent,
        entities,
        actions: [],
        needsConfirmation: false,
        suggestedActions: this.getSuggestedActions(intent, entities)
      };
    }

    // Plan actions
    const actions = this.planActions(intent, entities, context);
    
    // Generate confirmation message if needed
    const needsConfirmation = this.shouldConfirmAction(intent, actions);
    const message = needsConfirmation 
      ? this.generateConfirmationMessage(intent, entities, actions)
      : this.generateExecutionMessage(intent, entities, actions);

    return {
      message,
      intent,
      entities,
      actions,
      needsConfirmation,
      suggestedActions: this.getSuggestedActions(intent, entities)
    };
  }

  private buildAnalysisPrompt(context: ConversationContext): string {
    return `You are a business assistant AI for Ledger Craft, an expense tracking and invoice management application.

Your job is to analyze user messages and extract:
1. Intent - what the user wants to do
2. Entities - specific business data mentioned (customers, amounts, dates, etc.)
3. Confidence - how confident you are in your analysis (0-1)

Available intents:
- create_invoice: User wants to create a new invoice
- edit_invoice: User wants to modify an existing invoice
- send_invoice: User wants to send an invoice to a customer
- track_payment: User wants to check payment status
- create_customer: User wants to add a new customer
- find_customer: User wants to search for a customer
- update_customer: User wants to modify customer information
- add_expense: User wants to record an expense
- categorize_expense: User wants to categorize expenses
- scan_receipt: User wants to scan a receipt
- generate_report: User wants to create a report
- show_analytics: User wants to see analytics/charts
- financial_summary: User wants a financial overview
- help: User needs assistance
- clarification: User is asking for clarification
- greeting: User is greeting or starting conversation
- unknown: Intent is unclear

Entity types to extract:
- customer: Customer names or identifiers
- amount: Monetary values
- date: Dates or time periods
- product: Products or services
- service: Services offered
- invoice: Invoice numbers or references
- expense: Expense descriptions
- category: Category names

Current business context:
${context.businessContext ? `Business: ${context.businessContext.businessProfile?.name}` : ''}
Recent customers: ${context.recentEntities.customers.map(c => c.name).join(', ') || 'None'}
Recent invoices: ${context.recentEntities.invoices.length} invoices
Currency: ${context.userPreferences.currency}

Return your analysis as JSON:
{
  "intent": "intent_name",
  "entities": [
    {
      "type": "entity_type",
      "value": "extracted_value",
      "confidence": 0.9
    }
  ],
  "confidence": 0.8
}`;
  }

  private buildConversationHistory(history: ConversationMessage[], currentMessage: string): OpenAIMessage[] {
    const messages: OpenAIMessage[] = [];
    
    // Include last 5 messages for context
    const recentHistory = history.slice(-5);
    
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    // Add current message
    messages.push({
      role: 'user',
      content: currentMessage
    });

    return messages;
  }

  private async callOpenAI(messages: OpenAIMessage[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private identifyMissingInformation(
    intent: ConversationIntent,
    entities: ConversationEntity[],
    context: ConversationContext
  ): string[] {
    const missing: string[] = [];

    switch (intent) {
      case 'create_invoice':
        if (!entities.find(e => e.type === 'customer')) {
          missing.push('customer');
        }
        if (!entities.find(e => e.type === 'product' || e.type === 'service')) {
          missing.push('items');
        }
        break;
      
      case 'find_customer':
        if (!entities.find(e => e.type === 'customer')) {
          missing.push('customer_name');
        }
        break;
      
      case 'add_expense':
        if (!entities.find(e => e.type === 'amount')) {
          missing.push('amount');
        }
        break;
      
      case 'generate_report':
        if (!entities.find(e => e.type === 'date')) {
          missing.push('time_period');
        }
        break;
    }

    return missing;
  }

  private generateInfoRequestMessage(intent: ConversationIntent, missingInfo: string[]): string {
    const requests = missingInfo.map(info => {
      switch (info) {
        case 'customer':
          return 'Which customer is this for?';
        case 'items':
          return 'What products or services should I include?';
        case 'amount':
          return 'What is the amount?';
        case 'customer_name':
          return 'What is the customer\'s name?';
        case 'time_period':
          return 'What time period should I include in the report?';
        default:
          return `What is the ${info}?`;
      }
    });

    return `I'd be happy to help you with that! I need a bit more information: ${requests.join(' ')}`;
  }

  private planActions(
    intent: ConversationIntent,
    entities: ConversationEntity[],
    context: ConversationContext
  ): ConversationAction[] {
    const actions: ConversationAction[] = [];

    switch (intent) {
      case 'create_invoice':
        actions.push({
          type: 'create_invoice',
          parameters: {
            customer: entities.find(e => e.type === 'customer')?.value,
            items: entities.filter(e => e.type === 'product' || e.type === 'service'),
            amount: entities.find(e => e.type === 'amount')?.value
          },
          status: 'pending'
        });
        break;
      
      case 'find_customer':
        actions.push({
          type: 'search_customers',
          parameters: {
            query: entities.find(e => e.type === 'customer')?.value
          },
          status: 'pending'
        });
        break;
      
      case 'add_expense':
        actions.push({
          type: 'create_expense',
          parameters: {
            amount: entities.find(e => e.type === 'amount')?.value,
            description: entities.find(e => e.type === 'expense')?.value,
            category: entities.find(e => e.type === 'category')?.value
          },
          status: 'pending'
        });
        break;
      
      case 'generate_report':
        actions.push({
          type: 'generate_financial_report',
          parameters: {
            period: entities.find(e => e.type === 'date')?.value,
            type: 'summary'
          },
          status: 'pending'
        });
        break;
    }

    return actions;
  }

  private shouldConfirmAction(intent: ConversationIntent, actions: ConversationAction[]): boolean {
    const sensitiveIntents = ['create_invoice', 'send_invoice', 'add_expense'];
    return sensitiveIntents.includes(intent) || actions.some(a => a.type.includes('create'));
  }

  private generateConfirmationMessage(
    intent: ConversationIntent,
    entities: ConversationEntity[],
    actions: ConversationAction[]
  ): string {
    switch (intent) {
      case 'create_invoice':
        const customer = entities.find(e => e.type === 'customer')?.value;
        const items = entities.filter(e => e.type === 'product' || e.type === 'service');
        return `I'll create an invoice for ${customer} with ${items.length > 0 ? items.map(i => i.value).join(', ') : 'the specified items'}. Should I proceed?`;
      
      case 'add_expense':
        const amount = entities.find(e => e.type === 'amount')?.value;
        const description = entities.find(e => e.type === 'expense')?.value;
        return `I'll record an expense of ${amount} for "${description}". Is this correct?`;
      
      default:
        return 'Should I proceed with this action?';
    }
  }

  private generateExecutionMessage(
    intent: ConversationIntent,
    entities: ConversationEntity[],
    actions: ConversationAction[]
  ): string {
    switch (intent) {
      case 'find_customer':
        return 'Let me search for that customer...';
      case 'generate_report':
        return 'Generating your financial report...';
      case 'show_analytics':
        return 'Here are your latest analytics...';
      default:
        return 'Processing your request...';
    }
  }

  private getSuggestedActions(intent: ConversationIntent, entities: ConversationEntity[]): string[] {
    switch (intent) {
      case 'create_invoice':
        return ['Send invoice via email', 'Preview invoice', 'Save as draft'];
      case 'find_customer':
        return ['Create new invoice', 'View customer details', 'Edit customer'];
      case 'generate_report':
        return ['Export to PDF', 'View detailed breakdown', 'Compare with previous period'];
      default:
        return ['Ask for help', 'Try a different request'];
    }
  }

  // Utility method to check if API is configured
  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }
}

export const aiService = new AIConversationService();