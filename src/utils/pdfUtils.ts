
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice } from '@/types';

/**
 * Generate PDF from a DOM element with improved quality and layout
 */
export const generatePdfFromElement = async (
  element: HTMLElement, 
  fileName: string = 'invoice.pdf'
): Promise<void> => {
  try {
    // Get the element's dimensions for proper scaling
    const rect = element.getBoundingClientRect();
    const elementWidth = rect.width;
    const elementHeight = rect.height;
    
    // Create a jsPDF instance (A4 format: 210mm × 297mm)
    const pdf = new jsPDF({
      orientation: elementWidth > elementHeight ? 'landscape' : 'portrait',
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
    
    // Render the element to a canvas with high quality settings
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better resolution
      useCORS: true, // Enable CORS to load images
      allowTaint: true, // Allow loading of tainted images
      backgroundColor: '#FFFFFF', // Ensure white background
      logging: false,
      onclone: (clonedDoc) => {
        // Fix any specific rendering issues in the cloned document if needed
        const clonedElement = clonedDoc.body.querySelector('#' + element.id) as HTMLElement;
        if (clonedElement) {
          // Ensure all elements are rendered properly in the clone
          const styles = clonedElement.querySelectorAll('*');
          styles.forEach(el => {
            if (el instanceof HTMLElement) {
              // Remove the fontDisplay property as it's not in the TypeScript definition
              // Use proper styling for PDF rendering
              el.style.color = 'black';
              
              // Force any lazy-loaded images to load
              if (el instanceof HTMLImageElement && !el.complete) {
                el.src = el.src;
              }
            }
          });
        }
      }
    });
    
    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // If content is larger than a single page, split into multiple pages
    if (scaledHeight > (pageHeight - margin * 2)) {
      // Calculate how many pages we need
      const pagesNeeded = Math.ceil(scaledHeight / (pageHeight - margin * 2));
      
      // For each page
      for (let i = 0; i < pagesNeeded; i++) {
        // Add a new page after the first page
        if (i > 0) {
          pdf.addPage();
        }
        
        // Calculate which portion of the image to render on this page
        const sourceY = i * canvas.height / pagesNeeded;
        const sourceHeight = canvas.height / pagesNeeded;
        
        // Fix: Use the correct number of arguments for addImage
        // Documentation: pdf.addImage(imageData, format, x, y, width, height, alias, compression, rotation)
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
    
    // Enable PDF text selection and searching (if available in this version)
    if (typeof pdf.setProperties === 'function') {
      pdf.setProperties({
        title: fileName.replace('.pdf', ''),
        subject: 'Invoice',
        author: 'Invoice App',
        keywords: 'invoice, pdf, document',
        creator: 'Invoice App'
      });
    }
    
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
  element: HTMLElement
): Promise<void> => {
  try {
    // Apply optimal ID to the element for clone reference
    if (!element.id) {
      element.id = `invoice-pdf-${invoice.invoiceNumber}`;
    }
    
    // Temporarily adjust element for optimal PDF generation
    const originalStyle = element.getAttribute('style') || '';
    // Set white background and ensure proper rendering
    element.setAttribute('style', `${originalStyle}; background-color: white; color: black;`);
    
    // Setup file name with invoice number
    const fileName = `Invoice-${invoice.invoiceNumber}.pdf`;
    
    // Generate the PDF
    await generatePdfFromElement(element, fileName);
    
    // Restore original style
    element.setAttribute('style', originalStyle);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw new Error(`Failed to generate invoice PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
};
