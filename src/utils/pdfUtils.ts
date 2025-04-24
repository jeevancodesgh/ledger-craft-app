
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
    
    // Before rendering, optimize text elements for PDF output
    const prepElementForPdf = (element: HTMLElement) => {
      // Create a clone to avoid modifying the original DOM
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Find all text elements, especially in the Notes section
      const textElements = clone.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
      textElements.forEach(el => {
        if (el instanceof HTMLElement) {
          // Ensure proper font weight and size for better PDF rendering
          const currentStyle = window.getComputedStyle(el);
          const fontSize = parseFloat(currentStyle.fontSize);
          
          // Increase font weight slightly for better visibility in PDF
          if (fontSize < 12) {
            el.style.fontSize = '12px';
          }
          
          // Force black color for text to ensure visibility
          el.style.color = '#000000';
          
          // Improve font weight for better rendering
          const fontWeight = parseInt(currentStyle.fontWeight);
          if (fontWeight < 400) {
            el.style.fontWeight = '400';
          }
          
          // Ensure line height is adequate
          el.style.lineHeight = '1.5';
        }
      });
      
      // Specifically target note sections which might have special styling
      const noteSections = clone.querySelectorAll('.notes-section, [data-section="notes"]');
      noteSections.forEach(section => {
        if (section instanceof HTMLElement) {
          section.style.fontWeight = '500';
          section.style.fontSize = '12px';
          section.style.color = '#000000';
          section.style.padding = '4px';
          
          // Ensure all child text elements are properly styled
          const noteTexts = section.querySelectorAll('p, span, div');
          noteTexts.forEach(text => {
            if (text instanceof HTMLElement) {
              text.style.fontSize = '12px';
              text.style.fontWeight = '500';
              text.style.color = '#000000';
              text.style.margin = '4px 0';
            }
          });
        }
      });
      
      return clone;
    };
    
    // Prepare the element for PDF rendering
    const preparedElement = prepElementForPdf(element);
    document.body.appendChild(preparedElement);
    preparedElement.style.position = 'absolute';
    preparedElement.style.left = '-9999px';
    
    // Render the element to a canvas with high quality settings
    const canvas = await html2canvas(preparedElement, {
      scale: 2, // Higher scale for better resolution
      useCORS: true, // Enable CORS to load images
      allowTaint: true, // Allow loading of tainted images
      backgroundColor: '#FFFFFF', // Ensure white background
      logging: false,
      onclone: (clonedDoc) => {
        // Fix any specific rendering issues in the cloned document if needed
        const clonedElement = clonedDoc.body.querySelector('[id="' + preparedElement.id + '"]') as HTMLElement;
        if (clonedElement) {
          // Ensure all elements are rendered properly in the clone
          const styles = clonedElement.querySelectorAll('*');
          styles.forEach(el => {
            if (el instanceof HTMLElement) {
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
    
    // Remove the prepared element from DOM
    document.body.removeChild(preparedElement);
    
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
    // Generate a safe ID without special characters for CSS selector
    const safeInvoiceNumber = invoice.invoiceNumber.replace(/[^\w\s-]/g, '_');
    const safeElementId = `invoice-pdf-${safeInvoiceNumber}`;
    
    // Temporarily set a safe ID on the element
    const originalId = element.id;
    element.id = safeElementId;
    
    // Temporarily adjust element for optimal PDF generation
    const originalStyle = element.getAttribute('style') || '';
    // Set white background and ensure proper rendering
    element.setAttribute('style', `${originalStyle}; background-color: white; color: black;`);
    
    // Setup file name with invoice number
    const fileName = `Invoice-${safeInvoiceNumber}.pdf`;
    
    // Generate the PDF
    await generatePdfFromElement(element, fileName);
    
    // Restore original style and ID
    element.setAttribute('style', originalStyle);
    if (originalId) {
      element.id = originalId;
    }
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw new Error(`Failed to generate invoice PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
};
