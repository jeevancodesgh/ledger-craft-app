
import React from 'react';
import { Invoice } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from '@/utils/invoiceUtils';

interface ModernTemplateProps {
  invoice: Invoice;
  companyName: string;
  companyAddress: string;
  clientName: string;
  clientAddress: string;
  taxRate: string;
  tax: number;
}

const ModernTemplate = ({ 
  invoice, 
  companyName, 
  companyAddress, 
  clientName, 
  clientAddress, 
  taxRate, 
  tax 
}: ModernTemplateProps) => {
  return (
    <Card className="p-8 bg-gradient-to-br from-purple-50 to-white">
      <CardContent>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-purple-600">INVOICE</h1>
              <p className="text-gray-500 mt-1">#{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right bg-purple-100 p-4 rounded-lg">
              <p className="font-bold text-lg">{companyName}</p>
              <p className="text-gray-600 mt-1">{companyAddress}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-purple-600 mb-2">Bill To:</h2>
            <p className="text-gray-800 font-medium">{clientName}</p>
            <p className="text-gray-600">{clientAddress}</p>
          </div>

          {/* Invoice Details */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-purple-100 p-4">
              <div className="grid grid-cols-5 font-semibold text-purple-700">
                <div className="col-span-2">Item</div>
                <div className="text-right">Quantity</div>
                <div className="text-right">Rate</div>
                <div className="text-right">Amount</div>
              </div>
            </div>
            <div className="p-4">
              {invoice.items.map((item, index) => (
                <div key={index} className="grid grid-cols-5 py-3 border-b last:border-0">
                  <div className="col-span-2">{item.description}</div>
                  <div className="text-right">{item.quantity}</div>
                  <div className="text-right">{formatCurrency(item.rate)}</div>
                  <div className="text-right">{formatCurrency(item.quantity * item.rate)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-1/3 bg-white p-4 rounded-lg shadow-sm">
              <div className="space-y-2">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Tax ({taxRate}%):</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-purple-600">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-purple-600 mb-2">Notes:</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernTemplate;
