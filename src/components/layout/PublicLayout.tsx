import React from 'react';
import { Card } from '@/components/ui/card';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Viewer</h1>
          <p className="text-gray-600">View your invoice securely</p>
        </div>
        {children}
      </div>
    </div>
  );
}; 