import * as React from 'react';
import { cn } from '@/lib/utils';

interface DrawerFooterStickyProps {
  className?: string;
  children: React.ReactNode;
}

export const DrawerFooterSticky: React.FC<DrawerFooterStickyProps> = ({ className, children }) => {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 flex flex-row gap-2 border-t bg-background p-4",
        className
      )}
      style={{
        paddingBottom: `calc(1rem + env(safe-area-inset-bottom))`,
      }}
    >
      {children}
    </div>
  );
}; 