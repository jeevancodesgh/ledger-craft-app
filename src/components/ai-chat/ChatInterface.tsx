import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, X, MessageCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { ConversationMessage, ConversationSession } from '../../types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ActionConfirmation } from './ActionConfirmation';
import { cn } from '../../lib/utils';

interface ChatInterfaceProps {
  conversation: ConversationSession | null;
  onSendMessage: (message: string) => Promise<void>;
  onConfirmAction: (actionId: string) => Promise<void>;
  onRejectAction: (actionId: string) => Promise<void>;
  isProcessing: boolean;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function ChatInterface({
  conversation,
  onSendMessage,
  onConfirmAction,
  onRejectAction,
  isProcessing,
  isOpen,
  onToggle,
  className
}: ChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!message.trim() || isProcessing) return;
    
    const messageToSend = message.trim();
    setMessage('');
    
    try {
      await onSendMessage(messageToSend);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsListening(!isListening);
      // Voice input implementation would go here
    } else {
      console.warn('Speech recognition not supported');
    }
  };

  const getQuickActions = () => {
    if (!conversation?.messages.length) {
      return [
        'Create an invoice',
        'Find a customer',
        'Add an expense',
        'Show me analytics',
        'Help me get started'
      ];
    }
    
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return lastMessage.metadata?.suggestedActions || [];
  };

  const quickActions = getQuickActions();

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className={cn(
          "fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          className
        )}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-4 right-4 w-96 h-[600px] shadow-xl z-50",
      "flex flex-col bg-background border",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Assistant</h3>
          {conversation?.status === 'active' && (
            <Badge variant="secondary" className="text-xs">Active</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {!conversation?.messages.length ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                Hi! I'm your AI assistant. I can help you create invoices, 
                manage customers, track expenses, and generate reports.
              </p>
              <p className="text-xs mt-2">
                Try asking me something like "Create an invoice for John"
              </p>
            </div>
          ) : (
            conversation.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
          
          {isProcessing && <TypingIndicator />}
          
          {/* Action confirmations */}
          {conversation?.messages
            .filter(msg => msg.metadata?.actions?.some(action => action.status === 'pending'))
            .map(msg => (
              <ActionConfirmation
                key={`actions-${msg.id}`}
                message={msg}
                onConfirm={onConfirmAction}
                onReject={onRejectAction}
              />
            ))}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="px-4 py-2 border-t border-b bg-muted/50">
          <div className="flex flex-wrap gap-1">
            {quickActions.slice(0, 3).map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => setMessage(action)}
                disabled={isProcessing}
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your business..."
              className="min-h-[40px] max-h-24 resize-none pr-12"
              disabled={isProcessing}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={toggleVoiceInput}
              disabled={isProcessing}
            >
              {isListening ? (
                <MicOff className="h-4 w-4 text-red-500" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isProcessing}
            size="sm"
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}