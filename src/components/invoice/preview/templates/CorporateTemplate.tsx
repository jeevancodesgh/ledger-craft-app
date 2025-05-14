import React from 'react';
import { formatCurrency } from '@/utils/invoiceUtils';
import { Invoice, LineItem } from '@/types';
import { PDFCard, PDFCardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

interface CorporateTemplateProps {
  invoice: Invoice;
  companyName: string;
  companyAddress: string;
  clientName: string;
  clientAddress: string;
  taxRate: string;
  tax: number;
  businessLogo?: string;
}

const CorporateTemplate = ({
  invoice,
  companyName,
  companyAddress,
  clientName,
  clientAddress,
  taxRate,
  tax,
  businessLogo
}: CorporateTemplateProps) => {
  const isMobile = useIsMobile();
  
  React.useEffect(() => {
    if (isMobile) {
      let meta = document.querySelector('meta[name="format-detection"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'format-detection');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', 'telephone=no, email=no');
    }
  }, [isMobile]);

  // Get status color
  const getStatusColor = () => {
    switch (invoice.status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white text-gray-800 p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Header with accent color */}
      <div className="bg-[#0EA5E9] text-white p-4 sm:p-6 mb-4 sm:mb-8 rounded-lg">
        <div className="flex justify-between items-start">
          {businessLogo && (
            <div className="mb-2">
              <img 
                src={businessLogo} 
                alt={companyName} 
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain rounded-full"
              />
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-3xl font-bold mb-1">INVOICE</h1>
            <p className="text-sm sm:text-lg">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold capitalize ${getStatusColor()}`}>
              {invoice.status}
            </span>
            {invoice.customer?.email && (
              isMobile ? (
                <span className="text-xs sm:text-sm no-autolink text-white">{invoice.customer.email}</span>
              ) : (
                <p className="text-xs sm:text-sm text-white">{invoice.customer.email}</p>
              )
            )}
          </div>
        </div>
      </div>

      {/* Company & Client Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-4 sm:mb-8">
        <div>
          <div className="mb-4 sm:mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 sm:mb-2">From</h3>
            <h4 className="text-lg sm:text-xl font-bold mb-1">{companyName}</h4>
            <p className="text-gray-600 text-xs sm:text-sm whitespace-pre-line">{companyAddress}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 sm:mb-2">To</h3>
            <h4 className="text-lg sm:text-xl font-bold mb-1">{clientName}</h4>
            <p className="text-gray-600 text-xs sm:text-sm whitespace-pre-line">{clientAddress}</p>
            {invoice.customer?.phone && (
              isMobile ? (
                <span className="text-xs sm:text-sm no-autolink">{invoice.customer.phone}</span>
              ) : (
                <p className="text-xs sm:text-sm">{invoice.customer.phone}</p>
              )
            )}
            {invoice.customer?.email && (
              isMobile ? (
                <span className="text-xs sm:text-sm no-autolink">{invoice.customer.email}</span>
              ) : (
                <p className="text-xs sm:text-sm">{invoice.customer.email}</p>
              )
            )}
          </div>
        </div>
        <div className="bg-gray-50 p-3 sm:p-6 rounded-lg">
          <div className="mb-3 sm:mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-0.5 sm:mb-1">Invoice Number</p>
            <p className="text-sm sm:text-lg font-medium">{invoice.invoiceNumber}</p>
          </div>
          <div className="mb-3 sm:mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-0.5 sm:mb-1">Invoice Date</p>
            <p className="text-sm sm:text-lg font-medium">{new Date(invoice.date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-0.5 sm:mb-1">Due Date</p>
            <p className="text-sm sm:text-lg font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <PDFCard className="mb-4 sm:mb-8 border border-gray-200 rounded-lg overflow-hidden">
        <PDFCardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0EA5E9] text-white text-left">
                <tr>
                  <th className="py-3 sm:py-4 px-3 sm:px-6 font-bold uppercase tracking-wider text-xs">Item</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-6 font-bold uppercase tracking-wider text-xs">Qty</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-6 font-bold uppercase tracking-wider text-xs">Rate</th>
                  <th className="py-3 sm:py-4 px-3 sm:px-6 font-bold uppercase tracking-wider text-xs text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: LineItem, index: number) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-2 sm:py-4 px-3 sm:px-6 border-t border-gray-200">
                      {item.description}
                      {/* Only render details if it exists */}
                      {(item as any).details && (
                        <div className="text-xs text-gray-500 break-words">
                          {(item as any).details}
                        </div>
                      )}
                    </td>
                    <td className="py-2 sm:py-4 px-2 sm:px-6 border-t border-gray-200">{item.quantity}</td>
                    <td className="py-2 sm:py-4 px-2 sm:px-6 border-t border-gray-200">{formatCurrency(item.rate, invoice.currency)}</td>
                    <td className="py-2 sm:py-4 px-3 sm:px-6 border-t border-gray-200 text-right">{formatCurrency(item.total || item.quantity * item.rate, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PDFCardContent>
      </PDFCard>

      {/* Summary */}
      <div className="flex justify-end mb-4 sm:mb-8">
        <div className="w-48 sm:w-72 bg-gray-50 p-3 sm:p-6 rounded-lg">
          <div className="flex justify-between py-1 sm:py-2 text-xs sm:text-sm">
            <span className="font-medium">Subtotal:</span>
            <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between py-1 sm:py-2 text-xs sm:text-sm">
            <span className="font-medium">Tax ({taxRate}%):</span>
            <span>{formatCurrency(tax, invoice.currency)}</span>
          </div>
          {invoice.discount && invoice.discount > 0 && (
            <div className="flex justify-between py-1 sm:py-2 text-xs sm:text-sm">
              <span className="font-medium">Discount:</span>
              <span className="text-red-600">-{formatCurrency(invoice.discount, invoice.currency)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 sm:py-3 border-t border-gray-300 mt-1">
            <span className="text-sm sm:text-lg font-bold">Total:</span>
            <span className="text-sm sm:text-lg font-bold text-[#0EA5E9]">{formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>
      </div>
      
      {/* Notes & Terms */}
      {(invoice.notes || invoice.terms) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mt-4 sm:mt-6 border-t border-gray-200 pt-4 sm:pt-6">
          {invoice.notes && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 sm:mb-2">Notes</h4>
              <p className="text-gray-600 text-xs sm:text-sm whitespace-pre-line notes-section">{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 sm:mb-2">Terms & Conditions</h4>
              <p className="text-gray-600 text-xs sm:text-sm whitespace-pre-line">{invoice.terms}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Footer */}
      <div className="border-t border-gray-200 mt-6 sm:mt-8 pt-4 sm:pt-6 text-center">
        <p className="text-gray-500 text-xs sm:text-sm">Payment is due within {getDaysDifference(invoice.date, invoice.dueDate)} days of issue</p>
      </div>
    </div>
  );
};

// Helper function to calculate days between dates
const getDaysDifference = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default CorporateTemplate;
