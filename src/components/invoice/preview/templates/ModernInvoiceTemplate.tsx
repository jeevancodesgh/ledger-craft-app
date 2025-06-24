import React from 'react';
import { formatCurrency } from '@/utils/invoiceUtils';
import { Invoice, LineItem } from '@/types';
import { PDFCard, PDFCardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

interface ModernInvoiceTemplateProps {
  invoice: Invoice;
  companyName: string;
  companyAddress: string;
  clientName: string;
  clientAddress: string;
  taxRate: string;
  tax: number;
  businessLogo?: string;
}

const ModernInvoiceTemplate = ({
  invoice,
  companyName,
  companyAddress,
  clientName,
  clientAddress,
  taxRate,
  tax,
  businessLogo
}: ModernInvoiceTemplateProps) => {
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

  // Status color
  const getStatusColor = () => {
    switch (invoice.status) {
      case 'paid': return 'bg-green-50 text-green-700 border-green-300';
      case 'overdue': return 'bg-red-50 text-red-700 border-red-300';
      case 'sent': return 'bg-blue-50 text-blue-700 border-blue-300';
      default: return 'bg-gray-50 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white min-h-screen p-4 sm:p-10 flex justify-center items-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-8 py-8 bg-gradient-to-r from-blue-600 to-cyan-400 text-white">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {businessLogo && (
              <img src={businessLogo} alt={companyName} className="h-16 w-16 object-contain rounded-xl bg-white bg-opacity-20 shadow-md" />
            )}
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{companyName}</h1>
              <p className="text-xs opacity-80 whitespace-pre-line">{companyAddress}</p>
            </div>
          </div>
          <div className="mt-6 sm:mt-0 text-right w-full sm:w-auto">
            {/* <span className={`inline-block px-4 py-1 rounded-full border font-semibold text-sm mb-2 ${getStatusColor()}`}>{invoice.status}</span> */}
            <div className="text-xs opacity-80">
              <span>Invoice #</span> <span className="font-bold">{invoice.invoiceNumber}</span>
            </div>
            <div className="text-xs opacity-80">
              <span>Date: </span>{new Date(invoice.date).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Client & Invoice Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 px-8 py-6 border-b border-gray-100 bg-white">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Billed To</h3>
            <div className="font-semibold text-lg text-gray-800">{clientName}</div>
            <div className="text-gray-500 text-xs whitespace-pre-line mb-1">{clientAddress}</div>
            {invoice.customer?.email && (
              <div className="text-xs text-gray-400">{invoice.customer.email}</div>
            )}
            {invoice.customer?.phone && (
              <div className="text-xs text-gray-400">{invoice.customer.phone}</div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <span className="text-xs text-gray-400 font-bold">Invoice Date: </span>
              <span className="text-sm font-medium text-gray-700">{new Date(invoice.date).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 font-bold">Due Date: </span>
              <span className="text-sm font-medium text-gray-700">{new Date(invoice.dueDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 font-bold">Currency: </span>
              <span className="text-sm font-medium text-gray-700">{invoice.currency}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="px-4 sm:px-8 py-6 bg-white">
          <div className="overflow-x-auto rounded-lg shadow-sm">
            <table className="w-full text-sm text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-cyan-50">
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs text-gray-500">Item</th>
                  <th className="px-2 py-3 font-bold uppercase tracking-wider text-xs text-gray-500">Qty</th>
                  <th className="px-2 py-3 font-bold uppercase tracking-wider text-xs text-gray-500">Rate</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs text-gray-500 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: LineItem, idx: number) => (
                  <tr key={item.id} className="bg-white shadow rounded-lg">
                    <td className="px-4 py-3 font-medium text-gray-800 align-top">
                      {item.description}
                      {(item as any).details && (
                        <div className="text-xs text-gray-400 mt-1">{(item as any).details}</div>
                      )}
                    </td>
                    <td className="px-2 py-3 text-gray-700 align-top">{item.quantity}</td>
                    <td className="px-2 py-3 text-gray-700 align-top">{formatCurrency(item.rate, invoice.currency)}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-semibold align-top">{formatCurrency(item.total || item.quantity * item.rate, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="flex flex-col items-end px-8 pb-6 bg-white">
          <div className="w-full sm:w-80 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 shadow border border-gray-100">
            <div className="flex justify-between py-1 text-sm">
              <span className="font-medium text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-800">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between py-1 text-sm">
              <span className="font-medium text-gray-600">Tax ({taxRate}%)</span>
              <span className="font-semibold text-gray-800">{formatCurrency(tax, invoice.currency)}</span>
            </div>
            {invoice.discount && invoice.discount > 0 && (
              <div className="flex justify-between py-1 text-sm">
                <span className="font-medium text-gray-600">Discount</span>
                <span className="text-red-500 font-semibold">-{formatCurrency(invoice.discount, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t border-gray-200 mt-2 text-lg">
              <span className="font-bold text-gray-700">Total</span>
              <span className="font-bold text-blue-600">{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 px-8 pb-8 bg-white">
            {invoice.notes && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Notes</h4>
                <p className="text-gray-600 text-xs whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Terms & Conditions</h4>
                <p className="text-gray-600 text-xs whitespace-pre-line">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-8 py-4 text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">Payment is due within {getDaysDifference(invoice.date, invoice.dueDate)} days of issue</p>
        </div>
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

export default ModernInvoiceTemplate; 