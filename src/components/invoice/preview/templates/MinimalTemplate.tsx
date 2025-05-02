
import React from 'react';
import { Invoice } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from '@/utils/invoiceUtils';

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
  return (
    <Card className="p-8 bg-white">
      <CardContent>
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            {businessLogo && (
              <div className="flex justify-center mb-4">
                <img 
                  src={businessLogo} 
                  alt={companyName} 
                  className="max-h-16 object-contain"
                />
              </div>
            )}
            <h1 className="text-2xl font-light tracking-wide">INVOICE</h1>
            <p className="text-gray-500 mt-2">#{invoice.invoiceNumber}</p>
          </div>

          {/* Company and Client Info */}
          <div className="flex justify-between text-sm">
            <div>
              <p className="font-medium mb-1">{companyName}</p>
              <p className="text-gray-600">{companyAddress}</p>
            </div>
            <div className="text-right">
              <p className="font-medium mb-1">{clientName}</p>
              <p className="text-gray-600">{clientAddress}</p>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="mt-12">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left font-normal">Description</th>
                  <th className="py-2 text-right font-normal">Quantity</th>
                  <th className="py-2 text-right font-normal">Rate</th>
                  <th className="py-2 text-right font-normal">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="py-3">{item.description}</td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right">{formatCurrency(item.rate)}</td>
                    <td className="py-3 text-right">{formatCurrency(item.quantity * item.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-8">
            <div className="flex flex-col items-end space-y-2">
              <div className="flex justify-between w-48">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between w-48">
                <span className="text-gray-600">Tax ({taxRate}%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between w-48 font-medium border-t pt-2 mt-2">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-12 pt-6 border-t text-sm">
              <h2 className="font-medium mb-2">Notes</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MinimalTemplate;
