
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
    console.log('Generating PDF from element:', element);
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
    
    // Create a clone of the element to ensure we don't modify the original
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.background = '#FFFFFF';
    
    // Prepare the clone for rendering
    document.body.appendChild(clone);
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.width = element.offsetWidth + 'px';
    clone.style.height = 'auto';
    clone.style.margin = '0';
    clone.style.padding = '0';
    
    console.log('Clone element created:', clone);
    
    // Enhanced rendering settings for better quality
    const canvas = await html2canvas(clone, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: true, // Enable logging for debugging
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.body.querySelector('div') as HTMLElement;
        if (clonedElement) {
          console.log('Processing cloned element in onclone');
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
          const notesSections = clonedElement.querySelectorAll('.notes-section');
          notesSections.forEach(section => {
            if (section instanceof HTMLElement) {
              section.style.whiteSpace = 'pre-wrap';
              section.style.wordBreak = 'break-word';
            }
          });

          // Fix the table rendering
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
            logoImg.style.maxHeight = '48px';
            logoImg.style.maxWidth = '140px'; 
            logoImg.style.objectFit = 'contain';
            logoImg.style.borderRadius = '9999px';
            logoImg.crossOrigin = 'Anonymous'; // For CORS images
            logoImg.src = businessLogoUrl;
          }
        }
      }
    });
    
    console.log('Canvas created with dimensions:', canvas.width, canvas.height);
    
    // Remove clone from DOM after canvas capture
    document.body.removeChild(clone);
    
    // Create a jsPDF instance with A4 format in portrait orientation
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Get page dimensions (in mm)
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Set margins (in mm)
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    
    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate scale to fit content within page while maintaining aspect ratio
    const scale = Math.min(
      contentWidth / canvas.width,
      (pageHeight - margin * 2) / canvas.height
    );
    
    // Calculate dimensions after scaling
    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;
    
    // Calculate position to center content horizontally
    const xPosition = (pageWidth - scaledWidth) / 2;
    
    console.log('Adding image to PDF with dimensions:', {
      scaledWidth,
      scaledHeight,
      xPosition,
      margin
    });
    
    // Add image to PDF
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
    
    // Enable PDF metadata
    pdf.setProperties({
      title: fileName.replace('.pdf', ''),
      subject: 'Invoice',
      author: 'Invoice App',
      keywords: 'invoice, pdf, document',
      creator: 'Invoice App'
    });
    
    // Output the PDF
    console.log('Saving PDF:', fileName);
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
    console.log('Starting invoice PDF generation for invoice:', invoice.invoiceNumber);
    
    // Set up element ID for processing
    const sanitizedId = `invoice-pdf-${invoice.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '-')}`;
    element.id = sanitizedId;
    
    // Setup file name with invoice number
    const fileName = `Invoice-${invoice.invoiceNumber}.pdf`;
    
    // Generate the PDF
    await generatePdfFromElement(element, fileName, template, businessLogoUrl);
    
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw new Error(`Failed to generate invoice PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
};
