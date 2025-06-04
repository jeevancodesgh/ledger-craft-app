import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import InvoiceForm from "@/components/invoice/InvoiceForm";
import { generateNextInvoiceNumber } from '@/utils/invoiceUtils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '@/types';
import CustomerFormDrawer, { CustomerFormValues } from '@/components/customer/CustomerFormDrawer';

const CreateInvoice = () => {
  const { 
    customers, 
    isLoadingCustomers, 
    createInvoice, 
    businessProfile, 
    createCustomer, 
    items, 
    isLoadingItems
  } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newlyAddedCustomer, setNewlyAddedCustomer] = useState<Customer | null>(null);
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState(false);

  const defaultInvoiceNumber = generateNextInvoiceNumber(
    businessProfile?.invoiceNumberFormat,
    businessProfile?.invoiceNumberSequence
  );

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
      console.log("Attempting to create invoice with data:", {
        invoiceNumber: values.invoiceNumber || defaultInvoiceNumber,
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
      await createInvoice({
        invoiceNumber: values.invoiceNumber || defaultInvoiceNumber,
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
      toast({
        title: "Invoice Created",
        description: "Your invoice has been successfully created."
      });
      navigate('/invoices');
    } catch (error) {
      console.error('Error caught during invoice creation submission:', error);
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddCustomer = async (values: CustomerFormValues) => {
    try {
      const newCustomerData = {
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        address: values.address || null,
        city: values.city || null,
        state: values.state || null,
        zip: values.zip || null,
        country: values.country || 'USA',
        isVip: values.is_vip
      };

      const newCustomer = await createCustomer(newCustomerData);

      toast({
        title: 'Customer added successfully',
        description: `${newCustomer.name} has been added to your customers.`
      });

      setNewlyAddedCustomer(newCustomer);
      setIsCustomerDrawerOpen(false);

    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to add customer. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <>
      <InvoiceForm
        mode="create"
        customers={customers}
        businessProfile={businessProfile}
        isLoadingCustomers={isLoadingCustomers}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/invoices')}
        onAddCustomer={() => setIsCustomerDrawerOpen(true)}
        newlyAddedCustomer={newlyAddedCustomer}
        defaultValues={{
          invoiceNumber: defaultInvoiceNumber,
        }}
        availableItems={items}
        isLoadingItems={isLoadingItems}
      />

      <CustomerFormDrawer
        open={isCustomerDrawerOpen}
        onOpenChange={setIsCustomerDrawerOpen}
        initialValues={null}
        onSubmit={handleAddCustomer}
      />
    </>
  );
};

export default CreateInvoice;
