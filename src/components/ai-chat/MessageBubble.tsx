import React from 'react';
import { Bot, User, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ConversationMessage } from '../../types';
import { cn } from '../../lib/utils';

interface MessageBubbleProps {
  message: ConversationMessage;
  onRetry?: (messageId: string) => void;
}

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  
  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getIntentBadge = () => {
    if (!message.metadata?.intent || message.metadata.intent === 'unknown') return null;
    
    const intent = message.metadata.intent;
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      create_invoice: 'default',
      edit_invoice: 'secondary',
      find_customer: 'outline',
      generate_report: 'secondary',
      help: 'outline'
    };

    return (
      <Badge variant={variants[intent] || 'outline'} className="text-xs">
        {intent.replace('_', ' ').toLowerCase()}
      </Badge>
    );
  };

  const getActionStatus = () => {
    const actions = message.metadata?.actions || [];
    if (!actions.length) return null;

    const hasCompleted = actions.some(a => a.status === 'completed');
    const hasFailed = actions.some(a => a.status === 'failed');
    const hasInProgress = actions.some(a => a.status === 'in_progress');

    if (hasFailed) {
      return (
        <div className="flex items-center gap-1 text-destructive">
          <XCircle className="h-3 w-3" />
          <span className="text-xs">Action failed</span>
        </div>
      );
    }

    if (hasCompleted) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="h-3 w-3" />
          <span className="text-xs">Completed</span>
        </div>
      );
    }

    if (hasInProgress) {
      return (
        <div className="flex items-center gap-1 text-blue-600">
          <AlertCircle className="h-3 w-3" />
          <span className="text-xs">Processing...</span>
        </div>
      );
    }

    return null;
  };

  const renderMessageContent = () => {
    // Handle structured data in messages
    if (message.metadata?.data) {
      const data = message.metadata.data;
      
      // Render invoice data
      if (data.type === 'invoice') {
        return (
          <div className="space-y-2">
            <p>{message.content}</p>
            <Card className="p-3 bg-muted/50">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">Invoice #{data.invoiceNumber}</span>
                  <Badge variant="outline">{data.status}</Badge>
                </div>
                <div>Customer: {data.customerName}</div>
                <div>Amount: {data.currency} {data.total}</div>
                <div>Due: {new Date(data.dueDate).toLocaleDateString()}</div>
              </div>
            </Card>
          </div>
        );
      }
      
      // Render customer data
      if (data.type === 'customer') {
        return (
          <div className="space-y-2">
            <p>{message.content}</p>
            <Card className="p-3 bg-muted/50">
              <div className="text-sm space-y-1">
                <div className="font-medium">{data.name}</div>
                <div>{data.email}</div>
                {data.phone && <div>{data.phone}</div>}
                {data.isVip && <Badge variant="secondary" className="text-xs">VIP</Badge>}
              </div>
            </Card>
          </div>
        );
      }
    }

    return <p className="whitespace-pre-wrap">{message.content}</p>;
  };

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <Badge variant="outline" className="text-xs">
          {message.content}
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex gap-3 max-w-[85%]",
      isUser ? "ml-auto flex-row-reverse" : "mr-auto"
    )}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted text-muted-foreground"
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message */}
      <div className="flex-1 space-y-1">
        <div className={cn(
          "rounded-lg p-3 text-sm",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-foreground"
        )}>
          {renderMessageContent()}
        </div>
        
        {/* Metadata */}
        <div className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground",
          isUser && "justify-end"
        )}>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatTime(message.timestamp)}</span>
          </div>
          
          {getIntentBadge()}
          {getActionStatus()}
          
          {message.metadata?.confidence && (
            <Badge variant="outline" className="text-xs">
              {Math.round(message.metadata.confidence * 100)}% confident
            </Badge>
          )}
        </div>

        {/* Retry button for failed messages */}
        {message.metadata?.actions?.some(a => a.status === 'failed') && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRetry(message.id)}
            className="text-xs h-7"
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}