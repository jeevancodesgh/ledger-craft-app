
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  CalendarIcon, 
  Plus, 
  Trash2, 
  FileText, 
  Download, 
  Save, 
  ArrowLeft,
  Eye
} from 'lucide-react';
import { generateInvoicePdf } from '@/utils/pdfUtils';
import { formatCurrency, generateInvoiceNumber, formatDate } from '@/utils/invoiceUtils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { LineItem, Invoice } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Form schema for invoice validation
const invoiceFormSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  date: z.date({
    required_error: "Invoice date is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  notes: z.string().optional(),
  terms: z.string().optional(),
  currency: z.string().default('USD'),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

const CreateInvoice = () => {
  const { customers, isLoadingCustomers, createInvoice, businessProfile } = useAppContext();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, total: 0 },
  ]);
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('edit');
  const previewRef = useRef<HTMLDivElement>(null);
  const [invoicePreview, setInvoicePreview] = useState<Invoice | null>(null);

  // Form setup
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      customerId: '',
      date: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      notes: businessProfile?.defaultNotes || '',
      terms: businessProfile?.defaultTerms || '',
      currency: 'USD',
    }
  });

  // Update line item
  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Calculate item total
    if (field === 'quantity' || field === 'rate') {
      const quantity = field === 'quantity' ? Number(value) : Number(newItems[index].quantity);
      const rate = field === 'rate' ? Number(value) : Number(newItems[index].rate);
      newItems[index].total = quantity * rate;
    }
    
    setItems(newItems);
  };

  // Add new line item
  const addItem = () => {
    setItems([
      ...items,
      { id: `${items.length + 1}`, description: '', quantity: 1, rate: 0, total: 0 }
    ]);
  };

  // Remove line item
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Calculate invoice totals
  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + item.total, 0);
    setSubtotal(newSubtotal);
    
    // Calculate tax (assuming each item could have different tax rates)
    const newTaxAmount = items.reduce((sum, item) => {
      const taxRate = item.tax || 0;
      return sum + (item.rate * item.quantity * taxRate) / 100;
    }, 0);
    setTaxAmount(newTaxAmount);
    
    setTotal(newSubtotal + newTaxAmount);
  }, [items]);

  // Generate invoice preview
  const generatePreview = () => {
    const formValues = form.getValues();
    
    const previewInvoice: Invoice = {
      id: 'preview',
      invoiceNumber: generateInvoiceNumber(),
      customerId: formValues.customerId,
      customer: customers.find(c => c.id === formValues.customerId),
      date: formatDate(formValues.date),
      dueDate: formatDate(formValues.dueDate),
      items: items,
      subtotal: subtotal,
      taxAmount: taxAmount,
      total: total,
      status: 'draft',
      currency: formValues.currency,
      notes: formValues.notes,
      terms: formValues.terms,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setInvoicePreview(previewInvoice);
    setActiveTab('preview');
  };

  // Handle form submission
  const onSubmit = async (values: InvoiceFormValues) => {
    try {
      await createInvoice({
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
      });
      
      navigate('/invoices');
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  // Handle PDF download
  const handleDownloadPdf = async () => {
    if (previewRef.current && invoicePreview) {
      try {
        await generateInvoicePdf(invoicePreview, previewRef.current);
      } catch (error) {
        console.error('Error generating PDF:', error);
      }
    }
  };

  const selectedCustomer = customers.find(c => c.id === form.watch('customerId'));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/invoices')}
            className="mr-2"
          >
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Create New Invoice</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <FileText size={16} />
            <span>Edit</span>
          </TabsTrigger>
          <TabsTrigger 
            value="preview" 
            className="flex items-center gap-2"
            onClick={generatePreview}
          >
            <Eye size={16} />
            <span>Preview</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Selection */}
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a customer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers.map(customer => (
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

                    {/* Currency Selection */}
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                              <SelectItem value="CAD">CAD (C$)</SelectItem>
                              <SelectItem value="AUD">AUD (A$)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Invoice Date */}
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Invoice Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Due Date */}
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Line Items */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Line Items</h3>
                      <Button 
                        type="button" 
                        onClick={addItem}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Plus size={16} />
                        <span>Add Item</span>
                      </Button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 text-sm font-medium">Description</th>
                            <th className="text-right py-2 text-sm font-medium">Qty</th>
                            <th className="text-right py-2 text-sm font-medium">Rate</th>
                            <th className="text-right py-2 text-sm font-medium">Total</th>
                            <th className="py-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => (
                            <tr key={item.id} className="border-b last:border-b-0">
                              <td className="py-2 pr-2">
                                <Input
                                  value={item.description}
                                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                                  placeholder="Item description"
                                  className="w-full"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                  className="w-full text-right"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.rate}
                                  onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
                                  className="w-full text-right"
                                />
                              </td>
                              <td className="py-2 px-2 text-right">
                                {formatCurrency(item.total, form.getValues('currency'))}
                              </td>
                              <td className="py-2 pl-2">
                                <Button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={items.length <= 1}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t">
                            <td colSpan={3} className="text-right py-2 font-medium">Subtotal</td>
                            <td className="text-right py-2">{formatCurrency(subtotal, form.getValues('currency'))}</td>
                            <td></td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="text-right py-2 font-medium">Tax</td>
                            <td className="text-right py-2">{formatCurrency(taxAmount, form.getValues('currency'))}</td>
                            <td></td>
                          </tr>
                          <tr className="border-t">
                            <td colSpan={3} className="text-right py-2 font-medium">Total</td>
                            <td className="text-right py-2 font-bold">{formatCurrency(total, form.getValues('currency'))}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Notes & Terms */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Notes - visible to customer"
                              className="resize-none h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="terms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terms & Conditions</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Terms and conditions"
                              className="resize-none h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row justify-end items-center gap-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      className="w-full sm:w-auto" 
                      onClick={generatePreview}
                    >
                      Preview Invoice
                    </Button>
                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto flex items-center gap-2"
                    >
                      <Save size={16} />
                      <span>Save Invoice</span>
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          {invoicePreview && (
            <div className="space-y-6">
              <div className="flex justify-end mb-4">
                <Button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-2"
                >
                  <Download size={16} />
                  <span>Download PDF</span>
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-6">
                  <div ref={previewRef} className="bg-white p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">
                          {businessProfile?.name || "Your Business Name"}
                        </h2>
                        <div className="text-sm text-gray-600">
                          <p>{businessProfile?.address || ""}</p>
                          <p>{businessProfile?.city || ""}, {businessProfile?.state || ""} {businessProfile?.zip || ""}</p>
                          <p>{businessProfile?.email || ""}</p>
                          <p>{businessProfile?.phone || ""}</p>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 text-right">
                        <h1 className="text-2xl font-bold text-gray-800">INVOICE</h1>
                        <p className="text-gray-600"># {invoicePreview.invoiceNumber}</p>
                        <p className="text-gray-600 mt-2">Date: {invoicePreview.date}</p>
                        <p className="text-gray-600">Due Date: {invoicePreview.dueDate}</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-b border-gray-200 py-4 mb-6">
                      <h3 className="font-medium text-gray-600 mb-2">Bill To:</h3>
                      {selectedCustomer ? (
                        <div>
                          <p className="font-bold">{selectedCustomer.name}</p>
                          <p>{selectedCustomer.address}</p>
                          <p>{selectedCustomer.city}, {selectedCustomer.state} {selectedCustomer.zip}</p>
                          <p>{selectedCustomer.email}</p>
                          <p>{selectedCustomer.phone}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500">No customer selected</p>
                      )}
                    </div>
                    
                    <table className="min-w-full mb-6">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Item</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-600">Quantity</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600">Rate</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoicePreview.items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-200">
                            <td className="py-3 px-4 text-gray-800">{item.description || "Untitled Item"}</td>
                            <td className="py-3 px-4 text-center text-gray-800">{item.quantity}</td>
                            <td className="py-3 px-4 text-right text-gray-800">
                              {formatCurrency(item.rate, invoicePreview.currency)}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-800">
                              {formatCurrency(item.total, invoicePreview.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="text-right py-3 px-4 font-medium text-gray-600">Subtotal</td>
                          <td className="text-right py-3 px-4 text-gray-800">
                            {formatCurrency(invoicePreview.subtotal, invoicePreview.currency)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="text-right py-3 px-4 font-medium text-gray-600">Tax</td>
                          <td className="text-right py-3 px-4 text-gray-800">
                            {formatCurrency(invoicePreview.taxAmount, invoicePreview.currency)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="text-right py-3 px-4 font-bold text-gray-800">Total</td>
                          <td className="text-right py-3 px-4 font-bold text-gray-800">
                            {formatCurrency(invoicePreview.total, invoicePreview.currency)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                    
                    {invoicePreview.notes && (
                      <div className="mb-6">
                        <h3 className="font-medium text-gray-600 mb-2">Notes:</h3>
                        <p className="text-gray-800">{invoicePreview.notes}</p>
                      </div>
                    )}
                    
                    {invoicePreview.terms && (
                      <div className="mb-6">
                        <h3 className="font-medium text-gray-600 mb-2">Terms & Conditions:</h3>
                        <p className="text-gray-800">{invoicePreview.terms}</p>
                      </div>
                    )}
                    
                    <div className="text-center text-gray-500 text-sm mt-8">
                      Thank you for your business!
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreateInvoice;
