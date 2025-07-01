import React from 'react';
import { Bot } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn("flex gap-3 max-w-[85%] mr-auto", className)}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
        <Bot className="h-4 w-4" />
      </div>

      {/* Typing animation */}
      <div className="bg-muted rounded-lg p-3 flex items-center space-x-1">
        <div className="flex space-x-1">
          <div 
            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" 
            style={{ animationDelay: '0ms' }}
          />
          <div 
            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" 
            style={{ animationDelay: '150ms' }}
          />
          <div 
            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" 
            style={{ animationDelay: '300ms' }}
          />
        </div>
        <span className="text-xs text-muted-foreground ml-2">AI is thinking...</span>
      </div>
    </div>
  );
}