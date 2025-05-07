
import React from 'react';
import { formatCurrency } from '@/utils/invoiceUtils';
import { Invoice, LineItem } from '@/types';
import { PDFCard, PDFCardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

interface ExecutiveTemplateProps {
  invoice: Invoice;
  companyName: string;
  companyAddress: string;
  clientName: string;
  clientAddress: string;
  taxRate: string;
  tax: number;
  businessLogo?: string;
}

const ExecutiveTemplate = ({
  invoice,
  companyName,
  companyAddress,
  clientName,
  clientAddress,
  taxRate,
  tax,
  businessLogo
}: ExecutiveTemplateProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="bg-white text-gray-800 p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b-2 border-gray-200 pb-4 sm:pb-6 mb-4 sm:mb-6">
        <div className="flex justify-between items-start">
          <div>
            {businessLogo && (
              <div className="mb-2">
                <img 
                  src={businessLogo} 
                  alt={companyName} 
                  className="h-10 w-10 sm:h-14 sm:w-14 object-contain rounded-full" 
                />
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-light tracking-wider text-gray-700 mb-1">INVOICE</h1>
            <p className="text-base sm:text-lg font-semibold text-[#8B5CF6]">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg sm:text-xl font-bold">{companyName}</h2>
            <p className="text-gray-600 text-xs sm:text-sm whitespace-pre-line">{companyAddress}</p>
          </div>
        </div>
      </div>

      {/* Client & Invoice Info */}
      <div className="grid grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
        <div>
          <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-500 mb-1 sm:mb-2">Billed To</h3>
          <h4 className="text-base sm:text-lg font-bold mb-1">{clientName}</h4>
          <p className="text-gray-600 text-xs sm:text-sm whitespace-pre-line">{clientAddress}</p>
        </div>
        <div className="text-right">
          <div className="mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-500 mb-1">Invoice Date</p>
            <p className="text-sm sm:text-lg">{new Date(invoice.date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-500 mb-1">Due Date</p>
            <p className="text-sm sm:text-lg">{new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <PDFCard className="mb-6 sm:mb-8">
        <PDFCardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="py-3 sm:py-4 px-3 sm:px-6 font-semibold uppercase tracking-wider text-xs text-gray-600">Description</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-6 font-semibold uppercase tracking-wider text-xs text-gray-600">Qty</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-6 font-semibold uppercase tracking-wider text-xs text-gray-600">Rate</th>
                  <th className="py-3 sm:py-4 px-3 sm:px-6 font-semibold uppercase tracking-wider text-xs text-gray-600 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: LineItem, index: number) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-2 sm:py-3 px-3 sm:px-6 border-t border-gray-200">
                      {item.description}
                      {/* Only render details if it exists */}
                      {(item as any).details && (
                        <div className="text-xs text-gray-500 break-words">
                          {(item as any).details}
                        </div>
                      )}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-6 border-t border-gray-200">{item.quantity}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-6 border-t border-gray-200">{formatCurrency(item.rate, invoice.currency)}</td>
                    <td className="py-2 sm:py-3 px-3 sm:px-6 border-t border-gray-200 text-right">{formatCurrency(item.total || item.quantity * item.rate, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PDFCardContent>
      </PDFCard>

      {/* Summary */}
      <div className="flex justify-end mb-6 sm:mb-8">
        <div className="w-36 sm:w-64">
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
              <span>-{formatCurrency(invoice.discount, invoice.currency)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 sm:py-3 border-t-2 border-gray-300 mt-1 text-xs sm:text-sm">
            <span className="font-bold">Total:</span>
            <span className="font-bold text-[#8B5CF6]">{formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>
      </div>
      
      {/* Notes & Terms */}
      {(invoice.notes || invoice.terms) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mt-4 sm:mt-6 border-t border-gray-200 pt-4 sm:pt-6">
          {invoice.notes && (
            <div>
              <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-500 mb-1 sm:mb-2">Notes</h4>
              <p className="text-gray-600 text-xs sm:text-sm whitespace-pre-line notes-section">{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div>
              <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-500 mb-1 sm:mb-2">Terms & Conditions</h4>
              <p className="text-gray-600 text-xs sm:text-sm whitespace-pre-line">{invoice.terms}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Footer */}
      <div className="border-t border-gray-200 mt-6 sm:mt-8 pt-4 sm:pt-6 text-center text-gray-500 text-xs sm:text-sm">
        <p>Thank you for your business</p>
      </div>
    </div>
  );
};

export default ExecutiveTemplate;
