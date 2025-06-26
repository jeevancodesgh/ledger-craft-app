
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import InvoiceForm from "@/components/invoice/InvoiceForm";
import { Invoice, Item } from "@/types";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/invoiceUtils";

const EditInvoicePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoice, updateInvoice, customers, isLoadingCustomers, businessProfile, items, isLoadingItems } = useAppContext();
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
          // Set title for print support - will appear in the print dialog/print output
          document.title = `Invoice ${invoiceFound.invoiceNumber}`;
        }
      })
      .catch(() => setError("Error loading invoice"))
      .finally(() => setLoading(false));
      
    // Cleanup on unmount
    return () => {
      document.title = "Invoice App"; // Reset title
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
        date: formatDate(values.date),
        dueDate: formatDate(values.dueDate),
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

  if (loading || isLoadingItems) {
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
      availableItems={items}
    />
  );
};

export default EditInvoicePage;
