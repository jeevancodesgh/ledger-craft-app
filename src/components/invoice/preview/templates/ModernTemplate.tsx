
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
  
  // Parse the client address into components
  const addressParts = clientAddress.split(',').map(part => part.trim());
  const country = addressParts.length > 0 ? addressParts[addressParts.length - 1] : '';
  
  // Parse the company address
  const companyAddressParts = companyAddress.split(',').map(part => part.trim());
  const companyCountry = companyAddressParts.length > 0 ? companyAddressParts[companyAddressParts.length - 1] : '';
  
  return (
    <div className="w-full print-template">
      {/* Header with Invoice Title */}
      <div className="p-3 sm:p-4">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Invoice</h3>
      </div>
      
      {/* Company Header - Purple Background */}
      <div className="bg-[#55588b] text-white p-3 sm:p-4 rounded-lg mb-4 flex flex-wrap">
        <div className="w-1/2">
          {businessLogo && (
            <img 
              src={businessLogo} 
              alt={companyName}
              className="h-16 w-16 object-cover rounded-full mb-2"
            />
          )}
        </div>
        <div className="w-1/2 text-right">
          <p className="font-semibold text-sm sm:text-base">{companyName}</p>
          <p className="text-xs sm:text-sm">{companyAddressParts.join(', ')}</p>
          {invoice.customer?.email && (
            <p className="text-xs mt-1">{invoice.customer.email}</p>
          )}
        </div>
      </div>
      
      {/* Client and Invoice Info */}
      <div className="flex flex-wrap mb-4">
        {/* Bill To Section */}
        <div className="w-1/2 pr-2">
          <p className="font-semibold text-sm sm:text-base mb-1">Bill To</p>
          <p className="text-sm font-medium">{clientName}</p>
          <p className="text-xs sm:text-sm">{addressParts.join(', ')}</p>
          {invoice.customer?.phone && (
            <p className="text-xs sm:text-sm">{invoice.customer.phone}</p>
          )}
          {invoice.customer?.email && (
            <p className="text-xs sm:text-sm">{invoice.customer.email}</p>
          )}
        </div>
        
        {/* Invoice Details */}
        <div className="w-1/2">
          <div className="text-xs sm:text-sm">
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Invoice Number:</span>
              <span>{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Invoice Date:</span>
              <span>{new Date(invoice.date).toLocaleDateString('en-US', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric'
              })}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Due Date:</span>
              <span>{new Date(invoice.dueDate).toLocaleDateString('en-US', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric'
              })}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Items Table */}
      <div className="w-full overflow-hidden rounded-lg mb-4">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="bg-[#55588b] text-white">
              <th className="py-2 px-2 text-left">Items</th>
              <th className="py-2 px-1 text-right">Quantity</th>
              <th className="py-2 px-1 text-right">Price</th>
              <th className="py-2 px-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="py-2 px-2 text-left">
                  {item.description}
                  {/* Only render details section if it exists as a property in the item */}
                  {(item as any).details && (
                    <div className="text-xs text-gray-500 break-words">
                      {(item as any).details}
                    </div>
                  )}
                </td>
                <td className="py-2 px-1 text-right">{item.quantity}</td>
                <td className="py-2 px-1 text-right">{formatCurrency(item.rate, invoice.currency)}</td>
                <td className="py-2 px-2 text-right">{formatCurrency(item.quantity * item.rate, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Totals */}
      <div className="flex justify-end mt-4">
        <div className="w-full sm:w-1/2 text-xs sm:text-sm">
          <div className="flex justify-between py-1">
            <span className="font-semibold">Subtotal:</span>
            <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          
          {tax > 0 && (
            <div className="flex justify-between py-1">
              <span className="font-semibold">Tax ({taxRate}%):</span>
              <span>{formatCurrency(tax, invoice.currency)}</span>
            </div>
          )}
          
          {invoice.additionalCharges > 0 && (
            <div className="flex justify-between py-1">
              <span className="font-semibold">Additional Charges:</span>
              <span>{formatCurrency(invoice.additionalCharges, invoice.currency)}</span>
            </div>
          )}
          
          {invoice.discount > 0 && (
            <div className="flex justify-between py-1">
              <span className="font-semibold">Discount:</span>
              <span>-{formatCurrency(invoice.discount, invoice.currency)}</span>
            </div>
          )}
          
          <div className="flex justify-between py-1 font-bold">
            <span>Total:</span>
            <span>{formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>
      </div>
      
      {/* Notes */}
      {invoice.notes && (
        <div className="mt-4">
          <h4 className="font-semibold text-sm mb-1">Notes:</h4>
          <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{invoice.notes}</p>
        </div>
      )}
      
      {/* Terms */}
      {invoice.terms && (
        <div className="mt-4">
          <h4 className="font-semibold text-sm mb-1">Terms:</h4>
          <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{invoice.terms}</p>
        </div>
      )}
    </div>
  );
};

export default ModernTemplate;
