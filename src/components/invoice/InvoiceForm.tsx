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
import { CalendarIcon, Plus, Trash2, Download, Save, ArrowLeft, Eye, ChevronsUpDown, Edit, Check, Circle, Weight, UserPlus } from 'lucide-react';
import { generateInvoicePdf } from "@/utils/pdfUtils";
import { formatCurrency, formatDate } from "@/utils/invoiceUtils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { LineItem, Invoice, Customer, BusinessProfile, Item } from "@/types";
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
import TemplateSelector from './templates/TemplateSelector';
import { invoiceTemplates, InvoiceTemplateId } from './templates/InvoiceTemplates';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import InvoicePreview from "./preview/InvoicePreview";
import ItemSelector from "./ItemSelector";
import ItemDrawer from "../item/ItemDrawer";
import { ItemFormValues } from "../item/ItemForm";
import { Switch } from "@/components/ui/switch";
import { useAppContext } from "@/context/AppContext";

// Import template components
import ClassicTemplate from "./preview/templates/ClassicTemplate";
import ModernTemplate from "./preview/templates/ModernTemplate";
import MinimalTemplate from "./preview/templates/MinimalTemplate";
import ExecutiveTemplate from "./preview/templates/ExecutiveTemplate";
import CorporateTemplate from "./preview/templates/CorporateTemplate";
import { itemService } from "@/services/supabaseService";

type InvoiceFormMode = "create" | "edit";
interface InvoiceFormProps {
  mode: InvoiceFormMode;
  initialValues?: Partial<Invoice>;
  customers: Customer[];
  businessProfile: BusinessProfile | null;
  isLoadingCustomers: boolean;
  onSubmit: (values: any, lineItems: LineItem[], total: number, subtotal: number, taxAmount: number, additionalCharges: number, discount: number) => Promise<void>;
  onCancel: () => void;
  onAddCustomer?: () => void;
  newlyAddedCustomer?: Customer | null;
  defaultValues?: {
    invoiceNumber?: string;
  };
  availableItems?: Item[];
  isLoadingItems?: boolean;
  generatedInvoiceNumber?: string;
  isLoadingInvoiceNumber?: boolean;
}

const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  customerId: z.string().min(1, 'Customer is required'),
  date: z.date({ required_error: "Invoice date is required" }),
  dueDate: z.date({ required_error: "Due date is required" }),
  notes: z.string().optional(),
  terms: z.string().optional(),
  currency: z.string().default('USD'),
  additionalCharges: z.coerce.number().nonnegative("Must be a positive amount").default(0),
  discount: z.coerce.number().nonnegative("Must be a positive amount").default(0),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  mode,
  initialValues,
  customers,
  businessProfile,
  isLoadingCustomers,
  onSubmit,
  onCancel,
  onAddCustomer,
  newlyAddedCustomer,
  defaultValues,
  availableItems = [],
  generatedInvoiceNumber,
  isLoadingInvoiceNumber = false
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [items, setItems] = useState<LineItem[]>(initialValues?.items && initialValues.items.length > 0
    ? initialValues.items
    : [{ id: "1", description: "", quantity: 1, unit: "each", rate: 0, total: 0 }]
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
  const [invoiceNumber, setInvoiceNumber] = useState(
    initialValues?.invoiceNumber || defaultValues?.invoiceNumber || ""
  );
  const [additionalCharges, setAdditionalCharges] = useState(
    initialValues?.additionalCharges ?? 0
  );
  const [discount, setDiscount] = useState(
    initialValues?.discount ?? 0
  );
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplateId>('classic');
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  
  // Item management state
  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);
  const [isTaxEnabled, setIsTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [isAdditionalChargesEnabled, setIsAdditionalChargesEnabled] = useState(false);
  const [isDiscountEnabled, setIsDiscountEnabled] = useState(false);
  const [refetchItemsTrigger, setRefetchItemsTrigger] = useState(0);
  // New state to track which line item is creating a new item
  const [indexCreatingNewItem, setIndexCreatingNewItem] = useState<number | null>(null);

  // Get units from App Context
  const { units } = useAppContext();
  const { itemCategories } = useAppContext();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: initialValues?.invoiceNumber || defaultValues?.invoiceNumber || "",
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
      currency: initialValues?.currency || "NZD",
      additionalCharges: initialValues?.additionalCharges ?? 0,
      discount: initialValues?.discount ?? 0,
    }
  });

  const triggerItemsRefetch = () => {
    setRefetchItemsTrigger(prev => prev + 1);
  };

  useEffect(() => {
    form.setValue("invoiceNumber", invoiceNumber);
  }, [invoiceNumber]);

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
        additionalCharges: initialValues.additionalCharges ?? 0,
        discount: initialValues.discount ?? 0,
      });
      setInvoiceNumber(initialValues.invoiceNumber || "");
      setItems(initialValues.items && initialValues.items.length > 0
        ? initialValues.items
        : [{ id: "1", description: "", quantity: 1, unit: "each", rate: 0, total: 0 }]);
      setAdditionalCharges(initialValues.additionalCharges ?? 0);
      setDiscount(initialValues.discount ?? 0);
    }
  }, [initialValues]);

  useEffect(() => {
    // When a new customer is added, select it in the form
    if (newlyAddedCustomer) {
      form.setValue('customerId', newlyAddedCustomer.id);
    }
  }, [newlyAddedCustomer, form]);

  // Load recent customers (last 5)
  useEffect(() => {
    if (customers && customers.length > 0) {
      // Sort by most recently updated
      const sorted = [...customers].sort((a, b) => 
        new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime()
      );
      setRecentCustomers(sorted.slice(0, 5));
    }
  }, [customers]);

  useEffect(() => {
    if (generatedInvoiceNumber && !initialValues?.invoiceNumber) {
      setInvoiceNumber(generatedInvoiceNumber);
      form.setValue('invoiceNumber', generatedInvoiceNumber);
    }
  }, [generatedInvoiceNumber, initialValues?.invoiceNumber, form]);

  const handleInvoiceNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInvoiceNumber(e.target.value);
    form.setValue('invoiceNumber', e.target.value);
  };

  useEffect(() => {
    if (!isTaxEnabled) setTaxRate(0);
    if (!isAdditionalChargesEnabled) setAdditionalCharges(0);
    if (!isDiscountEnabled) setDiscount(0);
  }, [isTaxEnabled, isAdditionalChargesEnabled, isDiscountEnabled]);

  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    setSubtotal(newSubtotal);
    let newTaxAmount = 0;
    if (isTaxEnabled && taxRate > 0) {
      newTaxAmount = (newSubtotal * taxRate) / 100;
    }
    setTaxAmount(newTaxAmount);
    const addCharges = isAdditionalChargesEnabled ? Number(additionalCharges) : 0;
    const disc = isDiscountEnabled ? Number(discount) : 0;
    setTotal(newSubtotal + newTaxAmount + addCharges - disc);
  }, [items, additionalCharges, discount, isTaxEnabled, taxRate, isAdditionalChargesEnabled, isDiscountEnabled]);

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
    const newItem = { id: `${items.length + 1}`, description: "", quantity: 1, unit: "each", rate: 0, total: 0 };
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

  const handleAdditionalChargesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setAdditionalCharges(isNaN(v) ? 0 : v);
    form.setValue("additionalCharges", isNaN(v) ? 0 : v);
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setDiscount(isNaN(v) ? 0 : v);
    form.setValue("discount", isNaN(v) ? 0 : v);
  };

  const generatePreview = () => {
    const vals = form.getValues();
    const previewInvoice: Invoice = {
      id: initialValues?.id || "preview",
      userId: initialValues?.userId || "preview-user",
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
      additionalCharges: additionalCharges,
      discount: discount,
    };
    setInvoicePreview(previewInvoice);
    setActiveTab("preview");
  };

  const handleDownloadPdf = async () => {
    if (previewRef.current && invoicePreview) {
      try {
        await generateInvoicePdf(invoicePreview, previewRef.current, selectedTemplate);
        toast({
          title: "Success",
          description: "Invoice PDF has been downloaded"
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: "Error",
          description: "Could not generate PDF. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleSelectCustomer = (customerId: string) => {
    form.setValue('customerId', customerId);
    toast({
      title: "Customer selected",
      description: `Customer has been selected for this invoice.`
    });
  };

  // Handle selection of an item from the item selector
  const handleItemSelect = (selectedItem: Item, index: number) => {
    const updatedLineItem = { ...items[index] };
    
    updatedLineItem.description = selectedItem.name;
    if (selectedItem.enableSaleInfo && selectedItem.salePrice !== null && selectedItem.salePrice !== undefined) {
      updatedLineItem.rate = selectedItem.salePrice;
    } else if (selectedItem.enablePurchaseInfo && selectedItem.purchasePrice !== null && selectedItem.purchasePrice !== undefined) {
      updatedLineItem.rate = selectedItem.purchasePrice;
    } else {
      updatedLineItem.rate = 0; // Default rate if no price info is available
    }
    updatedLineItem.unit = selectedItem.unit || 'each';
    // Tax is handled at the invoice level, not per item in this form currently
    // updatedLineItem.tax = selectedItem.taxRate || 0;
    
    // Calculate total based on quantity and rate
    // Ensure quantity is treated as a number
    const quantity = Number(updatedLineItem.quantity) || 0; 
    updatedLineItem.total = quantity * updatedLineItem.rate;
    
    const updatedItems = [...items];
    updatedItems[index] = updatedLineItem;
    setItems(updatedItems);
  };

  // Handle creation of a new item - Now accepts the index
  const handleCreateNewItem = (index: number) => {
    setIndexCreatingNewItem(index); // Store the index
    setIsItemDrawerOpen(true);
  };

  // Handle saving a new item - Now accepts the index
  const handleSaveNewItem = async (values: ItemFormValues) => {
    if (indexCreatingNewItem === null) {
        console.error("Index for new item creation not set.");
        toast({
            title: "Error",
            description: "Failed to determine where to add the new item.",
            variant: "destructive",
        });
        return;
    }
    try {
      // Assuming values from ItemFormValues are compatible with Item type needed for createItem
      const newItem = await itemService.createItem(values);
      toast({
        title: "Item created successfully",
        description: `${newItem.name} has been added to your items.`,
      });
      // Automatically select the new item in the line item
      handleItemSelect(newItem, indexCreatingNewItem);
      setIsItemDrawerOpen(false);
      setIndexCreatingNewItem(null); // Clear the stored index
      triggerItemsRefetch(); // Trigger refetch to update item selector options
    } catch (error) {
      console.error('Error creating item:', error);
      toast({
        title: "Error",
        description: "Failed to create item. Please try again.",
        variant: "destructive",
      });
      setIsItemDrawerOpen(false); // Close drawer on error too
      setIndexCreatingNewItem(null); // Clear the stored index even on error
    }
  };

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
          <div className="flex flex-col space-y-2">
            <div className="mb-3">
              <ItemSelector
                onItemSelect={(item) => handleItemSelect(item, currentItemIndex)}
                // Pass the currentItemIndex to handleCreateNewItem
                onCreateNewItem={() => handleCreateNewItem(currentItemIndex)}
                buttonClassName="w-full justify-start text-primary border border-primary font-semibold"
                refetch={triggerItemsRefetch}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={currentItem.description}
                onChange={e => updateItem(currentItemIndex, 'description', e.target.value)}
                placeholder="Item description"
                className="w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
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
              <label className="text-sm font-medium">Unit</label>
              <Select
                value={currentItem.unit || "each"}
                onValueChange={value => updateItem(currentItemIndex, "unit", value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {/* Use units from App Context, directly using the string value */}
                  {units.map(unitString => (
                    <SelectItem key={unitString} value={unitString}>
                      <div className="flex items-center gap-2">
                        {/* Conditionally render icon based on unitString */}
                        {unitString === 'each' && <Circle className="h-4 w-4" />}
                        {unitString === 'kg' && <Weight className="h-4 w-4" />}
                        {unitString === 'g' && <Weight className="h-4 w-4" />}
                        <span>{unitString}</span>{/* Use unitString as the label */}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

  const localOnSubmit = async (values: InvoiceFormValues) => {
    console.log("localOnSubmit called in InvoiceForm");
    await onSubmit(
      values,
      items,
      subtotal + taxAmount + Number(additionalCharges) - Number(discount),
      subtotal,
      taxAmount,
      Number(additionalCharges),
      Number(discount)
    );
  };

  const selectedCustomer = customers.find(c => c.id === form.watch('customerId'));

  const handleSelectTemplate = (templateId: InvoiceTemplateId) => {
    setSelectedTemplate(templateId);
  };

  // Mobile-optimized template selector
  const mobileTemplateOptions = invoiceTemplates.map(template => ({
    id: template.id,
    name: template.name,
  }));

  const renderPreviewTab = () => {
    if (!invoicePreview) return null;

    return (
      <div className="space-y-4">
        {!isMobile && (
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Template</h3>
            <TemplateSelector
              templates={invoiceTemplates}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={handleSelectTemplate}
            />
          </div>
        )}
        
        {isMobile && (
          <div className="mb-4 px-4">
            <h3 className="text-sm font-medium mb-2">Template</h3>
            <TemplateSelector
              templates={invoiceTemplates}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={handleSelectTemplate}
              isMobile={true}
            />
          </div>
        )}
        
        <InvoicePreview
          invoice={invoicePreview}
          selectedTemplate={selectedTemplate}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-28 px-0 -mx-4 sm:mx-0 sm:px-0">
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
        <TabsList className="grid w-full grid-cols-2 mb-4 mx-4 sm:mx-0 sticky top-0 z-40 bg-background border-b sm:static sm:border-0 sm:bg-transparent">
          <TabsTrigger value="edit" className="flex items-center gap-2 h-12">
            <Edit size={16} />
            <span>Edit</span>
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="flex items-center gap-2 h-12"
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
                              disabled={isLoadingInvoiceNumber}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer</FormLabel>
                          <div className="flex gap-2">
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
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
                            
                            <div className="flex items-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-10 w-10"
                                    title="Customer shortcuts"
                                  >
                                    <UserPlus className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  <DropdownMenuLabel>Customer Options</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={onAddCustomer} className="cursor-pointer">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    <span>Add New Customer</span>
                                  </DropdownMenuItem>
                                  
                                  {recentCustomers.length > 0 && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuLabel>Recent Customers</DropdownMenuLabel>
                                      {recentCustomers.map(customer => (
                                        <DropdownMenuItem 
                                          key={customer.id} 
                                          onClick={() => handleSelectCustomer(customer.id)}>
                                          {customer.name}
                                        </DropdownMenuItem>
                                      ))}
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Customer Info Card */}
                    {selectedCustomer && (
                      <Card className="col-span-1 md:col-span-2 bg-muted/50 border border-muted-foreground/10 mt-2">
                        <CardContent className="py-3 flex flex-col gap-1">
                          <div className="font-semibold text-base flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-primary" />
                            {selectedCustomer.name}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="font-medium">Email:</span> {selectedCustomer.email}
                          </div>
                          {selectedCustomer.phone && (
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="font-medium">Phone:</span> {selectedCustomer.phone}
                            </div>
                          )}
                          {(selectedCustomer.address || selectedCustomer.city || selectedCustomer.state || selectedCustomer.zip || selectedCustomer.country) && (
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="font-medium">Address:</span>
                              <span>
                                {selectedCustomer.address ? selectedCustomer.address + ', ' : ''}
                                {selectedCustomer.city ? selectedCustomer.city + ', ' : ''}
                                {selectedCustomer.state ? selectedCustomer.state + ', ' : ''}
                                {selectedCustomer.zip ? selectedCustomer.zip + ', ' : ''}
                                {selectedCustomer.country}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
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
                              <SelectItem value="NZD">NZD ($)</SelectItem>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 mt-2">
                      <Switch
                        checked={isAdditionalChargesEnabled}
                        onCheckedChange={setIsAdditionalChargesEnabled}
                        id="additional-charges-toggle"
                      />
                      <label htmlFor="additional-charges-toggle" className="text-sm font-medium">Enable Additional Charges</label>
                      {isAdditionalChargesEnabled && (
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={additionalCharges}
                          onChange={handleAdditionalChargesChange}
                          placeholder="e.g. shipping, handling"
                          className="w-32 ml-2"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Switch
                        checked={isDiscountEnabled}
                        onCheckedChange={setIsDiscountEnabled}
                        id="discount-toggle"
                      />
                      <label htmlFor="discount-toggle" className="text-sm font-medium">Enable Discount</label>
                      {isDiscountEnabled && (
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={discount}
                          onChange={handleDiscountChange}
                          placeholder="Any deduction"
                          className="w-32 ml-2"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Switch
                        checked={isTaxEnabled}
                        onCheckedChange={setIsTaxEnabled}
                        id="tax-toggle"
                      />
                      <label htmlFor="tax-toggle" className="text-sm font-medium">Enable Tax</label>
                      {isTaxEnabled && (
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          value={taxRate}
                          onChange={e => setTaxRate(Number(e.target.value))}
                          placeholder="Tax %"
                          className="w-24 ml-2"
                        />
                      )}
                    </div>
                  </div>
                  <div className="space-y-4 pb-4">
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
                                  <th className="text-left py-2 text-sm font-medium">Unit</th>
                                  <th className="text-right py-2 text-sm font-medium">Rate</th>
                                  <th className="text-right py-2 text-sm font-medium">Total</th>
                                  <th className="py-2 w-10"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item, index) => (
                                  <tr key={item.id} className="border-b last:border-b-0">
                                    <td className="py-2 pr-2">
                                      <div className="flex flex-col space-y-1">
                                        <div className="flex items-center relative w-full">
                                          <Input
                                            value={item.description}
                                            onChange={e => updateItem(index, "description", e.target.value)}
                                            placeholder="Item description"
                                            className="w-full"
                                          />
                                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                            <ItemSelector
                                              onItemSelect={(selectedItem) => handleItemSelect(selectedItem, index)}
                                              onCreateNewItem={() => handleCreateNewItem(index)}
                                              buttonClassName="h-6 w-6 p-0"
                                              iconOnly
                                              refetch={triggerItemsRefetch}
                                            />
                                          </div>
                                        </div>
                                      </div>
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
                                      <Select
                                        value={item.unit || "each"}
                                        onValueChange={value => updateItem(index, "unit", value)}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select unit" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {/* Use units from App Context, directly using the string value */}
                                          {units.map(unitString => (
                                            <SelectItem key={unitString} value={unitString}>
                                              <div className="flex items-center gap-2">
                                                {/* Conditionally render icon based on unitString */}
                                                {unitString === 'each' && <Circle className="h-4 w-4" />}
                                                {unitString === 'kg' && <Weight className="h-4 w-4" />}
                                                {unitString === 'g' && <Weight className="h-4 w-4" />}
                                                <span>{unitString}</span>{/* Use unitString as the label */}
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
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
                        <div className={cn(
                          "border-t mt-4 pt-2 space-y-1",
                          isMobile ? "px-2" : ""
                        )}>
                          <div className="flex justify-between">
                            <span className="font-medium">Subtotal</span>
                            <span>{formatCurrency(subtotal, form.getValues('currency'))}</span>
                          </div>
                          {isTaxEnabled && (
                            <div className="flex justify-between">
                              <span className="font-medium">Tax ({taxRate}%)</span>
                              <span>{formatCurrency(taxAmount, form.getValues('currency'))}</span>
                            </div>
                          )}
                          {isAdditionalChargesEnabled && (
                            <div className="flex justify-between">
                              <span className="font-medium">Additional Charges</span>
                              <span>{formatCurrency(Number(additionalCharges), form.getValues('currency'))}</span>
                            </div>
                          )}
                          {isDiscountEnabled && (
                            <div className="flex justify-between">
                              <span className="font-medium">Discount</span>
                              <span>-{formatCurrency(Number(discount), form.getValues('currency'))}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t pt-1">
                            <span className="font-bold">Total</span>
                            <span className="font-bold">{formatCurrency(total, form.getValues('currency'))}</span>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>

                  {/* <div className="pt-4 flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                    <Button type="submit" className="gap-2">
                      <Save size={16} />
                      <span>{mode === "create" ? "Create Invoice" : "Save Changes"}</span>
                    </Button>
                  </div> */}
                   <div className="fixed bottom-0 left-0 w-full z-50 bg-background border-t p-4 flex gap-2 sm:static sm:p-0 sm:border-0 sm:bg-transparent">
                  <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={generatePreview}
                    className="flex-1 gap-2"
                  >
                    <Eye size={16} />
                    <span>Preview</span>
                  </Button>
                  <Button type="submit" className="gap-2 flex-1">
                    <Save size={16} />
                    <span>{mode === "create" ? "Create Invoice" : "Save Changes"}</span>
                  </Button>
                </div>
                </form>
                {/* Sticky action buttons for mobile */}
               
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview" className="h-full">
          {renderPreviewTab()}
        </TabsContent>
      </Tabs>

      {/* Item Management Modal */}
      <ItemDrawer 
        open={isItemDrawerOpen}
        onOpenChange={setIsItemDrawerOpen}
        onSave={handleSaveNewItem}
        categories={itemCategories} // Pass your categories here
        isLoading={false}
        title="Create New Item"
        description="Add a new product or service to your inventory"
      />
    </div>
  );
};

export default InvoiceForm;
