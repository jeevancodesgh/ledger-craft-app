import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from "@/components/ui/switch";
import { formatDate } from '@/utils/invoiceUtils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Expense, ExpenseStatus, PaymentMethod } from '@/types';
import { DrawerFormLayout } from '@/components/ui/DrawerFormLayout';
import { useAppContext } from '@/context/AppContext';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import ReceiptUpload from './ReceiptUpload';

const expenseFormSchema = z.object({
  description: z.string().min(1, { message: 'Description is required' }),
  amount: z.number().min(0.01, { message: 'Amount must be greater than 0' }),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  vendorName: z.string().optional().or(z.literal('')),
  receiptUrl: z.string().optional().or(z.literal('')),
  expenseDate: z.string().min(1, { message: 'Expense date is required' }),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  isBillable: z.boolean().default(false),
  customerId: z.string().optional(),
  taxAmount: z.number().min(0).default(0),
  currency: z.string().default('USD'),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'check', 'other']).optional(),
  notes: z.string().optional().or(z.literal(''))
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Expense | null;
  onSubmit: (values: ExpenseFormValues) => void;
}

const ExpenseFormDrawer: React.FC<ExpenseFormDrawerProps> = ({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
}) => {
  const { expenseCategories, accounts, customers } = useAppContext();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(initialValues?.receiptUrl || null);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: '',
      amount: 0,
      categoryId: 'no-category',
      accountId: 'no-account',
      vendorName: '',
      receiptUrl: '',
      expenseDate: formatDate(new Date()),
      status: 'pending',
      isBillable: false,
      customerId: 'no-customer',
      taxAmount: 0,
      currency: 'USD',
      paymentMethod: undefined,
      notes: ''
    }
  });

  useEffect(() => {
    if (initialValues) {
      form.reset({
        description: initialValues.description || '',
        amount: initialValues.amount || 0,
        categoryId: initialValues.categoryId || 'no-category',
        accountId: initialValues.accountId || 'no-account',
        vendorName: initialValues.vendorName || '',
        receiptUrl: initialValues.receiptUrl || '',
        expenseDate: initialValues.expenseDate || formatDate(new Date()),
        status: initialValues.status || 'pending',
        isBillable: initialValues.isBillable || false,
        customerId: initialValues.customerId || 'no-customer',
        taxAmount: initialValues.taxAmount || 0,
        currency: initialValues.currency || 'USD',
        paymentMethod: initialValues.paymentMethod || undefined,
        notes: initialValues.notes || ''
      });
      setReceiptUrl(initialValues.receiptUrl || null);
      setReceiptFile(null);
    } else {
      form.reset({
        description: '',
        amount: 0,
        categoryId: 'no-category',
        accountId: 'no-account',
        vendorName: '',
        receiptUrl: '',
        expenseDate: formatDate(new Date()),
        status: 'pending',
        isBillable: false,
        customerId: 'no-customer',
        taxAmount: 0,
        currency: 'USD',
        paymentMethod: undefined,
        notes: ''
      });
      setReceiptUrl(null);
      setReceiptFile(null);
    }
  }, [initialValues, form]);

  const handleSubmit = (values: ExpenseFormValues) => {
    // Include the current receipt URL in the form values
    const formData = {
      ...values,
      receiptUrl: receiptUrl || values.receiptUrl || null
    };
    onSubmit(formData);
  };

  useEffect(() => {
    if (!open) {
      form.reset({
        description: '',
        amount: 0,
        categoryId: 'no-category',
        accountId: 'no-account',
        vendorName: '',
        receiptUrl: '',
        expenseDate: formatDate(new Date()),
        status: 'pending',
        isBillable: false,
        customerId: 'no-customer',
        taxAmount: 0,
        currency: 'USD',
        paymentMethod: undefined,
        notes: ''
      });
      setReceiptUrl(null);
      setReceiptFile(null);
    }
  }, [open, form]);

  const handleReceiptChange = (url: string | null, file: File | null) => {
    setReceiptUrl(url);
    setReceiptFile(file);
    // Update the form field as well
    form.setValue('receiptUrl', url || '');
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="drawer-content">
        <DrawerFormLayout
          title={initialValues ? 'Edit Expense' : 'Create Expense'}
          description={initialValues ? 'Update the expense details below.' : 'Fill in the expense details below to create a new expense.'}
          footer={
            <>
              <Button type="submit" form="expense-form" className="flex-1 h-12">
                {initialValues ? 'Update Expense' : 'Create Expense'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-12">
                Cancel
              </Button>
            </>
          }
        >
          <Form {...form}>
            <form id="expense-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter expense description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expenseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expense Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no-category">No category</SelectItem>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              {category.color && (
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: category.color }}
                                />
                              )}
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no-account">No account</SelectItem>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name} ({account.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor/Merchant</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter vendor name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isBillable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Billable to Customer</FormLabel>
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

              {form.watch('isBillable') && (
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no-customer">No customer</SelectItem>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <ReceiptUpload
                onReceiptChange={handleReceiptChange}
                initialReceiptUrl={receiptUrl}
                disabled={false}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter any additional notes" />
                    </FormControl>
                    <FormMessage />
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

export default ExpenseFormDrawer;