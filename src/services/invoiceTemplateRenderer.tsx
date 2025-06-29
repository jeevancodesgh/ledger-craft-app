import React from 'react';
import { createRoot } from 'react-dom/client';
import { Invoice, BusinessProfile, DEFAULT_BUSINESS_THEME } from '@/types';
import { InvoiceTemplateId } from '../components/invoice/templates/InvoiceTemplates';
import ClassicTemplate from '../components/invoice/preview/templates/ClassicTemplate';
import ModernTemplate from '../components/invoice/preview/templates/ModernTemplate';
import MinimalTemplate from '../components/invoice/preview/templates/MinimalTemplate';
import ExecutiveTemplate from '../components/invoice/preview/templates/ExecutiveTemplate';
import CorporateTemplate from '../components/invoice/preview/templates/CorporateTemplate';
import ModernInvoiceTemplate from '../components/invoice/preview/templates/ModernInvoiceTemplate';

interface TemplateData {
  invoice: Invoice;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  clientName: string;
  clientAddress: string;
  taxRate: string;
  tax: number;
  businessLogo?: string;
  theme?: any;
}

export const createTemplateData = (invoice: Invoice, businessProfile?: BusinessProfile | null): TemplateData => {
  return {
    invoice,
    companyName: businessProfile?.name || 'Business Name',
    companyAddress: [
      businessProfile?.address,
      businessProfile?.city,
      businessProfile?.state,
      businessProfile?.zip,
      businessProfile?.country
    ].filter(Boolean).join(', ') || '',
    companyPhone: businessProfile?.phone || '',
    clientName: invoice.customer?.name || 'Client Name',
    clientAddress: [
      invoice.customer?.address,
      invoice.customer?.city,
      invoice.customer?.state,
      invoice.customer?.zip,
      invoice.customer?.country
    ].filter(Boolean).join(', ') || '',
    taxRate: invoice.subtotal > 0 ? ((invoice.taxAmount / invoice.subtotal) * 100).toFixed(2) : '0',
    tax: invoice.taxAmount,
    businessLogo: businessProfile?.logoUrl || '',
    theme: businessProfile?.theme || DEFAULT_BUSINESS_THEME,
  };
};

export const renderTemplateComponent = (selectedTemplate: InvoiceTemplateId, templateData: TemplateData): React.ReactElement => {
  switch (selectedTemplate) {
    case 'classic':
      return <ClassicTemplate {...templateData} />;
    case 'modern':
      return <ModernTemplate {...templateData} />;
    case 'minimal':
      return <MinimalTemplate {...templateData} />;
    case 'executive':
      return <ExecutiveTemplate {...templateData} />;
    case 'corporate':
      return <CorporateTemplate {...templateData} />;
    case 'modernpro':
      return <ModernInvoiceTemplate {...templateData} />;
    default:
      return <ClassicTemplate {...templateData} />;
  }
};

// Wrapper component for email rendering
const EmailInvoiceTemplate: React.FC<{
  selectedTemplate: InvoiceTemplateId;
  templateData: TemplateData;
}> = ({ selectedTemplate, templateData }) => {
  return (
    <div 
      style={{ 
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#ffffff',
        color: '#000000',
        maxWidth: '794px',
        margin: '0 auto',
        padding: '20px'
      }}
    >
      {renderTemplateComponent(selectedTemplate, templateData)}
    </div>
  );
};

export const renderTemplateToHtml = async (
  invoice: Invoice,
  selectedTemplate: InvoiceTemplateId,
  businessProfile?: BusinessProfile | null
): Promise<string> => {
  return new Promise((resolve) => {
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '-9999px';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '794px'; // A4 width
    document.body.appendChild(tempContainer);

    // Create template data
    const templateData = createTemplateData(invoice, businessProfile);

    // Create root and render component
    const root = createRoot(tempContainer);
    root.render(
      <EmailInvoiceTemplate 
        selectedTemplate={selectedTemplate} 
        templateData={templateData} 
      />
    );

    // Wait for render to complete
    setTimeout(() => {
      const html = tempContainer.innerHTML;
      
      // Cleanup
      root.unmount();
      document.body.removeChild(tempContainer);
      
      resolve(html);
    }, 100);
  });
};

export const createTemplateElement = (
  invoice: Invoice,
  selectedTemplate: InvoiceTemplateId,
  businessProfile?: BusinessProfile | null
): HTMLDivElement => {
  // Create a temporary container
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.top = '-9999px';
  tempContainer.style.left = '-9999px';
  tempContainer.style.width = '794px'; // A4 width
  tempContainer.style.backgroundColor = '#ffffff';
  tempContainer.style.color = '#000000';
  tempContainer.style.fontFamily = 'Arial, sans-serif';
  tempContainer.style.padding = '20px';
  
  // Create template data
  const templateData = createTemplateData(invoice, businessProfile);

  // Create root and render component
  const root = createRoot(tempContainer);
  root.render(
    <EmailInvoiceTemplate 
      selectedTemplate={selectedTemplate} 
      templateData={templateData} 
    />
  );

  // Add cleanup function to the element
  (tempContainer as any).cleanup = () => {
    root.unmount();
    if (tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer);
    }
  };

  return tempContainer;
};