import React, { useState, useEffect, useRef } from 'react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { UserPlus } from 'lucide-react';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter
} from "@/components/ui/drawer";

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().or(z.literal('')).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional().default(''),
});

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
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [newlyAddedCustomer, setNewlyAddedCustomer] = useState<Customer | null>(null);
  const isMobile = useIsMobile();

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

  const handleKeyPress = (e: React.KeyboardEvent, nextFieldId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById(nextFieldId)?.focus();
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

      {/* Add New Customer: Drawer for mobile, Dialog for desktop */}
      {isMobile ? (
        <Drawer open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
          <DrawerContent className="max-h-[92vh] sm:max-h-[85vh] h-full flex flex-col">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <UserPlus size={20} className="text-primary" />
                Add New Customer
              </DrawerTitle>
              <DrawerDescription>
                Create a new customer to add to your invoice.
              </DrawerDescription>
            </DrawerHeader>
            <form id="add-customer-form" onSubmit={(e) => { console.log("Form submission event triggered."); form.handleSubmit(handleAddCustomer)(e); }} className="flex flex-col flex-1 overflow-y-auto px-4 space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input 
                  id="name" 
                  {...form.register('name')} 
                  placeholder="Customer name"
                  className="h-12 rounded-md focus:ring-2 focus:ring-primary"
                  autoComplete="name"
                  onKeyPress={(e) => handleKeyPress(e, 'email')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email </Label>
                <Input 
                  id="email" 
                  type="email"
                  {...form.register('email')} 
                  placeholder="customer@example.com"
                  className="h-12 rounded-md focus:ring-2 focus:ring-primary"
                  autoComplete="email"
                  onKeyPress={(e) => handleKeyPress(e, 'phone')}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  type="tel"
                  inputMode="tel"
                  {...form.register('phone')} 
                  placeholder="Phone number"
                  className="h-12 rounded-md focus:ring-2 focus:ring-primary"
                  autoComplete="tel"
                  maxLength={15}
                  onKeyPress={(e) => handleKeyPress(e, 'address')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  {...form.register('address')} 
                  placeholder="Street address"
                  className="h-12 rounded-md focus:ring-2 focus:ring-primary"
                  autoComplete="street-address"
                  onKeyPress={(e) => handleKeyPress(e, 'city')}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input 
                    id="city" 
                    {...form.register('city')} 
                    placeholder="City"
                    className="h-12 rounded-md focus:ring-2 focus:ring-primary"
                    autoComplete="address-level2"
                    onKeyPress={(e) => handleKeyPress(e, 'state')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input 
                    id="state" 
                    {...form.register('state')} 
                    placeholder="State"
                    className="h-12 rounded-md focus:ring-2 focus:ring-primary"
                    autoComplete="address-level1"
                    onKeyPress={(e) => handleKeyPress(e, 'zip')}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input 
                  id="zip" 
                  type="number"
                  inputMode="numeric"
                  {...form.register('zip')} 
                  placeholder="ZIP code"
                  className="h-12 rounded-md focus:ring-2 focus:ring-primary"
                  autoComplete="postal-code"
                  maxLength={5}
                  onKeyPress={(e) => handleKeyPress(e, 'submit-button')}
                />
              </div>
              <input type="hidden" {...form.register('country')} />
            </form>
            <DrawerFooter className="sticky bottom-0 bg-background z-10 border-t flex flex-row gap-2 p-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setAddCustomerOpen(false)}
                className="flex-1 h-12"
              >
                Cancel
              </Button>
              <Button 
                id="submit-button"
                type="submit"
                form="add-customer-form"
                className="flex-1 h-12 bg-primary hover:bg-primary/90"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Adding...</span>
                  </div>
                ) : (
                  'Add Customer'
                )}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
          <DialogContent className="sm:max-w-[475px] bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus size={20} className="text-primary" />
                Add New Customer
              </DialogTitle>
              <DialogDescription>
                Create a new customer to add to your invoice.
              </DialogDescription>
            </DialogHeader>
            <form id="add-customer-form-dialog" onSubmit={(e) => { console.log("Form submission event triggered."); form.handleSubmit(handleAddCustomer)(e); }} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input 
                  id="name" 
                  {...form.register('name')} 
                  placeholder="Customer name"
                  className="h-10 rounded-md focus:ring-2 focus:ring-primary"
                  autoComplete="name"
                  onKeyPress={(e) => handleKeyPress(e, 'email')}
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
                  className="h-10 rounded-md focus:ring-2 focus:ring-primary"
                  autoComplete="email"
                  onKeyPress={(e) => handleKeyPress(e, 'phone')}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  type="tel"
                  inputMode="tel"
                  {...form.register('phone')} 
                  placeholder="Phone number"
                  className="h-10 rounded-md focus:ring-2 focus:ring-primary"
                  autoComplete="tel"
                  maxLength={15}
                  onKeyPress={(e) => handleKeyPress(e, 'address')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  {...form.register('address')} 
                  placeholder="Street address"
                  className="h-10 rounded-md focus:ring-2 focus:ring-primary"
                  autoComplete="street-address"
                  onKeyPress={(e) => handleKeyPress(e, 'city')}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input 
                    id="city" 
                    {...form.register('city')} 
                    placeholder="City"
                    className="h-10 rounded-md focus:ring-2 focus:ring-primary"
                    autoComplete="address-level2"
                    onKeyPress={(e) => handleKeyPress(e, 'state')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input 
                    id="state" 
                    {...form.register('state')} 
                    placeholder="State"
                    className="h-10 rounded-md focus:ring-2 focus:ring-primary"
                    autoComplete="address-level1"
                    onKeyPress={(e) => handleKeyPress(e, 'zip')}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input 
                  id="zip" 
                  type="number"
                  inputMode="numeric"
                  {...form.register('zip')} 
                  placeholder="ZIP code"
                  className="h-10 rounded-md focus:ring-2 focus:ring-primary"
                  autoComplete="postal-code"
                  maxLength={5}
                  onKeyPress={(e) => handleKeyPress(e, 'submit-button')}
                />
              </div>
              <input type="hidden" {...form.register('country')} />
              <DialogFooter className="gap-2 mt-4 justify-end flex-row">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setAddCustomerOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  id="submit-button"
                  type="submit"
                  form="add-customer-form-dialog"
                  className="flex-1 h-12 bg-primary hover:bg-primary/90"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Adding...</span>
                    </div>
                  ) : (
                    'Add Customer'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default CreateInvoice;
