import React from 'react';
import { Building2, Mail, Globe } from 'lucide-react';
import { OnboardingStepProps } from '../../types';

const countries = [
  'New Zealand', 'Australia', 'United States', 'United Kingdom', 'Canada', 
  'Germany', 'France', 'Japan', 'Singapore', 'India', 'Other'
];

export default function WelcomeStep({ data, onDataChange, onNext, isLoading }: OnboardingStepProps) {
  const isValid = data.businessName.trim() && data.businessEmail.trim() && data.country;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="h-8 w-8 text-blue-600" />
        </div>
        <p className="text-gray-600">
          Tell us about your business so we can customize your invoice templates and settings.
        </p>
      </div>

      <div className="space-y-4">
        {/* Business Name */}
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
            Business Name *
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              id="businessName"
              value={data.businessName}
              onChange={(e) => onDataChange({ businessName: e.target.value })}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your business name"
              required
            />
          </div>
        </div>

        {/* Business Email */}
        <div>
          <label htmlFor="businessEmail" className="block text-sm font-medium text-gray-700 mb-2">
            Business Email *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="email"
              id="businessEmail"
              value={data.businessEmail}
              onChange={(e) => onDataChange({ businessEmail: e.target.value })}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your business email"
              required
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            This will appear on your invoices and be used for notifications.
          </p>
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
            Country *
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              id="country"
              value={data.country}
              onChange={(e) => onDataChange({ country: e.target.value })}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              required
            >
              <option value="">Select your country</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Building2 className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Why do we need this information?
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Your business name and email will appear on all invoices</li>
                <li>Country helps us set appropriate tax and currency defaults</li>
                <li>This ensures your invoices look professional from day one</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </form>
  );
}