
import React, { useRef } from 'react';
import { Invoice } from '@/types';
import { InvoiceTemplateId } from '../templates/InvoiceTemplates';
import ClassicTemplate from './templates/ClassicTemplate';
import ModernTemplate from './templates/ModernTemplate';
import MinimalTemplate from './templates/MinimalTemplate';
import ExecutiveTemplate from './templates/ExecutiveTemplate';
import CorporateTemplate from './templates/CorporateTemplate';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Download, Maximize2, Minimize2 } from 'lucide-react';
import { generateInvoicePdf } from '@/utils/pdfUtils';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';

interface InvoicePreviewProps {
  invoice: Invoice;
  selectedTemplate: InvoiceTemplateId;
}

const InvoicePreview = ({ invoice, selectedTemplate }: InvoicePreviewProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const { businessProfile } = useAppContext();

  // Create template data from invoice
  const templateData = {
    invoice,
    companyName: invoice.customer?.name || 'Company Name',
    companyAddress: `${invoice.customer?.address || ''} ${invoice.customer?.city || ''} ${invoice.customer?.state || ''} ${invoice.customer?.zip || ''}`.trim(),
    clientName: invoice.customer?.name || 'Client Name',
    clientAddress: `${invoice.customer?.address || ''} ${invoice.customer?.city || ''} ${invoice.customer?.state || ''} ${invoice.customer?.zip || ''}`.trim(),
    taxRate: ((invoice.taxAmount / invoice.subtotal) * 100).toFixed(2),
    tax: invoice.taxAmount,
    businessLogo: businessProfile?.logoUrl || '',
  };

  const handleDownloadPdf = async () => {
    if (contentRef.current && !isGeneratingPdf) {
      try {
        setIsGeneratingPdf(true);
        toast({
          title: "Processing",
          description: "Generating PDF, please wait...",
        });

        // Create a special version for PDF export
        const pdfContainer = document.createElement('div');
        pdfContainer.style.width = '794px'; // A4 width at 96 DPI
        pdfContainer.style.padding = '40px';
        pdfContainer.style.boxSizing = 'border-box';
        pdfContainer.style.backgroundColor = '#FFFFFF';
        
        // Clone the content for PDF generation to avoid layout issues
        const contentClone = contentRef.current.cloneNode(true) as HTMLElement;
        
        // Reset any responsive styles that might affect PDF layout
        const responsiveElements = contentClone.querySelectorAll('[class*="scale-"], [class*="origin-"]');
        responsiveElements.forEach(el => {
          if (el instanceof HTMLElement) {
            el.style.transform = 'none';
            el.style.width = '100%';
          }
        });
        
        pdfContainer.appendChild(contentClone);
        document.body.appendChild(pdfContainer);
        
        // Generate PDF from the specially prepared container
        await generateInvoicePdf(invoice, pdfContainer, selectedTemplate, businessProfile?.logoUrl);
        
        // Clean up
        document.body.removeChild(pdfContainer);
        
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
      } finally {
        setIsGeneratingPdf(false);
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
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
    <div 
      className={cn(
        "w-full bg-white shadow-sm rounded-lg transition-all duration-300", 
        isMobile && (isFullscreen 
          ? "fixed inset-0 z-50 pb-16 overflow-y-auto" 
          : "mx-auto max-w-[95vw] relative pb-16")
      )}
    >
      <div 
        ref={contentRef} 
        className={cn(
          "bg-white print:p-0 print:shadow-none", 
          isMobile && (isFullscreen 
            ? "p-4 min-h-[calc(100vh-64px)]" 
            : "scale-[0.95] origin-top p-2")
        )}
      >
        {renderTemplate()}
      </div>
      
      {/* Fixed bottom controls on mobile */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-background p-4 border-t shadow-lg z-50 flex gap-2">
          <Button 
            variant="outline"
            onClick={toggleFullscreen} 
            className="flex-1 gap-2"
            aria-label={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </Button>
          <Button 
            onClick={handleDownloadPdf} 
            className="flex-1 gap-2"
            disabled={isGeneratingPdf}
          >
            <Download className="h-4 w-4" />
            <span>{isGeneratingPdf ? "Generating..." : "Download PDF"}</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default InvoicePreview;
