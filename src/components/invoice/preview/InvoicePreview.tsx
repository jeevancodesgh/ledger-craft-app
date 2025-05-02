
import React, { useRef } from 'react';
import { Invoice } from '@/types';
import { InvoiceTemplateId } from '../templates/InvoiceTemplates';
import ClassicTemplate from './templates/ClassicTemplate';
import ModernTemplate from './templates/ModernTemplate';
import MinimalTemplate from './templates/MinimalTemplate';
import ExecutiveTemplate from './templates/ExecutiveTemplate';
import CorporateTemplate from './templates/CorporateTemplate';
import CanvasPreview from './CanvasPreview';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { generateInvoicePdf } from '@/utils/pdfUtils';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface InvoicePreviewProps {
  invoice: Invoice;
  selectedTemplate: InvoiceTemplateId;
}

const InvoicePreview = ({ invoice, selectedTemplate }: InvoicePreviewProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Create template data from invoice
  const templateData = {
    invoice,
    companyName: invoice.customer?.name || 'Company Name',
    companyAddress: `${invoice.customer?.address || ''} ${invoice.customer?.city || ''} ${invoice.customer?.state || ''} ${invoice.customer?.zip || ''}`.trim(),
    clientName: invoice.customer?.name || 'Client Name',
    clientAddress: `${invoice.customer?.address || ''} ${invoice.customer?.city || ''} ${invoice.customer?.state || ''} ${invoice.customer?.zip || ''}`.trim(),
    taxRate: ((invoice.taxAmount / invoice.subtotal) * 100).toFixed(2),
    tax: invoice.taxAmount
  };

  const handleDownloadPdf = async () => {
    if (contentRef.current) {
      try {
        await generateInvoicePdf(invoice, contentRef.current, selectedTemplate);
        toast({
          title: "Success",
          description: "Invoice PDF has been downloaded"
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: "Error",
          description: "Could not generate PDF. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const renderTemplate = () => {
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
      default:
        return <ClassicTemplate {...templateData} />;
    }
  };

  return (
    <div className={cn("w-full bg-white shadow-sm rounded-lg", 
      isMobile ? "mx-auto max-w-[95vw] relative pb-16" : "")}>
      <div ref={contentRef} className={cn("", isMobile ? "scale-90 origin-top" : "")}>
        {renderTemplate()}
      </div>
      <CanvasPreview contentRef={contentRef} />
      
      {/* Fixed download button on mobile */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-background p-4 border-t shadow-lg z-10">
          <Button 
            onClick={handleDownloadPdf} 
            className="w-full gap-2"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      )}
    </div>
  );
};

export default InvoicePreview;
