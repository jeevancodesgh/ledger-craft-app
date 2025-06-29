import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import InvoiceForm from "@/components/invoice/InvoiceForm";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '@/types';
import CustomerFormDrawer, { CustomerFormValues } from '@/components/customer/CustomerFormDrawer';
import { invoiceService } from '@/services/supabaseService';
import { useForm } from 'react-hook-form';
import { formatDate } from '@/utils/invoiceUtils';

const CreateInvoice = () => {
  const { 
    customers, 
    isLoadingCustomers, 
    createInvoice, 
    businessProfile, 
    createCustomer, 
    items, 
    isLoadingItems,
    refreshBusinessProfile
  } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newlyAddedCustomer, setNewlyAddedCustomer] = useState<Customer | null>(null);
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState(false);

  const [calculatedInvoiceNumber, setCalculatedInvoiceNumber] = useState<string | undefined>(undefined);
  const [isLoadingInvoiceNumber, setIsLoadingInvoiceNumber] = useState(true);

  const form = useForm<any>({
    defaultValues: {
      invoiceNumber: '',
      customerId: '',
      date: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      notes: "",
      terms: "",
      currency: "USD",
      additionalCharges: 0,
      discount: 0,
    },
  });

  useEffect(() => {
    const fetchAndCalculateInvoiceNumber = async () => {
      setIsLoadingInvoiceNumber(true);
      try {
        const nextGeneratedNumber = await invoiceService.getNextInvoiceNumber();
        setCalculatedInvoiceNumber(nextGeneratedNumber);
      } catch (error) {
        console.error('Error fetching/calculating invoice number from service:', error);
        toast({
          title: "Error",
          description: "Failed to generate invoice number. Please try again.",
          variant: "destructive",
        });
        setCalculatedInvoiceNumber(`INV-${Date.now()}`);
      } finally {
        setIsLoadingInvoiceNumber(false);
      }
    };

    const refreshBusinessSettings = async () => {
      try {
        await refreshBusinessProfile();
      } catch (error) {
        console.error('Error refreshing business profile:', error);
      }
    };

    fetchAndCalculateInvoiceNumber();
    refreshBusinessSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - refreshBusinessProfile causes infinite loops if included

  useEffect(() => {
    if (newlyAddedCustomer) {
      form.setValue('customerId', newlyAddedCustomer.id);
    }
  }, [newlyAddedCustomer]);

  // Update form values when business profile loads
  useEffect(() => {
    if (businessProfile) {
      form.setValue('notes', businessProfile.defaultNotes || "");
      form.setValue('terms', businessProfile.defaultTerms || "");
      form.setValue('currency', businessProfile.currency || "USD");
    }
  }, [businessProfile]);

  const handleSubmit = async (
    values: any,
    items: any,
    total: number,
    subtotal: number,
    taxAmount: number,
    additionalCharges: number,
    discount: number,
    additionalChargesList?: any[]
  ) => {
    try {
      console.log("Attempting to create invoice with data:", {
        invoiceNumber: values.invoiceNumber,
        customerId: values.customerId,
        date: formatDate(values.date),
        dueDate: formatDate(values.dueDate),
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
        invoiceNumber: values.invoiceNumber,
        customerId: values.customerId,
        date: formatDate(values.date),
        dueDate: formatDate(values.dueDate),
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
        additionalChargesList: additionalChargesList,
        additionalChargesTotal: additionalCharges, // Store calculated total
        templateName: values.templateName, // Save selected template
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
        country: values.country || 'New Zealand',
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
        availableItems={items}
        isLoadingItems={isLoadingItems}
        generatedInvoiceNumber={calculatedInvoiceNumber}
        isLoadingInvoiceNumber={isLoadingInvoiceNumber}
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
