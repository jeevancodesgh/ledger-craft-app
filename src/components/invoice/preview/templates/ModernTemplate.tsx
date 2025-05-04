
import React from 'react';
import { Invoice } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from '@/utils/invoiceUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ModernTemplateProps {
  invoice: Invoice;
  companyName: string;
  companyAddress: string;
  clientName: string;
  clientAddress: string;
  taxRate: string;
  tax: number;
  businessLogo?: string;
}

const ModernTemplate = ({ 
  invoice, 
  companyName, 
  companyAddress, 
  clientName, 
  clientAddress, 
  taxRate, 
  tax,
  businessLogo
}: ModernTemplateProps) => {
  const isMobile = useIsMobile();
  
  return (
    <Card className="p-8 bg-gradient-to-br from-purple-50 to-white max-w-full overflow-hidden">
      <CardContent>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-purple-600">INVOICE</h1>
              <p className="text-gray-500 mt-1">#{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right bg-purple-100 p-4 rounded-lg w-full sm:w-auto">
              {businessLogo && (
                <img 
                  src={businessLogo} 
                  alt="Company Logo" 
                  className="h-12 object-contain mb-2 mx-auto sm:mx-0 sm:ml-auto"
                />
              )}
              <p className="font-bold text-lg">{companyName}</p>
              <p className="text-gray-600 mt-1 break-words">{companyAddress}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-purple-600 mb-2">Bill To:</h2>
            <p className="text-gray-800 font-medium">{clientName}</p>
            <p className="text-gray-600 break-words">{clientAddress}</p>
          </div>

          {/* Invoice Details */}
          <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            <div className="bg-purple-100 p-4">
              <div className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-5'} font-semibold text-purple-700`}>
                <div className={isMobile ? 'col-span-1' : 'col-span-2'}>Item</div>
                <div className="text-right">Qty</div>
                {!isMobile && <div className="text-right">Rate</div>}
                <div className="text-right">Amount</div>
              </div>
            </div>
            <div className="p-4">
              {invoice.items.map((item, index) => (
                <div key={index} className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-5'} py-3 border-b last:border-0`}>
                  <div className={`${isMobile ? 'col-span-1' : 'col-span-2'} break-words`}>{item.description}</div>
                  <div className="text-right">{item.quantity}</div>
                  {!isMobile && <div className="text-right">{formatCurrency(item.rate, invoice.currency)}</div>}
                  <div className="text-right">{formatCurrency(item.quantity * item.rate, invoice.currency)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className={`${isMobile ? 'w-full' : 'w-1/3'} bg-white p-4 rounded-lg shadow-sm`}>
              <div className="space-y-2">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Tax ({taxRate}%):</span>
                  <span>{formatCurrency(tax, invoice.currency)}</span>
                </div>
                {invoice.additionalCharges > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Additional Charges:</span>
                    <span>{formatCurrency(invoice.additionalCharges, invoice.currency)}</span>
                  </div>
                )}
                {invoice.discount > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Discount:</span>
                    <span>-{formatCurrency(invoice.discount, invoice.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 font-bold text-purple-600">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-purple-600 mb-2">Notes:</h2>
              <p className="text-gray-600 whitespace-pre-wrap notes-section break-words">{invoice.notes}</p>
            </div>
          )}
          
          {/* Terms */}
          {invoice.terms && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-purple-600 mb-2">Terms:</h2>
              <p className="text-gray-600 whitespace-pre-wrap notes-section break-words">{invoice.terms}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernTemplate;
