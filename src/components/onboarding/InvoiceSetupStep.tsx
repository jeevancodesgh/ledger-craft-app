import React from 'react';
import { FileText, Percent, MapPin, ArrowLeft } from 'lucide-react';
import { OnboardingStepProps } from '../../types';

const invoiceFormats = [
  { value: 'INV-{YYYY}-{SEQ}', label: 'INV-2024-001', description: 'Year with sequence number' },
  { value: 'INV-{MM}-{YYYY}-{SEQ}', label: 'INV-03-2024-001', description: 'Month and year with sequence' },
  { value: '{YYYY}{MM}{DD}-{SEQ}', label: '20240315-001', description: 'Date-based numbering' },
  { value: 'INV-{SEQ}', label: 'INV-001', description: 'Simple sequence numbering' },
];

export default function InvoiceSetupStep({ data, onDataChange, onNext, onBack, isLoading }: OnboardingStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <p className="text-muted-foreground">
          Set up your invoice preferences to ensure professional, consistent billing.
        </p>
      </div>

      <div className="space-y-6">
        {/* Invoice Number Format */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Invoice Number Format
          </label>
          <div className="space-y-3">
            {invoiceFormats.map((format) => (
              <label key={format.value} className="flex items-center p-3 border border-border rounded-md hover:bg-muted/50 cursor-pointer">
                <input
                  type="radio"
                  name="invoiceFormat"
                  value={format.value}
                  checked={data.invoiceNumberFormat === format.value}
                  onChange={(e) => onDataChange({ invoiceNumberFormat: e.target.value })}
                  className="h-4 w-4 text-primary focus:ring-primary"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{format.label}</span>
                    <span className="text-xs text-muted-foreground">{format.description}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {!data.invoiceNumberFormat && (
            <p className="text-sm text-muted-foreground mt-2">
              Choose a format for your invoice numbers. This will be used for all future invoices.
            </p>
          )}
        </div>

        {/* Default Tax Rate */}
        <div>
          <label htmlFor="defaultTaxRate" className="block text-sm font-medium text-foreground mb-2">
            Default Tax Rate (%)
          </label>
          <div className="relative">
            <Percent className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <input
              type="number"
              id="defaultTaxRate"
              value={data.defaultTaxRate || ''}
              onChange={(e) => onDataChange({ defaultTaxRate: e.target.value ? parseFloat(e.target.value) : undefined })}
              className="block w-full pl-10 pr-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
              placeholder="15.0"
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            This will be pre-filled for new invoices. You can always change it per invoice.
          </p>
        </div>

        {/* Business Address Section */}
        <div className="border-t pt-6">
          <div className="flex items-center mb-4">
            <MapPin className="h-5 w-5 text-muted-foreground mr-2" />
            <h3 className="text-lg font-medium text-foreground">Business Address</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Adding your business address makes your invoices look more professional and builds trust with clients.
          </p>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Street Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-foreground mb-2">
                Street Address
              </label>
              <input
                type="text"
                id="address"
                value={data.address || ''}
                onChange={(e) => onDataChange({ address: e.target.value })}
                className="block w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                placeholder="123 Business Street"
              />
            </div>

            {/* City, State, ZIP */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-foreground mb-2">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  value={data.city || ''}
                  onChange={(e) => onDataChange({ city: e.target.value })}
                  className="block w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                  placeholder="Wellington"
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-foreground mb-2">
                  State/Region
                </label>
                <input
                  type="text"
                  id="state"
                  value={data.state || ''}
                  onChange={(e) => onDataChange({ state: e.target.value })}
                  className="block w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                  placeholder="Wellington"
                />
              </div>
              <div>
                <label htmlFor="zip" className="block text-sm font-medium text-foreground mb-2">
                  ZIP/Postal Code
                </label>
                <input
                  type="text"
                  id="zip"
                  value={data.zip || ''}
                  onChange={(e) => onDataChange({ zip: e.target.value })}
                  className="block w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                  placeholder="6011"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-primary/10 border border-border rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-foreground">
              Pro Tip: Invoice Best Practices
            </h3>
            <div className="mt-2 text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>Consistent invoice numbering helps with organization and tracking</li>
                <li>Including your business address adds credibility and professionalism</li>
                <li>Default tax rates save time when creating new invoices</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </form>
  );
}