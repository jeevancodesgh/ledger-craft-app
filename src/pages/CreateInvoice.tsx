
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import InvoiceForm from "@/components/invoice/InvoiceForm";

const CreateInvoice = () => {
  const { customers, isLoadingCustomers, createInvoice, businessProfile } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (
    values: any,
    items: any,
    total: number,
    subtotal: number,
    taxAmount: number,
    additionalCharges: number,
    discount: number
  ) => {
    try {
      await createInvoice({
        invoiceNumber: values.invoiceNumber,
        customerId: values.customerId,
        date: values.date.toISOString().split('T')[0],
        dueDate: values.dueDate.toISOString().split('T')[0],
        items: items,
        subtotal: subtotal,
        taxAmount: taxAmount,
        total: total,
        status: 'draft',
        currency: values.currency,
        notes: values.notes,
        terms: values.terms,
        additionalCharges: additionalCharges,
        discount: discount,
      });
      navigate('/invoices');
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  return (
    <InvoiceForm
      mode="create"
      customers={customers}
      businessProfile={businessProfile}
      isLoadingCustomers={isLoadingCustomers}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/invoices')}
    />
  );
};

export default CreateInvoice;
