
import React from 'react';
import { formatCurrency } from '@/utils/invoiceUtils';
import { Invoice, LineItem } from '@/types';
import { PDFCard, PDFCardContent } from '@/components/ui/card';

interface ExecutiveTemplateProps {
  invoice: Invoice;
  companyName: string;
  companyAddress: string;
  clientName: string;
  clientAddress: string;
  taxRate: string;
  tax: number;
}

const ExecutiveTemplate = ({
  invoice,
  companyName,
  companyAddress,
  clientName,
  clientAddress,
  taxRate
}: ExecutiveTemplateProps) => {
  return (
    <div className="bg-white text-gray-800 p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b-2 border-gray-200 pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-light tracking-wider text-gray-700 mb-1">INVOICE</h1>
            <p className="text-lg font-semibold text-[#8B5CF6]">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">{companyName}</h2>
            <p className="text-gray-600 whitespace-pre-line">{companyAddress}</p>
          </div>
        </div>
      </div>

      {/* Client & Invoice Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">Billed To</h3>
          <h4 className="text-lg font-bold mb-1">{clientName}</h4>
          <p className="text-gray-600 whitespace-pre-line">{clientAddress}</p>
        </div>
        <div className="text-right">
          <div className="mb-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-1">Invoice Date</p>
            <p className="text-lg">{new Date(invoice.date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-1">Due Date</p>
            <p className="text-lg">{new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <PDFCard className="mb-8">
        <PDFCardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-gray-600">Description</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-gray-600">Quantity</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-gray-600">Unit</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-gray-600">Rate</th>
                <th className="py-4 px-6 font-semibold uppercase tracking-wider text-xs text-gray-600 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: LineItem, index: number) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-3 px-6 border-t border-gray-200">{item.description}</td>
                  <td className="py-3 px-6 border-t border-gray-200">{item.quantity}</td>
                  <td className="py-3 px-6 border-t border-gray-200">{item.unit}</td>
                  <td className="py-3 px-6 border-t border-gray-200">{formatCurrency(item.rate, invoice.currency)}</td>
                  <td className="py-3 px-6 border-t border-gray-200 text-right">{formatCurrency(item.total, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PDFCardContent>
      </PDFCard>

      {/* Summary */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2">
            <span className="font-medium">Subtotal:</span>
            <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="font-medium">Tax ({taxRate}%):</span>
            <span>{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
          </div>
          {invoice.discount && invoice.discount > 0 && (
            <div className="flex justify-between py-2">
              <span className="font-medium">Discount:</span>
              <span>-{formatCurrency(invoice.discount, invoice.currency)}</span>
            </div>
          )}
          <div className="flex justify-between py-3 border-t-2 border-gray-300 mt-1">
            <span className="text-lg font-bold">Total:</span>
            <span className="text-lg font-bold text-[#8B5CF6]">{formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>
      </div>
      
      {/* Notes & Terms */}
      {(invoice.notes || invoice.terms) && (
        <div className="grid grid-cols-2 gap-8 mt-6 border-t border-gray-200 pt-6">
          {invoice.notes && (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">Notes</h4>
              <p className="text-gray-600 whitespace-pre-line notes-section">{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">Terms & Conditions</h4>
              <p className="text-gray-600 whitespace-pre-line">{invoice.terms}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Footer */}
      <div className="border-t border-gray-200 mt-8 pt-6 text-center text-gray-500 text-sm">
        <p>Thank you for your business</p>
      </div>
    </div>
  );
};

export default ExecutiveTemplate;
