import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentHistory } from '@/components/payment/PaymentHistory';
import { PaymentForm } from '@/components/payment/PaymentForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import { Payment, EnhancedInvoice, CreatePaymentRequest } from '@/types/payment';
import { Invoice } from '@/types';

export default function PaymentsPage() {
  const [unpaidInvoices, setUnpaidInvoices] = useState<EnhancedInvoice[]>([]);
  const [showQuickPayment, setShowQuickPayment] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<EnhancedInvoice | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    payments,
    isLoadingPayments,
    invoices,
    createPayment,
    refreshPayments,
    refreshInvoices,
    getInvoicesWithBalance
  } = useAppContext();

  // Fetch unpaid invoices for payment processing
  const fetchUnpaidInvoices = async () => {
    try {
      console.log('Fetching unpaid invoices...');
      const unpaid = await getInvoicesWithBalance();
      console.log('Fetched unpaid invoices:', unpaid);
      console.log('Number of unpaid invoices:', unpaid.length);
      setUnpaidInvoices(unpaid);
    } catch (error) {
      console.error('Error fetching unpaid invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices for payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUnpaidInvoices();
  }, []);

  useEffect(() => {
    console.log('selectedInvoice state changed to:', selectedInvoice);
  }, [selectedInvoice]);

  const handleCreatePayment = async (paymentData: CreatePaymentRequest) => {
    try {
      await createPayment(paymentData);
      
      // Refresh unpaid invoices after payment
      await fetchUnpaidInvoices();
      
      // Close the payment dialog and reset selection
      setShowQuickPayment(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Error creating payment:', error);
    }
  };

  const handleViewReceipt = (paymentId: string) => {
    navigate(`/receipts/${paymentId}`);
  };

  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      // Simulate receipt download
      toast({
        title: "Success",
        description: "Receipt downloaded successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download receipt",
        variant: "destructive"
      });
    }
  };

  const handleResendReceipt = async (paymentId: string) => {
    try {
      // Simulate receipt resend
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: "Success",
        description: "Receipt email sent successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send receipt email",
        variant: "destructive"
      });
    }
  };

  const handleExportPayments = async () => {
    try {
      // TODO: Implement actual export functionality
      toast({
        title: "Success",
        description: "Payment report exported successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export payment report",
        variant: "destructive"
      });
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      refreshPayments(),
      fetchUnpaidInvoices()
    ]);
  };

  if (isLoadingPayments) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-muted-foreground">
            Track and manage customer payments
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoadingPayments}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingPayments ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExportPayments}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          
          <Button
            onClick={() => setShowQuickPayment(true)}
            disabled={unpaidInvoices.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Quick Payment Alert */}
      {unpaidInvoices.length > 0 && (
        <Alert>
          <AlertDescription>
            You have {unpaidInvoices.length} invoice{unpaidInvoices.length > 1 ? 's' : ''} with outstanding payments. 
            <Button 
              variant="link" 
              className="p-0 h-auto ml-1"
              onClick={() => setShowQuickPayment(true)}
            >
              Record a payment →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Payment History Component */}
      <PaymentHistory
        payments={payments}
        invoices={invoices}
        isLoading={isLoadingPayments}
        onViewReceipt={handleViewReceipt}
        onDownloadReceipt={handleDownloadReceipt}
        onResendReceipt={handleResendReceipt}
      />

      {/* Quick Payment Dialog */}
      <Dialog open={showQuickPayment} onOpenChange={setShowQuickPayment}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          
          {unpaidInvoices.length === 0 ? (
            <Alert>
              <AlertDescription>
                {isLoadingPayments ? 
                  "Loading unpaid invoices..." : 
                  "No unpaid invoices found. All invoices have been paid in full."
                }
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {/* Invoice Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold">Select Invoice</h3>
                <div className="grid gap-3">
                  {unpaidInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedInvoice?.id === invoice.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        console.log('Invoice clicked:', invoice);
                        console.log('Setting selectedInvoice to:', invoice);
                        setSelectedInvoice(invoice);
                        console.log('selectedInvoice state should now be:', invoice);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            #{invoice.invoiceNumber || invoice.id?.slice(-8) || 'N/A'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {invoice.customer?.name || invoice.customerName || 'Unknown Customer'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ${(invoice.balanceDue || 0).toFixed(2)} due
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Total: ${(invoice.total || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Form */}
              {console.log('PaymentForm conditional check - selectedInvoice:', selectedInvoice)}
              {console.log('PaymentForm conditional check - !!selectedInvoice:', !!selectedInvoice)}
              {selectedInvoice && (
                <>
                  {console.log('Rendering PaymentForm with selectedInvoice:', selectedInvoice)}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">Payment Details</h3>
                    <PaymentForm
                      invoice={selectedInvoice}
                      onSubmit={handleCreatePayment}
                      onCancel={() => {
                        setShowQuickPayment(false);
                        setSelectedInvoice(null);
                      }}
                      isLoading={isLoadingPayments}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}