
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import InvoiceForm from "@/components/invoice/InvoiceForm";
import { Invoice } from "@/types";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const EditInvoicePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoice, updateInvoice, customers, isLoadingCustomers, businessProfile } = useAppContext();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getInvoice(id)
      .then((invoiceFound) => {
        if (!invoiceFound) {
          setError("Invoice not found");
        } else {
          setInvoice(invoiceFound);
          
          // Ensure the document is ready for PDF generation
          document.documentElement.classList.add('pdf-ready');
          
          // Add specific styles for PDF rendering if needed
          const styleEl = document.createElement('style');
          styleEl.id = 'pdf-styles';
          styleEl.textContent = `
            @media print, (min-resolution: 300dpi) {
              .notes-section, [data-section="notes"] {
                font-weight: 500 !important;
                font-size: 12px !important;
                color: black !important;
              }
              .notes-section *, [data-section="notes"] * {
                font-weight: 500 !important;
                font-size: 12px !important;
                color: black !important;
              }
              /* Additional styles for better PDF rendering */
              h3, h4, h5, h6 {
                font-weight: 600 !important;
                color: black !important;
              }
              p, div, span {
                color: black !important;
                line-height: 1.5 !important;
              }
            }
          `;
          
          if (!document.getElementById('pdf-styles')) {
            document.head.appendChild(styleEl);
          }
        }
      })
      .catch(() => setError("Error loading invoice"))
      .finally(() => setLoading(false));
      
    // Clean up PDF-specific styling on unmount
    return () => {
      document.documentElement.classList.remove('pdf-ready');
      const styleEl = document.getElementById('pdf-styles');
      if (styleEl) {
        document.head.removeChild(styleEl);
      }
    };
  }, [id, getInvoice]);

  const handleSave = async (
    values: any,
    items: any,
    total: number,
    subtotal: number,
    taxAmount: number,
    additionalCharges: number,
    discount: number
  ) => {
    if (!invoice) return;
    try {
      await updateInvoice({
        ...invoice,
        ...values,
        items,
        subtotal,
        taxAmount,
        total,
        additionalCharges,
        discount
      });
      navigate("/invoices");
    } catch (e: any) {
      setError(e?.message || "Error updating invoice");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading invoice...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-destructive font-semibold">{error}</div>
        <Button variant="secondary" onClick={() => navigate("/invoices")}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <InvoiceForm
      mode="edit"
      initialValues={invoice}
      customers={customers}
      businessProfile={businessProfile}
      isLoadingCustomers={isLoadingCustomers}
      onSubmit={handleSave}
      onCancel={() => navigate("/invoices")}
    />
  );
};

export default EditInvoicePage;
