import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Plus, Trash2, Download, Save, ArrowLeft, Eye, ChevronsUpDown, Edit, Check } from 'lucide-react';
import { generateInvoicePdf } from "@/utils/pdfUtils";
import { formatCurrency, formatDate } from "@/utils/invoiceUtils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { LineItem, Invoice, Customer, BusinessProfile } from "@/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Props for InvoiceForm
type InvoiceFormMode = "create" | "edit";
interface InvoiceFormProps {
  mode: InvoiceFormMode;
  initialValues?: Partial<Invoice>;
  customers: Customer[];
  businessProfile: BusinessProfile | null;
  isLoadingCustomers: boolean;
  onSubmit: (values: any, lineItems: LineItem[], total: number, subtotal: number, taxAmount: number) => Promise<void>;
  onCancel: () => void;
}

const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  customerId: z.string().min(1, 'Customer is required'),
  date: z.date({ required_error: "Invoice date is required" }),
  dueDate: z.date({ required_error: "Due date is required" }),
  notes: z.string().optional(),
  terms: z.string().optional(),
  currency: z.string().default('USD'),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  mode,
  initialValues,
  customers,
  businessProfile,
  isLoadingCustomers,
  onSubmit,
  onCancel,
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Track line items state
  const [items, setItems] = useState<LineItem[]>(initialValues?.items && initialValues.items.length > 0
    ? initialValues.items
    : [{ id: "1", description: "", quantity: 1, rate: 0, total: 0 }]
  );
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const [invoicePreview, setInvoicePreview] = useState<Invoice | null>(null);
  const [activeTab, setActiveTab] = useState("edit");
  const [openLineItemDrawer, setOpenLineItemDrawer] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);
  const [isLineItemsOpen, setIsLineItemsOpen] = useState(true);
  // Invoice Number (local state so user can type & edit it)
  const [invoiceNumber, setInvoiceNumber] = useState(initialValues?.invoiceNumber || "");

  // RHF Form setup
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: initialValues?.invoiceNumber || "",
      customerId: initialValues?.customerId || "",
      date: initialValues?.date
        ? typeof initialValues.date === "string"
          ? new Date(initialValues.date)
          : initialValues.date
        : new Date(),
      dueDate: initialValues?.dueDate
        ? typeof initialValues.dueDate === "string"
          ? new Date(initialValues.dueDate)
          : initialValues.dueDate
        : new Date(new Date().setDate(new Date().getDate() + 30)),
      notes: initialValues?.notes || businessProfile?.defaultNotes || "",
      terms: initialValues?.terms || businessProfile?.defaultTerms || "",
      currency: initialValues?.currency || "USD",
    }
  });

  // Keep local invoice number state in sync with RHF form
  useEffect(() => {
    form.setValue("invoiceNumber", invoiceNumber);
    // eslint-disable-next-line
  }, [invoiceNumber]);

  // When editing, reset form with initial invoice data when it comes in
  useEffect(() => {
    if (initialValues) {
      form.reset({
        invoiceNumber: initialValues.invoiceNumber || "",
        customerId: initialValues.customerId || "",
        date: initialValues.date
          ? typeof initialValues.date === "string"
            ? new Date(initialValues.date)
            : initialValues.date
          : new Date(),
        dueDate: initialValues.dueDate
          ? typeof initialValues.dueDate === "string"
            ? new Date(initialValues.dueDate)
            : initialValues.dueDate
          : new Date(new Date().setDate(new Date().getDate() + 30)),
        notes: initialValues.notes || businessProfile?.defaultNotes || "",
        terms: initialValues.terms || businessProfile?.defaultTerms || "",
        currency: initialValues.currency || "USD",
      });
      setInvoiceNumber(initialValues.invoiceNumber || "");
      setItems(initialValues.items && initialValues.items.length > 0
        ? initialValues.items
        : [{ id: "1", description: "", quantity: 1, rate: 0, total: 0 }]);
    }
    // eslint-disable-next-line
  }, [initialValues]);

  const handleInvoiceNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInvoiceNumber(e.target.value);
    form.setValue('invoiceNumber', e.target.value);
  };

  // Calculate invoice totals whenever items change
  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    setSubtotal(newSubtotal);
    // Calculate tax (if implemented later)
    const newTaxAmount = items.reduce((sum, item) => {
      const taxRate = item.tax || 0;
      return sum + (Number(item.rate) * Number(item.quantity) * taxRate) / 100;
    }, 0);
    setTaxAmount(newTaxAmount);
    setTotal(newSubtotal + newTaxAmount);
  }, [items]);

  // Line items operations
  const updateItem = (idx: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === "quantity" || field === "rate") {
      const quantity = field === "quantity" ? Number(value) : Number(updated[idx].quantity);
      const rate = field === "rate" ? Number(value) : Number(updated[idx].rate);
      updated[idx].total = quantity * rate;
    }
    setItems(updated);
  };
  const addItem = () => {
    const newItem = { id: `${items.length + 1}`, description: "", quantity: 1, rate: 0, total: 0 };
    setItems([...items, newItem]);
    if (isMobile) {
      setCurrentItemIndex(items.length);
      setOpenLineItemDrawer(true);
    }
  };
  const removeItem = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
      if (openLineItemDrawer && currentItemIndex === idx) {
        setOpenLineItemDrawer(false);
        setCurrentItemIndex(null);
      }
    }
  };
  const editItem = (idx: number) => {
    setCurrentItemIndex(idx);
    setOpenLineItemDrawer(true);
  };

  // Invoice Preview
  const generatePreview = () => {
    const vals = form.getValues();
    const previewInvoice: Invoice = {
      id: initialValues?.id || "preview",
      invoiceNumber: vals.invoiceNumber,
      customerId: vals.customerId,
      customer: customers.find(c => c.id === vals.customerId),
      date: formatDate(vals.date),
      dueDate: formatDate(vals.dueDate),
      items,
      subtotal,
      taxAmount,
      total,
      status: initialValues?.status || "draft",
      currency: vals.currency,
      notes: vals.notes,
      terms: vals.terms,
      createdAt: initialValues?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setInvoicePreview(previewInvoice);
    setActiveTab("preview");
  };

  // PDF download
  const handleDownloadPdf = async () => {
    if (previewRef.current && invoicePreview) {
      try {
        await generateInvoicePdf(invoicePreview, previewRef.current);
      } catch (error) {
        console.error('Error generating PDF:', error);
      }
    }
  };

  // Mobile line item drawer render
  const renderLineItemDrawer = () => {
    if (currentItemIndex === null || currentItemIndex >= items.length) return null;
    const currentItem = items[currentItemIndex];
    return (
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Edit Line Item</DrawerTitle>
          <DrawerDescription>
            Make changes to this line item.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={currentItem.description}
              onChange={e => updateItem(currentItemIndex, 'description', e.target.value)}
              placeholder="Item description"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity</label>
            <Input
              type="number"
              min="1"
              value={currentItem.quantity}
              onChange={e => updateItem(currentItemIndex, "quantity", Number(e.target.value))}
              className="w-full"
              inputMode="numeric"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Rate</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={currentItem.rate}
              onChange={e => updateItem(currentItemIndex, "rate", Number(e.target.value))}
              className="w-full"
              inputMode="decimal"
            />
          </div>
          <div className="pt-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span>Total:</span>
              <span>{formatCurrency(currentItem.total, form.getValues('currency'))}</span>
            </div>
          </div>
        </div>
        <DrawerFooter className="flex-row justify-between space-x-2">
          <Button
            variant="destructive"
            onClick={() => removeItem(currentItemIndex)}
            className="flex-1"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <DrawerClose asChild>
            <Button className="flex-1">
              <Check className="mr-2 h-4 w-4" />
              Done
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    );
  };

  // Form submit handler
  const localOnSubmit = async (values: InvoiceFormValues) => {
    await onSubmit(values, items, total, subtotal, taxAmount);
  };

  const selectedCustomer = customers.find(c => c.id === form.watch('customerId'));

  // -- UI part (copied from CreateInvoice for now!) --
  return (
    <div className="space-y-4 pb-20 px-0 -mx-4 sm:mx-0 sm:px-0">
      <div className="flex justify-between items-center px-4 sm:px-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="mr-0"
          >
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-lg md:text-3xl font-bold truncate">
            {mode === "edit" ? "Edit Invoice" : "Create Invoice"}
          </h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 mx-4 sm:mx-0">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Edit size={16} />
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

        <TabsContent value="edit" className="px-4 sm:px-0">
          <Card>
            <CardContent className="pt-4 pb-2 px-3 sm:p-6 sm:pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(localOnSubmit)} className="space-y-4">
                  {/* Invoice Number */}
                  <div className="mb-3">
                    <FormField
                      control={form.control}
                      name="invoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={invoiceNumber}
                              onChange={handleInvoiceNumberChange}
                              placeholder="Invoice Number"
                              className="w-full"
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer */}
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
                            <SelectContent position="popper" className="min-w-[var(--radix-select-trigger-width)]">
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
                    {/* Currency */}
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
                            <SelectContent position="popper" className="min-w-[var(--radix-select-trigger-width)]">
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
                                    "w-full pl-3 text-left font-normal justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
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
                                    "w-full pl-3 text-left font-normal justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Line Items Section */}
                  <div className="space-y-4">
                    <Collapsible
                      open={isLineItemsOpen}
                      onOpenChange={setIsLineItemsOpen}
                      className="border rounded-md p-2"
                    >
                      <CollapsibleTrigger className="flex w-full justify-between items-center p-2">
                        <h3 className="text-lg font-medium">Line Items</h3>
                        <ChevronsUpDown size={16} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2">
                        {isMobile ? (
                          <div className="space-y-2">
                            {items.map((item, index) => (
                              <div
                                key={item.id}
                                className="flex justify-between items-center border-b pb-2"
                                onClick={() => editItem(index)}
                              >
                                <div className="flex-1">
                                  <div className="font-medium">{item.description || "Untitled Item"}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {item.quantity} × {formatCurrency(item.rate, form.getValues('currency'))}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div>{formatCurrency(item.total, form.getValues('currency'))}</div>
                                  <button
                                    type="button"
                                    className="text-muted-foreground hover:text-destructive text-sm"
                                    onClick={e => { e.stopPropagation(); removeItem(index); }}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                            <Button
                              type="button"
                              onClick={addItem}
                              variant="outline"
                              size="sm"
                              className="w-full flex items-center justify-center gap-2"
                            >
                              <Plus size={16} />
                              <span>Add Item</span>
                            </Button>
                            {/* Mobile Line Item Drawer */}
                            <Drawer open={openLineItemDrawer} onOpenChange={setOpenLineItemDrawer}>
                              {renderLineItemDrawer()}
                            </Drawer>
                          </div>
                        ) : (
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
                                        onChange={e => updateItem(index, "description", e.target.value)}
                                        placeholder="Item description"
                                        className="w-full"
                                      />
                                    </td>
                                    <td className="py-2 px-2">
                                      <Input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={e => updateItem(index, "quantity", Number(e.target.value))}
                                        className="w-full text-right"
                                      />
                                    </td>
                                    <td className="py-2 px-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.rate}
                                        onChange={e => updateItem(index, "rate", Number(e.target.value))}
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
                                <tr>
                                  <td colSpan={5} className="py-2">
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
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                        {/* Totals */}
                        <div className={cn(
                          "border-t mt-4 pt-2 space-y-1",
                          isMobile ? "px-2" : ""
                        )}>
                          <div className="flex justify-between">
                            <span className="font-medium">Subtotal</span>
                            <span>{formatCurrency(subtotal, form.getValues('currency'))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Tax</span>
                            <span>{formatCurrency(taxAmount, form.getValues('currency'))}</span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span className="font-bold">Total</span>
                            <span className="font-bold">{formatCurrency(total, form.getValues('currency'))}</span>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                  {/* Notes & Terms */}
                  {isMobile ? (
                    <Collapsible className="border rounded-md p-2">
                      <CollapsibleTrigger className="flex w-full justify-between items-center p-2">
                        <h3 className="text-lg font-medium">Notes & Terms</h3>
                        <ChevronsUpDown size={16} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2 space-y-4">
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Notes - visible to customer"
                                  className="resize-none h-24"
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
                                  className="resize-none h-24"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
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
                  )}
                  {/* Actions */}
                  {isMobile ? (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-10 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={generatePreview}
                      >
                        <Eye size={16} className="mr-1" />
                        Preview
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                      >
                        <Save size={16} className="mr-1" />
                        {mode === "edit" ? "Save" : "Save"}
                      </Button>
                    </div>
                  ) : (
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
                        <span>{mode === "edit" ? "Save Invoice" : "Save Invoice"}</span>
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Preview Tab */}
        <TabsContent value="preview" className="px-0 -mx-4 sm:mx-0 sm:px-0 h-full">
          {invoicePreview && (
            <div className="space-y-4 h-full">
              {!isMobile && (
                <div className="flex justify-end px-4 mb-4">
                  <Button
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-2"
                  >
                    <Download size={16} />
                    <span>Download PDF</span>
                  </Button>
                </div>
              )}
              <Card className={cn(
                isMobile ? "rounded-none border-x-0 h-[calc(100vh-10rem)]" : ""
              )}>
                <CardContent className={cn(
                  "bg-white overflow-auto",
                  isMobile ? "p-3 h-full" : "p-6 shadow-sm"
                )}>
                  <div
                    ref={previewRef}
                    className={cn(
                      "min-w-[300px]",
                      isMobile ? "text-sm" : ""
                    )}
                  >
                    <div className={cn(
                      "flex flex-col justify-between mb-6",
                      !isMobile && "md:flex-row"
                    )}>
                      <div>
                        <h2 className={cn(
                          "font-bold mb-2",
                          isMobile ? "text-xl" : "text-2xl"
                        )}>
                          {businessProfile?.name || "Your Business Name"}
                        </h2>
                        <div className="text-gray-600">
                          <p>{businessProfile?.address || ""}</p>
                          <p>{businessProfile?.city || ""}, {businessProfile?.state || ""} {businessProfile?.zip || ""}</p>
                          <p>{businessProfile?.email || ""}</p>
                          <p>{businessProfile?.phone || ""}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "text-right",
                        isMobile ? "mt-4" : "mt-0"
                      )}>
                        <h1 className={cn(
                          "font-bold text-gray-800",
                          isMobile ? "text-xl" : "text-2xl"
                        )}>
                          INVOICE
                        </h1>
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
                    {/* Invoice Items Table/Mobile */}
                    {isMobile ? (
                      <div className="mb-6 space-y-3">
                        {invoicePreview.items.map((item, index) => (
                          <div key={index} className="border-b border-gray-200 pb-2 last:border-b-0">
                            <div className="font-medium">{item.description || "Untitled Item"}</div>
                            <div className="flex justify-between mt-1">
                              <div className="text-gray-600">
                                {item.quantity} × {formatCurrency(item.rate, invoicePreview.currency)}
                              </div>
                              <div className="text-gray-800 font-medium">
                                {formatCurrency(item.total, invoicePreview.currency)}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-gray-800">{formatCurrency(invoicePreview.subtotal, invoicePreview.currency)}</span>
                          </div>
                          <div className
