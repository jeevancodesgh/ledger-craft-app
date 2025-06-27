import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { sharedInvoiceService } from '@/services/supabaseService';
import { Invoice, BusinessProfile } from '@/types';
import { generateInvoicePdf } from '@/utils/pdfUtils';
import { useToast } from '@/hooks/use-toast';

// Import template components
import ClassicTemplate from '@/components/invoice/preview/templates/ClassicTemplate';
import ModernTemplate from '@/components/invoice/preview/templates/ModernTemplate';
import MinimalTemplate from '@/components/invoice/preview/templates/MinimalTemplate';
import ExecutiveTemplate from '@/components/invoice/preview/templates/ExecutiveTemplate';
import CorporateTemplate from '@/components/invoice/preview/templates/CorporateTemplate';
import ModernInvoiceTemplate from '@/components/invoice/preview/templates/ModernInvoiceTemplate';

const SharedInvoice: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [templateName, setTemplateName] = useState<string>('classic');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchSharedInvoice = async () => {
      if (!shareToken) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const result = await sharedInvoiceService.getSharedInvoiceByToken(shareToken);
        
        if (!result) {
          setError('Invoice not found or link has expired');
          setLoading(false);
          return;
        }

        
        setInvoiceData(result.invoiceData);
        setBusinessProfile(result.templateData.businessProfile);
        setTemplateName(result.templateData.templateName || 'classic');
        setLoading(false);
      } catch (err) {
        console.error('Error fetching shared invoice:', err);
        setError('Failed to load invoice');
        setLoading(false);
      }
    };

    fetchSharedInvoice();
  }, [shareToken]);

  const handleDownloadPdf = async () => {
    if (!invoiceData || !businessProfile) return;

    setIsDownloading(true);
    try {
      await generateInvoicePdf(invoiceData, businessProfile, templateName as any);
      toast({
        title: 'PDF downloaded',
        description: 'Invoice PDF has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const renderTemplate = () => {
    if (!invoiceData || !businessProfile) return null;

    // Create template data in the same format as InvoicePreview
    const templateData = {
      invoice: invoiceData,
      companyName: businessProfile?.name || 'Business Name',
      companyAddress: [
        businessProfile?.address,
        businessProfile?.city,
        businessProfile?.state,
        businessProfile?.zip,
        businessProfile?.country
      ].filter(Boolean).join(', ') || '',
      companyPhone: businessProfile?.phone || '',
      clientName: invoiceData.customer?.name || 'Client Name',
      clientAddress: [
        invoiceData.customer?.address,
        invoiceData.customer?.city,
        invoiceData.customer?.state,
        invoiceData.customer?.zip,
        invoiceData.customer?.country
      ].filter(Boolean).join(', ') || '',
      taxRate: '0%', // You might want to calculate this from invoice data
      tax: invoiceData.taxAmount || 0,
      businessLogo: businessProfile?.logoUrl,
      theme: businessProfile?.theme || {
        primary: '#3B82F6',
        secondary: '#06B6D4',
        accent: '#10B981',
        text: '#111827',
        textLight: '#6B7280',
        background: '#F9FAFB',
        surface: '#FFFFFF'
      }
    };


    switch (templateName.toLowerCase()) {
      case 'modern':
        return <ModernTemplate {...templateData} />;
      case 'minimal':
        return <MinimalTemplate {...templateData} />;
      case 'executive':
        return <ExecutiveTemplate {...templateData} />;
      case 'corporate':
        return <CorporateTemplate {...templateData} />;
      case 'modernpro':
        return <ModernInvoiceTemplate {...templateData} />;
      case 'classic':
      default:
        return <ClassicTemplate {...templateData} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-red-100 rounded-full p-3 w-fit">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">Invoice Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-500">
              This link may have expired or been deactivated. Please request a new link from the sender.
            </p>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Invoice {invoiceData?.invoiceNumber}
                </h1>
                <p className="text-sm text-gray-500">
                  From {businessProfile?.name || 'Business'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="flex items-center space-x-2"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 md:p-8">
            {renderTemplate()}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            This invoice was shared securely. 
            {businessProfile?.name && (
              <> View more from {businessProfile.name}.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharedInvoice;