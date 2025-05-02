
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import InvoiceForm from "@/components/invoice/InvoiceForm";
import { generateNextInvoiceNumber } from '@/utils/invoiceUtils';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '@/types';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional().default(''),
});

const CreateInvoice = () => {
  const { customers, isLoadingCustomers, createInvoice, businessProfile, createCustomer } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [newlyAddedCustomer, setNewlyAddedCustomer] = useState<Customer | null>(null);

  const form = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      country: '',
    }
  });

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
      navigate('/invoices');
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const handleAddCustomer = async (data: any) => {
    try {
      const newCustomer = await createCustomer({
        name: data.name,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        phone: data.phone,
        country: data.country || '',
      });
      
      toast({
        title: 'Customer added successfully',
        description: `${data.name} has been added to your customers.`
      });
      
      setNewlyAddedCustomer(newCustomer);
      setAddCustomerOpen(false);
      form.reset();
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
        onAddCustomer={() => setAddCustomerOpen(true)}
        newlyAddedCustomer={newlyAddedCustomer}
        defaultValues={{
          invoiceNumber: defaultInvoiceNumber,
        }}
      />

      <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer to add to your invoice.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleAddCustomer)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input 
                id="name" 
                {...form.register('name')} 
                placeholder="Customer name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                type="email"
                {...form.register('email')} 
                placeholder="customer@example.com"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                {...form.register('phone')} 
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                {...form.register('address')} 
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  {...form.register('city')} 
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input 
                  id="state" 
                  {...form.register('state')} 
                  placeholder="State"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input 
                id="zip" 
                {...form.register('zip')} 
                placeholder="ZIP code"
              />
            </div>
            <input type="hidden" {...form.register('country')} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddCustomerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Customer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateInvoice;
