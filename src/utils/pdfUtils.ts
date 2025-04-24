
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice } from '@/types';
import { InvoiceTemplateId } from '@/components/invoice/templates/InvoiceTemplates';

/**
 * Generate PDF from a DOM element with improved quality and layout
 */
export const generatePdfFromElement = async (
  element: HTMLElement, 
  fileName: string = 'invoice.pdf',
  template: InvoiceTemplateId = 'classic'
): Promise<void> => {
  try {
    // Get the element's dimensions for proper scaling
    const rect = element.getBoundingClientRect();
    const elementWidth = rect.width;
    const elementHeight = rect.height;
    
    // Create a jsPDF instance (A4 format in portrait mode for vertical layout)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Get page dimensions (in mm)
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Set margins (in mm) - slightly larger for vertical format
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    // Determine scale to fit content within page while maintaining aspect ratio
    const scale = Math.min(
      contentWidth / elementWidth,
      (pageHeight - margin * 2) / elementHeight
    );
    
    // Calculate dimensions after scaling
    const scaledWidth = elementWidth * scale;
    const scaledHeight = elementHeight * scale;
    
    // Calculate x position to center content horizontally
    const xPosition = (pageWidth - scaledWidth) / 2;
    
    // Enhanced rendering settings for better text quality
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.body.querySelector('#' + element.id) as HTMLElement;
        if (clonedElement) {
          // Ensure text elements are rendered with optimal settings
          const textElements = clonedElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
          textElements.forEach(el => {
            if (el instanceof HTMLElement) {
              el.style.color = '#000000';
              el.style.fontFamily = 'Helvetica, Arial, sans-serif';
              
              // Enhance text rendering for PDF
              if (el.classList.contains('font-bold')) {
                el.style.fontWeight = '700';
              }
              if (el.classList.contains('text-muted-foreground')) {
                el.style.color = '#4B5563';
              }
            }
          });

          // Ensure proper notes rendering
          const notesSection = clonedElement.querySelector('.notes-section');
          if (notesSection instanceof HTMLElement) {
            notesSection.style.whiteSpace = 'pre-wrap';
            notesSection.style.wordBreak = 'break-word';
          }
        }
      }
    });
    
    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // Handle multi-page content
    if (scaledHeight > (pageHeight - margin * 2)) {
      const pagesNeeded = Math.ceil(scaledHeight / (pageHeight - margin * 2));
      
      for (let i = 0; i < pagesNeeded; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        const sourceY = i * canvas.height / pagesNeeded;
        const sourceHeight = canvas.height / pagesNeeded;
        
        pdf.addImage(
          imgData,
          'PNG',
          xPosition,
          margin,
          scaledWidth,
          scaledHeight / pagesNeeded,
          '',
          'FAST',
          0
        );
      }
    } else {
      pdf.addImage(
        imgData,
        'PNG',
        xPosition,
        margin,
        scaledWidth,
        scaledHeight,
        '',
        'FAST'
      );
    }
    
    // Enable PDF metadata
    pdf.setProperties({
      title: fileName.replace('.pdf', ''),
      subject: 'Invoice',
      author: 'Invoice App',
      keywords: 'invoice, pdf, document',
      creator: 'Invoice App'
    });
    
    // Output the PDF
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Generate invoice PDF from invoice data and element
 */
export const generateInvoicePdf = async (
  invoice: Invoice,
  element: HTMLElement,
  template: InvoiceTemplateId = 'classic'
): Promise<void> => {
  try {
    // Sanitize invoice number for valid CSS selector
    const sanitizedId = `invoice-pdf-${invoice.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '-')}`;
    if (!element.id) {
      element.id = sanitizedId;
    }
    
    // Setup file name with invoice number
    const fileName = `Invoice-${invoice.invoiceNumber}.pdf`;
    
    // Generate the PDF with template
    await generatePdfFromElement(element, fileName, template);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw new Error(`Failed to generate invoice PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
};

