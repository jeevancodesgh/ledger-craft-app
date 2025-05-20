import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import InvoicePreview from '@/components/invoice/preview/InvoicePreview';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const PublicInvoice = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select(`*, customers(*), line_items:line_items(*)`)
          .eq('id', invoiceId)
          .single();
        if (error || !data) {
          setError('Invoice not found');
          setLoading(false);
          return;
        }
        setInvoice(data);
        // Update public_viewed_at if not already set
        if (!data.public_viewed_at) {
          await supabase
            .from('invoices')
            .update({ public_viewed_at: new Date().toISOString() })
            .eq('id', invoiceId);
        }
      } catch (e) {
        setError('Error loading invoice');
      } finally {
        setLoading(false);
      }
    };
    if (invoiceId) fetchInvoice();
  }, [invoiceId]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading invoice...</div>;
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <div>{error}</div>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <InvoicePreview invoice={invoice} selectedTemplate="classic" />
    </div>
  );
};

export default PublicInvoice; 