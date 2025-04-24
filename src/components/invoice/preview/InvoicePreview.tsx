
import React from 'react';
import { Invoice } from '@/types';
import { InvoiceTemplateId } from '../templates/InvoiceTemplates';
import ClassicTemplate from './templates/ClassicTemplate';
import ModernTemplate from './templates/ModernTemplate';
import MinimalTemplate from './templates/MinimalTemplate';

interface InvoicePreviewProps {
  invoice: Invoice;
  selectedTemplate: InvoiceTemplateId;
}

const InvoicePreview = ({ invoice, selectedTemplate }: InvoicePreviewProps) => {
  const renderTemplate = () => {
    switch (selectedTemplate) {
      case 'classic':
        return <ClassicTemplate invoice={invoice} />;
      case 'modern':
        return <ModernTemplate invoice={invoice} />;
      case 'minimal':
        return <MinimalTemplate invoice={invoice} />;
      default:
        return <ClassicTemplate invoice={invoice} />;
    }
  };

  return (
    <div className="w-full bg-white shadow-sm rounded-lg">
      {renderTemplate()}
    </div>
  );
};

export default InvoicePreview;
