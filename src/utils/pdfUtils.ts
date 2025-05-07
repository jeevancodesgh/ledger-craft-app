
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
    
    // Prepare the clone for rendering with specific PDF optimization
    document.body.appendChild(clone);
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    
    // Set explicit width to match A4 proportions for better scaling
    const a4Width = 794; // A4 width in pixels at 96 DPI
    clone.style.width = `${a4Width}px`;
    clone.style.margin = '0';
    clone.style.padding = '0';
    
    console.log('Clone element created with width:', a4Width);
    
    // Enhanced rendering settings for better quality
    const canvas = await html2canvas(clone, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: true, // Enable logging for debugging
      width: a4Width, // Match the clone width
      height: clone.scrollHeight, // Use actual content height
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.body.querySelector('div') as HTMLElement;
        if (clonedElement) {
          console.log('Processing cloned element in onclone');
          // Apply PDF-specific styles
          clonedElement.style.padding = '10mm';
          
          // Optimize text elements for PDF
          const textElements = clonedElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, td, th');
          textElements.forEach(el => {
            if (el instanceof HTMLElement) {
              // Set appropriate font sizes for PDF output
              if (el.classList.contains('text-xl') || el.classList.contains('text-2xl')) {
                el.style.fontSize = '16px';
              } else if (el.classList.contains('text-lg')) {
                el.style.fontSize = '14px';
              } else if (el.classList.contains('text-sm')) {
                el.style.fontSize = '10px';
              } else if (el.classList.contains('text-xs')) {
                el.style.fontSize = '8px';
              } else {
                // Default body text
                el.style.fontSize = '10px';
              }
              
              // Apply coloring based on classes
              if (el.classList.contains('text-muted-foreground')) {
                el.style.color = '#4B5563';
              } else {
                el.style.color = '#000000';
              }
              
              // Improve font consistency
              el.style.fontFamily = 'Helvetica, Arial, sans-serif';
            }
          });

          // Ensure proper notes rendering
          const notesSections = clonedElement.querySelectorAll('.notes-section');
          notesSections.forEach(section => {
            if (section instanceof HTMLElement) {
              section.style.whiteSpace = 'pre-wrap';
              section.style.wordBreak = 'break-word';
              section.style.fontSize = '9px';
            }
          });

          // Fix the table rendering
          const tables = clonedElement.querySelectorAll('table');
          tables.forEach(table => {
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.fontSize = '10px';
            
            const cells = table.querySelectorAll('th, td');
            cells.forEach(cell => {
              if (cell instanceof HTMLElement) {
                cell.style.padding = '3px';
                cell.style.textAlign = cell.classList.contains('text-right') ? 'right' : 'left';
                cell.style.fontSize = '9px';
              }
            });
          });
          
          // Enhance logo rendering if present
          const logoImg = clonedElement.querySelector('img[alt]');
          if (logoImg instanceof HTMLImageElement && businessLogoUrl) {
            logoImg.style.maxHeight = '40px';
            logoImg.style.maxWidth = '120px'; 
            logoImg.style.objectFit = 'contain';
            logoImg.crossOrigin = 'Anonymous';
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
    const margin = 5;
    const contentWidth = pageWidth - (margin * 2);
    
    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate the content aspect ratio
    const contentAspectRatio = canvas.height / canvas.width;
    
    // Calculate the maximum height to fit the content on one page
    // while maintaining the aspect ratio
    const scaledWidth = contentWidth;
    let scaledHeight = contentWidth * contentAspectRatio;
    
    // Check if content exceeds page height and needs multi-page handling
    if (scaledHeight > (pageHeight - margin * 2)) {
      console.log('Content exceeds page height, using multi-page approach');
      
      // Calculate the scale to fit the content width within the page
      const scale = contentWidth / canvas.width;
      
      // Calculate how many pixels of canvas height fit on one page
      const pageContentHeightInPixels = Math.floor((pageHeight - margin * 2) / scale);
      
      // Calculate number of pages needed
      const totalPages = Math.ceil(canvas.height / pageContentHeightInPixels);
      console.log(`Will render ${totalPages} pages`);
      
      // Render each page
      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        // Add a new page for all pages after the first one
        if (pageNum > 0) {
          pdf.addPage();
        }
        
        const sourceY = pageNum * pageContentHeightInPixels;
        const sourceHeight = Math.min(pageContentHeightInPixels, canvas.height - sourceY);
        
        console.log(`Rendering page ${pageNum + 1}/${totalPages}, sourceY: ${sourceY}, sourceHeight: ${sourceHeight}`);
        
        // Add a slice of the image to this page
        // Fix: Use the correct parameter count for addImage method
        pdf.addImage({
          imageData: imgData,
          format: 'PNG',
          x: margin,
          y: margin,
          width: contentWidth,
          height: sourceHeight * scale,
          compression: 'FAST',
          rotation: 0,
          srcX: 0,
          srcY: sourceY,
          srcWidth: canvas.width,
          srcHeight: sourceHeight
        });
      }
    } else {
      // Content fits on one page
      console.log('Content fits on one page');
      
      // Calculate position to center content vertically
      const yPosition = margin + (pageHeight - margin * 2 - scaledHeight) / 2;
      
      // Add image to PDF - using correct format for addImage
      pdf.addImage({
        imageData: imgData,
        format: 'PNG',
        x: margin,
        y: yPosition,
        width: scaledWidth,
        height: scaledHeight,
        compression: 'FAST'
      });
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
