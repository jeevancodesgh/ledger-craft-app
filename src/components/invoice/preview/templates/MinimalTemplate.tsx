import React from 'react';
import { Invoice } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from '@/utils/invoiceUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MinimalTemplateProps {
  invoice: Invoice;
  companyName: string;
  companyAddress: string;
  clientName: string;
  clientAddress: string;
  taxRate: string;
  tax: number;
  businessLogo?: string;
}

const MinimalTemplate = ({ 
  invoice, 
  companyName, 
  companyAddress, 
  clientName, 
  clientAddress,
  taxRate,
  tax,
  businessLogo
}: MinimalTemplateProps) => {
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
  
  return (
    <Card className="p-4 sm:p-8 bg-white minimal-invoice-template print-template">
      <CardContent className="p-0">
        <div className="w-full mx-auto space-y-4 sm:space-y-6">
          {/* Header with Logo */}
          <div className="text-center mb-4 sm:mb-8">
            {businessLogo && (
              <div className="flex justify-center mb-3 sm:mb-4">
                <img 
                  src={businessLogo} 
                  alt={companyName} 
                  className="max-h-10 sm:max-h-12 object-contain rounded-full invoice-logo"
                  crossOrigin="anonymous"
                />
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-light tracking-wide">INVOICE</h1>
            <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">#{invoice.invoiceNumber}</p>
          </div>

          {/* Company and Client Info */}
          <div className="flex justify-between text-sm invoice-parties">
            <div className="w-1/2 pr-4">
              <p className="font-medium mb-1">{companyName}</p>
              <p className="text-gray-600 text-xs sm:text-sm whitespace-pre-wrap no-underline no-autolink">{companyAddress}</p>
            </div>
            <div className="w-1/2 text-right">
              <p className="font-medium mb-1">{clientName}</p>
              <p className="text-gray-600 text-xs sm:text-sm whitespace-pre-wrap no-underline no-autolink">{clientAddress}</p>
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

          {/* Invoice Details */}
          <div className="mt-8 sm:mt-12 invoice-items-table">
            <table className="w-full text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left font-medium">Description</th>
                  <th className="py-2 text-right font-medium">Qty</th>
                  <th className="py-2 text-right font-medium">Rate</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="py-2 sm:py-3">
                      {item.description}
                      {/* Cast item to any and check for details */}
                      {((item as any).details) && (
                        <div className="text-xs text-gray-500 break-words">
                          {(item as any).details}
                        </div>
                      )}
                    </td>
                    <td className="py-2 sm:py-3 text-right">{item.quantity}</td>
                    <td className="py-2 sm:py-3 text-right">{formatCurrency(item.rate, invoice.currency)}</td>
                    <td className="py-2 sm:py-3 text-right">{formatCurrency(item.quantity * item.rate, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 sm:mt-8 invoice-totals">
            <div className="flex flex-col items-end space-y-1 sm:space-y-2">
              <div className="flex justify-between w-36 sm:w-48">
                <span className="text-gray-600 text-xs sm:text-sm">Subtotal</span>
                <span className="text-xs sm:text-sm">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              <div className="flex justify-between w-36 sm:w-48">
                <span className="text-gray-600 text-xs sm:text-sm">Tax ({taxRate}%)</span>
                <span className="text-xs sm:text-sm">{formatCurrency(tax, invoice.currency)}</span>
              </div>
              <div className="flex justify-between w-36 sm:w-48 font-medium border-t pt-1 sm:pt-2 mt-1 sm:mt-2">
                <span className="text-sm sm:text-base">Total</span>
                <span className="text-sm sm:text-base">{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t text-xs sm:text-sm notes-section">
              <h2 className="font-medium mb-1 sm:mb-2">Notes</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MinimalTemplate;
