import * as React from 'react';
import { DrawerHeader, DrawerTitle, DrawerDescription } from './drawer';
import { DrawerFooterSticky } from './DrawerFooterSticky';

interface DrawerFormLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  className?: string;
}

export const DrawerFormLayout: React.FC<DrawerFormLayoutProps> = ({
  title,
  description,
  children,
  footer,
  className = '',
}) => {
  return (
    <div className={`flex flex-col h-full max-h-[92vh] sm:max-h-[85vh] ${className}`}>
      <DrawerHeader className="shrink-0 sticky top-0 bg-background z-10">
        <DrawerTitle>{title}</DrawerTitle>
        {description && <DrawerDescription>{description}</DrawerDescription>}
      </DrawerHeader>
      <div className="flex-1 overflow-y-auto px-4 pt-8 pb-28">{/* Main content area with top padding */}
        {children}
      </div>
      <DrawerFooterSticky>
        {footer}
      </DrawerFooterSticky>
    </div>
  );
}; 