import React, { useEffect, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronUp, User, Mail, Phone, MapPin } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Customer } from '@/types';
import { DrawerFormLayout } from '@/components/ui/DrawerFormLayout';
import { cn } from '@/lib/utils';

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
  const [showAdvanced, setShowAdvanced] = useState(false);
  
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
      setShowAdvanced(false);
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
            <form id="customer-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              
              {/* Essential Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium text-foreground">Basic Information</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Name *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter customer name"
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            {...field} 
                            placeholder="customer@example.com"
                            className="h-11"
                          />
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
                        <FormLabel className="text-sm font-medium flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Phone
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="+64 21 123 4567"
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Address Section - Collapsible */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Address Details</span>
                    <span className="text-xs text-muted-foreground">(Optional)</span>
                  </div>
                  {showAdvanced ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                
                <div className={cn(
                  "space-y-4 overflow-hidden transition-all duration-300 ease-in-out",
                  showAdvanced ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                )}>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Street Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="123 Main Street, Unit 4"
                            className="min-h-[80px] resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">City</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Auckland"
                              className="h-11"
                            />
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
                          <FormLabel className="text-sm font-medium">Region</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Auckland Region"
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Postal Code</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="1010"
                              className="h-11"
                            />
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
                          <FormLabel className="text-sm font-medium">Country</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* VIP Status */}
              <FormField
                control={form.control}
                name="is_vip"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-card">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">VIP Customer</FormLabel>
                      <div className="text-xs text-muted-foreground">
                        Mark as VIP for priority treatment and special offers
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </DrawerFormLayout>
      </DrawerContent>
    </Drawer>
  );
};

export default CustomerFormDrawer; 