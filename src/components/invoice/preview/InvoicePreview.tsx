
import React, { useRef, useState, useEffect } from 'react';
import { Invoice } from '@/types';
import { InvoiceTemplateId } from '../templates/InvoiceTemplates';
import ClassicTemplate from './templates/ClassicTemplate';
import ModernTemplate from './templates/ModernTemplate';
import MinimalTemplate from './templates/MinimalTemplate';
import ExecutiveTemplate from './templates/ExecutiveTemplate';
import CorporateTemplate from './templates/CorporateTemplate';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Download, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
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
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(isMobile ? 0.65 : 1); // Start with zoomed out view on mobile
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
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

  // Generate PDF for mobile preview on mount and when dependencies change
  useEffect(() => {
    if (isMobile) {
      generatePdfPreview();
    } else {
      // Clear PDF if switching to desktop
      setPdfDataUrl(null);
    }
  }, [isMobile, selectedTemplate, invoice, businessProfile?.logoUrl]);

  const generatePdfPreview = async () => {
    if (!contentRef.current || isGeneratingPdf) return;
    
    try {
      setIsGeneratingPdf(true);
      
      // Create a temporary container for PDF generation
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
      
      // Use html2canvas and jsPDF directly (simplified from pdfUtils)
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        logging: false,
      });
      
      // Remove temporary container
      document.body.removeChild(pdfContainer);
      
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pageWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Get the PDF as data URL
      setPdfDataUrl(pdf.output('datauristring'));
      
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      toast({
        title: "Error",
        description: "Could not generate PDF preview",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (contentRef.current && !isGeneratingPdf) {
      try {
        setIsGeneratingPdf(true);
        toast({
          title: "Processing",
          description: "Generating PDF, please wait...",
        });

        await generateInvoicePdf(invoice, contentRef.current, selectedTemplate, businessProfile?.logoUrl);
        
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

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.4));
  };

  const resetZoom = () => {
    setZoomLevel(isMobile ? 0.65 : 1);
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
      {/* Hidden div for PDF generation reference */}
      <div className="hidden">
        <div ref={contentRef}>
          {renderTemplate()}
        </div>
      </div>

      {isMobile && pdfDataUrl ? (
        // PDF Preview for mobile
        <div 
          className="flex justify-center items-center overflow-hidden"
          style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '70vh' }}
        >
          <iframe 
            src={pdfDataUrl}
            className="w-full h-full border-0"
            style={{ 
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease',
            }}
          />
        </div>
      ) : (
        // HTML Preview for desktop
        <div 
          className="flex justify-center items-center overflow-hidden"
          style={{ minHeight: isMobile ? '50vh' : 'auto' }}
        >
          <div 
            className={cn(
              "bg-white print:p-0 print:shadow-none",
              isMobile && "p-2 transform-gpu"
            )}
            style={{ 
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease',
              maxWidth: '100%',
              margin: '0 auto'
            }}
          >
            {renderTemplate()}
          </div>
        </div>
      )}
      
      {/* Fixed bottom controls on mobile */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-background p-4 border-t shadow-lg z-50">
          <div className="flex gap-2 mb-2">
            <Button 
              variant="outline"
              onClick={zoomOut} 
              className="flex-1 gap-2"
              aria-label="Zoom out"
              disabled={zoomLevel <= 0.4}
            >
              <ZoomOut className="h-4 w-4" />
              <span>Zoom Out</span>
            </Button>
            <Button 
              variant="outline"
              onClick={resetZoom} 
              className="flex-1"
              aria-label="Reset zoom"
            >
              {(zoomLevel * 100).toFixed(0)}%
            </Button>
            <Button 
              variant="outline"
              onClick={zoomIn} 
              className="flex-1 gap-2"
              aria-label="Zoom in"
              disabled={zoomLevel >= 1.5}
            >
              <ZoomIn className="h-4 w-4" />
              <span>Zoom In</span>
            </Button>
          </div>
          <div className="flex gap-2">
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
        </div>
      )}
    </div>
  );
};

export default InvoicePreview;
