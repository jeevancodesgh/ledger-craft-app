import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Switch } from "@/components/ui/switch";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Customer } from '@/types';
import { DrawerFormLayout } from '@/components/ui/DrawerFormLayout';

const customerFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email().optional().or(z.literal('')), // Allow empty string for optional
  phone: z.string().optional().or(z.literal('')), // Allow empty string for optional
  address: z.string().optional().or(z.literal('')), // Allow empty string for optional
  city: z.string().optional().or(z.literal('')), // Allow empty string for optional
  state: z.string().optional().or(z.literal('')), // Allow empty string for optional
  zip: z.string().optional().or(z.literal('')), // Allow empty string for optional
  country: z.string().optional().or(z.literal('')).default('New Zealand'), // Allow empty string for optional, default USA
  is_vip: z.boolean().default(false)
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Customer | null;
  onSubmit: (values: CustomerFormValues) => void;
}

const CustomerFormDrawer: React.FC<CustomerFormDrawerProps> = ({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
}) => {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      country: 'New Zealand',
      is_vip: false
    }
  });

  useEffect(() => {
    if (initialValues) {
      form.reset({
        name: initialValues.name || '',
        email: initialValues.email || '',
        phone: initialValues.phone || '',
        address: initialValues.address || '',
        city: initialValues.city || '',
        state: initialValues.state || '',
        zip: initialValues.zip || '',
        country: initialValues.country || 'New Zealand',
        is_vip: initialValues.isVip || false
      });
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'New Zealand',
        is_vip: false
      });
    }
  }, [initialValues, form]);

  const handleSubmit = (values: CustomerFormValues) => {
    onSubmit(values);
    // Do not close the drawer here, let the parent handle it after successful API call
  };

  useEffect(() => {
    if (!open) {
      form.reset({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'New Zealand',
        is_vip: false
      });
    }
  }, [open, form]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="drawer-content">
        <DrawerFormLayout
          title={initialValues ? 'Edit Customer' : 'Create Customer'}
          description={initialValues ? 'Update the customer details below.' : 'Fill in the customer details below to create a new customer.'}
          footer={
            <>
              <Button type="submit" form="customer-form" className="flex-1 h-12">
                {initialValues ? 'Update Customer' : 'Create Customer'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-12">
                Cancel
              </Button>
            </>
          }
        >
          <Form {...form}>
            <form id="customer-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zip</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* <FormField
                control={form.control}
                name="is_vip"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>VIP Customer</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              /> */}
            </form>
          </Form>
        </DrawerFormLayout>
      </DrawerContent>
    </Drawer>
  );
};

export default CustomerFormDrawer; 