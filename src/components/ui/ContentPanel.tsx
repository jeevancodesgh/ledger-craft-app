import React from 'react';
import { cn } from '@/lib/utils';

interface ContentPanelProps {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}

export function ContentPanel({ children, className, padded = true }: ContentPanelProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-border bg-card',
        padded && 'p-6 sm:p-8',
        className
      )}
    >
      {children}
    </div>
  );
}
