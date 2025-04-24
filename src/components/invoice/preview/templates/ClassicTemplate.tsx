
import React from 'react';
import { Invoice } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from '@/utils/invoiceUtils';

interface ClassicTemplateProps {
  invoice: Invoice;
}

const ClassicTemplate = ({ invoice }: ClassicTemplateProps) => {
  return (
    <Card className="p-8 bg-white">
      <CardContent>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between">
            <div>
              <h1 className="text-2xl font-bold">INVOICE</h1>
              <p className="text-gray-600">#{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{invoice.companyName}</p>
              <p className="text-gray-600">{invoice.companyAddress}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2">Bill To:</h2>
            <p>{invoice.clientName}</p>
            <p>{invoice.clientAddress}</p>
          </div>

          {/* Invoice Details */}
          <div className="mt-8">
            <div className="border-t border-b py-2">
              <div className="grid grid-cols-5 font-semibold">
                <div className="col-span-2">Item</div>
                <div className="text-right">Quantity</div>
                <div className="text-right">Rate</div>
                <div className="text-right">Amount</div>
              </div>
            </div>
            <div className="py-4">
              {invoice.items.map((item, index) => (
                <div key={index} className="grid grid-cols-5 py-2">
                  <div className="col-span-2">{item.description}</div>
                  <div className="text-right">{item.quantity}</div>
                  <div className="text-right">{formatCurrency(item.rate)}</div>
                  <div className="text-right">{formatCurrency(item.quantity * item.rate)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="mt-8">
            <div className="flex justify-end">
              <div className="w-1/3">
                <div className="flex justify-between py-2">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Tax ({invoice.taxRate}%):</span>
                  <span>{formatCurrency(invoice.tax)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 pt-4 border-t">
              <h2 className="text-lg font-semibold mb-2">Notes:</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassicTemplate;
