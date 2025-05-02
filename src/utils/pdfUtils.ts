
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
  template: InvoiceTemplateId = 'classic',
  businessLogoUrl?: string
): Promise<void> => {
  try {
    // First, ensure all fonts and images are fully loaded before capture
    await document.fonts.ready;
    
    // If there's a logo, ensure it's loaded before capture
    if (businessLogoUrl) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn('Failed to load business logo for PDF');
          resolve();
        };
        img.src = businessLogoUrl;
      });
    }
    
    // Get the element's dimensions for proper scaling
    const rect = element.getBoundingClientRect();
    const elementWidth = rect.width;
    const elementHeight = rect.height;
    
    // Create a jsPDF instance with A4 format in portrait orientation
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
      putOnlyUsedFonts: true
    });
    
    // Get page dimensions (in mm)
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Set consistent margins (in mm)
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    
    // Prepare element for clean rendering by making a clone with specific styles
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.width = `${elementWidth}px`;
    clone.style.height = `${elementHeight}px`;
    clone.style.overflow = 'hidden';
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.background = '#FFFFFF';
    document.body.appendChild(clone);
    
    // Enhanced rendering settings for better text quality
    const canvas = await html2canvas(clone, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.body.querySelector(`#${clone.id}`) as HTMLElement;
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

          // Fix the table rendering for mobile
          const tables = clonedElement.querySelectorAll('table');
          tables.forEach(table => {
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            
            const cells = table.querySelectorAll('th, td');
            cells.forEach(cell => {
              if (cell instanceof HTMLElement) {
                cell.style.padding = '4px';
                cell.style.textAlign = cell.classList.contains('text-right') ? 'right' : 'left';
              }
            });
          });
          
          // Enhance logo rendering if present
          const logoImg = clonedElement.querySelector('img[alt]');
          if (logoImg instanceof HTMLImageElement && businessLogoUrl) {
            logoImg.style.maxHeight = '60px';
            logoImg.style.maxWidth = '200px';
            logoImg.style.objectFit = 'contain';
            logoImg.style.marginBottom = '10px';
            logoImg.crossOrigin = 'Anonymous'; // For CORS images
            logoImg.src = businessLogoUrl;
          }
        }
      }
    });
    
    // Remove clone from DOM after canvas capture
    document.body.removeChild(clone);
    
    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // Determine scale to fit content within page while maintaining aspect ratio
    const scale = Math.min(
      contentWidth / canvas.width,
      (pageHeight - margin * 2) / canvas.height
    );
    
    // Calculate dimensions after scaling
    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;
    
    // Calculate x position to center content horizontally
    const xPosition = (pageWidth - scaledWidth) / 2;
    
    // Handle multi-page content if needed
    if (scaledHeight > (pageHeight - margin * 2)) {
      // Calculate how many pages we need
      const pagesNeeded = Math.ceil(scaledHeight / (pageHeight - margin * 2));
      const pageContentHeight = canvas.height / pagesNeeded;
      
      for (let i = 0; i < pagesNeeded; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        // Calculate which portion of the image to add to this page
        const sourceY = i * pageContentHeight;
        const sourceHeight = Math.min(pageContentHeight, canvas.height - sourceY);
        
        pdf.addImage(
          imgData,
          'PNG',
          xPosition,
          margin,
          scaledWidth,
          sourceHeight * scale,
          '',
          'FAST',
          0
        );
      }
    } else {
      // Content fits on a single page
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
  template: InvoiceTemplateId = 'classic',
  businessLogoUrl?: string
): Promise<void> => {
  try {
    // Sanitize invoice number for valid CSS selector
    const sanitizedId = `invoice-pdf-${invoice.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '-')}`;
    if (!element.id) {
      element.id = sanitizedId;
    }
    
    // Setup file name with invoice number
    const fileName = `Invoice-${invoice.invoiceNumber}.pdf`;
    
    // Generate the PDF with template and logo
    await generatePdfFromElement(element, fileName, template, businessLogoUrl);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw new Error(`Failed to generate invoice PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
};
