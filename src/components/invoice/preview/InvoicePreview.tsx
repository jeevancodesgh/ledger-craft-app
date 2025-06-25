import React, { useRef, useState } from 'react';
import { Invoice, BusinessProfile, DEFAULT_BUSINESS_THEME } from '@/types';
import { InvoiceTemplateId } from '../templates/InvoiceTemplates';
import ClassicTemplate from './templates/ClassicTemplate';
import ModernTemplate from './templates/ModernTemplate';
import MinimalTemplate from './templates/MinimalTemplate';
import ExecutiveTemplate from './templates/ExecutiveTemplate';
import CorporateTemplate from './templates/CorporateTemplate';
import ModernInvoiceTemplate from './templates/ModernInvoiceTemplate';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Download, Maximize2, Minimize2, ZoomIn, ZoomOut, Printer, ArrowLeft } from 'lucide-react';
import { generateInvoicePdf } from '@/utils/pdfUtils';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';

interface InvoicePreviewProps {
  invoice: Invoice;
  selectedTemplate: InvoiceTemplateId;
  onBackToEdit?: () => void;
  businessProfile?: BusinessProfile | null;
}

const InvoicePreview = ({ invoice, selectedTemplate, onBackToEdit, businessProfile }: InvoicePreviewProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(isMobile ? 0.9 : 1); // Slightly smaller default for mobile
  const contextBusinessProfile = useAppContext().businessProfile;
  const effectiveBusinessProfile = businessProfile !== undefined ? businessProfile : contextBusinessProfile;

  // Create template data from invoice
  const templateData = {
    invoice,
    companyName: effectiveBusinessProfile?.name || 'Business Name',
    companyAddress: [
      effectiveBusinessProfile?.address,
      effectiveBusinessProfile?.city,
      effectiveBusinessProfile?.state,
      effectiveBusinessProfile?.zip,
      effectiveBusinessProfile?.country
    ].filter(Boolean).join(', ') || '',
    clientName: invoice.customer?.name || 'Client Name',
    clientAddress: [
      invoice.customer?.address,
      invoice.customer?.city,
      invoice.customer?.state,
      invoice.customer?.zip,
      invoice.customer?.country
    ].filter(Boolean).join(', ') || '',
    taxRate: ((invoice.taxAmount / invoice.subtotal) * 100).toFixed(2),
    tax: invoice.taxAmount,
    businessLogo: effectiveBusinessProfile?.logoUrl || '',
    theme: effectiveBusinessProfile?.theme || DEFAULT_BUSINESS_THEME,
  };

  const handleDownloadPdf = async () => {
    if (contentRef.current && templateRef.current && !isGeneratingPdf) {
      try {
        setIsGeneratingPdf(true);
        toast({
          title: "Processing",
          description: "Generating PDF, please wait...",
        });

        console.log("Starting PDF generation with template:", selectedTemplate);
        
        // Use the specific template ref for PDF generation
        // This ensures we're capturing just the template content, not the UI controls
        await generateInvoicePdf(
          invoice, 
          templateRef.current, 
          selectedTemplate, 
          effectiveBusinessProfile?.logoUrl
        );
        
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

  // Function to handle direct printing
  const handlePrint = () => {
    try {
      setIsPrinting(true);
      
      // Add a temporary print-only class to body during printing
      document.body.classList.add('printing-invoice');
      
      // Small delay to ensure the print-specific styles are applied
      setTimeout(() => {
        // Use the browser's print functionality
        window.print();
        
        // Remove the class after printing dialog is closed
        setTimeout(() => {
          document.body.classList.remove('printing-invoice');
          setIsPrinting(false);
        }, 500);
      }, 100);
    } catch (error) {
      console.error('Print error:', error);
      document.body.classList.remove('printing-invoice');
      setIsPrinting(false);
      
      toast({
        title: "Error",
        description: "Could not print invoice. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.6));
  };

  const resetZoom = () => {
    setZoomLevel(isMobile ? 0.9 : 1);
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
      case 'modernpro':
        return <ModernInvoiceTemplate {...templateData} />;
      default:
        return <ClassicTemplate {...templateData} />;
    }
  };

  return (
    <div 
      className={cn(
        "invoice-preview-container w-full bg-white text-black shadow-sm rounded-lg transition-all duration-300", 
        isMobile && (isFullscreen 
          ? "fixed inset-0 z-50 pb-24 overflow-auto" 
          : "mx-auto max-w-full relative pb-20")
      )}
    >
      <div 
        ref={contentRef}
        className={cn(
          "flex justify-center overflow-auto p-2",
          isMobile ? "invoice-mobile-view" : "p-6"
        )}
        style={{ 
          height: isFullscreen ? 'calc(100vh - 120px)' : isMobile ? 'auto' : 'auto',
          paddingBottom: isMobile ? '70px' : '0'
        }}
      >
        <div 
          className={cn(
            "invoice-content bg-white print:p-0 print:shadow-none w-full",
            isMobile ? "mobile-invoice-scale border rounded-lg shadow-sm" : "border rounded-lg shadow-sm"
          )}
          style={{ 
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease',
            maxWidth: isMobile ? '100%' : '794px', // A4 width at 96 DPI
            margin: '0 auto'
          }}
        >
          <div ref={templateRef} className="pdf-template-container print-template-wrapper">
            {renderTemplate()}
          </div>
        </div>
      </div>
      
      {/* Fixed bottom controls on mobile */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-background p-3 border-t shadow-lg z-50">
          <div className="flex gap-2 mb-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={zoomOut} 
              className="flex-1 h-9"
              aria-label="Zoom out"
              disabled={zoomLevel <= 0.6 || isPrinting}
            >
              <ZoomOut className="h-4 w-4 mr-1" />
              {/* <span className="text-xs">Zoom Out</span> */}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleFullscreen} 
              className="flex-1 h-9"
              aria-label={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
              disabled={isPrinting}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4 mr-1" /> : <Maximize2 className="h-4 w-4 mr-1" />}
              {/* <span className="text-xs">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span> */}
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex-1 h-9"
              aria-label="Print invoice"
              disabled={isPrinting}
            >
              <Printer className="h-4 w-4 mr-1" />
              {/* <span className="text-xs">{isPrinting ? "Printing..." : "Print"}</span> */}
            </Button>
            {/* <Button 
              variant="outline" 
              size="sm"
              onClick={resetZoom} 
              className="flex-1 h-9"
              aria-label="Reset zoom"
              disabled={isPrinting}
            >
              <span className="text-xs">{(zoomLevel * 100).toFixed(0)}%</span>
            </Button> */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={zoomIn} 
              className="flex-1 h-9"
              aria-label="Zoom in"
              disabled={zoomLevel >= 1.5 || isPrinting}
            >
              <ZoomIn className="h-4 w-4 mr-1" />
              {/* <span className="text-xs">Zoom In</span> */}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onBackToEdit} 
              className="flex-1 h-9"
              aria-label="Back to edit"
              disabled={isPrinting || isGeneratingPdf}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="text-xs">Back to Edit</span>
            </Button>
           
           
            <Button 
              size="sm"
              onClick={handleDownloadPdf} 
              className="flex-1 h-9"
              disabled={isGeneratingPdf || isPrinting}
            >
              <Download className="h-4 w-4 mr-1" />
              <span className="text-xs">{isGeneratingPdf ? "Generating..." : "Download PDF"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Desktop controls */}
      {!isMobile && (
        <div className="flex justify-center gap-3 mt-4 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center"
            aria-label="Print invoice"
            disabled={isPrinting}
          >
            <Printer className="h-4 w-4 mr-2" />
            <span>{isPrinting ? "Printing..." : "Print"}</span>
          </Button>
          <Button
            size="sm"
            onClick={handleDownloadPdf}
            className="flex items-center"
            disabled={isGeneratingPdf || isPrinting}
          >
            <Download className="h-4 w-4 mr-2" />
            <span>{isGeneratingPdf ? "Generating..." : "Download PDF"}</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default InvoicePreview;
