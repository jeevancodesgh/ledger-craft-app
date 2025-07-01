import React, { useState, useRef, useEffect } from 'react';
import { aiConversationService, ConversationMessage, InvoiceCreationContext } from '../services/aiConversationService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AIConversationProps {
  onClose?: () => void;
}

export const AIConversation: React.FC<AIConversationProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [context, setContext] = useState<InvoiceCreationContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    const welcomeMessage: ConversationMessage = {
      id: 'welcome',
      conversation_id: 'temp',
      role: 'assistant',
      content: "Hi! I'm here to help you create invoices quickly. Just tell me something like 'Create an invoice for John Smith' and I'll guide you through the process!",
      created_at: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      conversation_id: conversationId || 'temp',
      role: 'user',
      content: inputText,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await aiConversationService.processInvoiceCreationRequest(
        inputText,
        conversationId || undefined
      );

      setConversationId(response.conversationId);
      setContext(response.context);

      const assistantMessage: ConversationMessage = {
        id: `assistant-${Date.now()}`,
        conversation_id: response.conversationId,
        role: 'assistant',
        content: response.response,
        metadata: { action: response.action, data: response.data },
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle special actions
      if (response.action === 'create_invoice' && response.data?.editUrl) {
        // Show a clickable link to edit the invoice
        setTimeout(() => {
          const confirmNavigate = window.confirm('Would you like to open the invoice editor now?');
          if (confirmNavigate) {
            navigate(response.data.editUrl);
            onClose?.();
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: ConversationMessage = {
        id: `error-${Date.now()}`,
        conversation_id: conversationId || 'temp',
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content: string) => {
    // Convert markdown-style formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[Click here to view\/edit the invoice\]\((.*?)\)/g, 
        '<button onclick="window.parent.postMessage({type: \'navigate\', url: \'$1\'}, \'*\')" class="text-blue-600 hover:text-blue-800 underline cursor-pointer">Click here to view/edit the invoice</button>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">AI Invoice Assistant</h3>
            <p className="text-sm text-gray-500">Create invoices with natural language</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div
                dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                className="text-sm whitespace-pre-wrap"
              />
              {message.role === 'assistant' && message.metadata?.data?.editUrl && (
                <button
                  onClick={() => {
                    navigate(message.metadata.data.editUrl);
                    onClose?.();
                  }}
                  className="mt-2 w-full px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                >
                  Open Invoice Editor
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (e.g., 'Create an invoice for John Smith')"
            className="flex-1 min-h-[40px] max-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isLoading}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        {/* Context indicator */}
        {context && (
          <div className="mt-2 text-xs text-gray-500">
            {context.step === 'customer_search' && 'Searching for customer...'}
            {context.step === 'customer_disambiguation' && 'Please select a customer'}
            {context.step === 'item_selection' && `Customer: ${context.selected_customer?.name} • Adding items...`}
            {context.step === 'invoice_creation' && 'Invoice created successfully!'}
          </div>
        )}
      </div>
    </div>
  );
};