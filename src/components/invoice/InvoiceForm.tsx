import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useBlocker } from "react-router-dom";
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
import { CustomerCombobox } from "@/components/ui/customer-combobox";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Plus, Trash2, Download, Save, ArrowLeft, Eye, ChevronsUpDown, Edit, Check, Circle, Weight, UserPlus } from 'lucide-react';
import { generateInvoicePdf } from "@/utils/pdfUtils";
import { formatCurrency, formatDate } from "@/utils/invoiceUtils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { LineItem, Invoice, Customer, BusinessProfile, Item, AdditionalCharge } from "@/types";
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
import AdditionalChargesManager from './AdditionalChargesManager';
import { useToast } from "@/hooks/use-toast";
import { useAutoSave, AutoSaveData } from "@/hooks/use-auto-save";
import InvoicePreview from "./preview/InvoicePreview";
import ItemSelector from "./ItemSelector";
import ItemDrawer from "../item/ItemDrawer";
import { ItemFormValues } from "../item/ItemForm";
import { Switch } from "@/components/ui/switch";
import { useAppContext } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Import template components
import ClassicTemplate from "./preview/templates/ClassicTemplate";
import ModernTemplate from "./preview/templates/ModernTemplate";
import MinimalTemplate from "./preview/templates/MinimalTemplate";
import ExecutiveTemplate from "./preview/templates/ExecutiveTemplate";
import CorporateTemplate from "./preview/templates/CorporateTemplate";
import ModernInvoiceTemplate from './preview/templates/ModernInvoiceTemplate';
import { itemService } from "@/services/supabaseService";

type InvoiceFormMode = "create" | "edit";
interface InvoiceFormProps {
  mode: InvoiceFormMode;
  initialValues?: Partial<Invoice>;
  customers: Customer[];
  businessProfile: BusinessProfile | null;
  isLoadingCustomers: boolean;
  onSubmit: (values: any, lineItems: LineItem[], total: number, subtotal: number, taxAmount: number, additionalCharges: number, discount: number, additionalChargesList?: AdditionalCharge[]) => Promise<void>;
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
  invoiceNumber: z.string().min(1, 'Invoice number is required for IRD compliance and proper business records'),
  customerId: z.string().min(1, 'Please select a customer to ensure accurate billing and maintain business relationships'),
  date: z.date({ required_error: "Invoice date is required for accurate tax period assignment and reporting" }),
  dueDate: z.date({ required_error: "Due date is required for cash flow management and payment terms clarity" }),
  notes: z.string().optional(),
  terms: z.string().optional(),
  currency: z.string().default('NZD'),
  additionalCharges: z.coerce.number().nonnegative("Additional charges must be a positive amount. Enter 0 if no additional charges apply").default(0),
  discount: z.coerce.number().nonnegative("Discount must be a positive amount. Enter 0 if no discount applies").default(0),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

// Add these animation variants at the top of the file after imports
const tabVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

const lineItemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

const buttonVariants = {
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2 }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

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

  const getInitialItems = () =>
    initialValues?.items && initialValues.items.length > 0
      ? initialValues.items
      : [{ id: "1", description: "", quantity: 1, unit: "each", rate: 0, total: 0 }];

  const [items, setItems] = useState<LineItem[]>(getInitialItems());
  const [initialItemsJSON, setInitialItemsJSON] = useState(() => JSON.stringify(getInitialItems()));

  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const [invoicePreview, setInvoicePreview] = useState<Invoice | null>(null);
  const [activeTab, setActiveTab] = useState("edit");
  const [openLineItemDrawer, setOpenLineItemDrawer] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);
  const [isLineItemsOpen, setIsLineItemsOpen] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplateId>('classic');
  
  // Item management state
  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);
  const [isTaxEnabled, setIsTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [isAdditionalChargesEnabled, setIsAdditionalChargesEnabled] = useState(false);
  const [additionalChargesList, setAdditionalChargesList] = useState<AdditionalCharge[]>([]);
  const [isDiscountEnabled, setIsDiscountEnabled] = useState(false);
  const [refetchItemsTrigger, setRefetchItemsTrigger] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const { isDirty } = form.formState;
  const itemsChanged = JSON.stringify(items) !== initialItemsJSON;
  const hasUnsavedChanges = !isSubmitting && (isDirty || itemsChanged);

  const blocker = useBlocker(hasUnsavedChanges);

  // Auto-save functionality for professional data protection
  const formData = form.watch();
  const autoSaveKey = mode === 'edit' && initialValues?.id ? `edit-${initialValues.id}` : 'create-new';
  
  const { clearSavedData } = useAutoSave({
    key: autoSaveKey,
    data: {
      formData,
      items,
      timestamp: Date.now(),
      invoiceId: initialValues?.id,
      mode
    },
    enabled: hasUnsavedChanges && !isSubmitting,
    interval: 30000, // Auto-save every 30 seconds
    onSave: (data) => {
      // Optional: Show subtle save indicator
      console.log('📄 Invoice draft auto-saved');
    },
    onRestore: (savedData) => {
      try {
        // Restore form data
        if (savedData.formData) {
          form.reset({
            ...savedData.formData,
            date: savedData.formData.date ? new Date(savedData.formData.date) : new Date(),
            dueDate: savedData.formData.dueDate ? new Date(savedData.formData.dueDate) : new Date()
          });
        }
        
        // Restore line items
        if (savedData.items && savedData.items.length > 0) {
          setItems(savedData.items);
          setInitialItemsJSON(JSON.stringify(savedData.items));
        }
        
        return true; // Successfully restored
      } catch (error) {
        console.error('Failed to restore auto-saved data:', error);
        return false;
      }
    }
  });

  const triggerItemsRefetch = () => {
    setRefetchItemsTrigger(prev => prev + 1);
  };


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
      const newItems = initialValues.items && initialValues.items.length > 0
        ? initialValues.items
        : [{ id: "1", description: "", quantity: 1, unit: "each", rate: 0, total: 0 }];
      setItems(newItems);
      setInitialItemsJSON(JSON.stringify(newItems));
      
      // Set the template from initial values or default to classic
      setSelectedTemplate((initialValues.templateName as InvoiceTemplateId) || 'classic');
      
      // Initialize additional charges list from existing invoice
      if (initialValues.additionalChargesList && initialValues.additionalChargesList.length > 0) {
        setAdditionalChargesList(initialValues.additionalChargesList);
        setIsAdditionalChargesEnabled(true);
      } else {
        setAdditionalChargesList([]);
        setIsAdditionalChargesEnabled(false);
      }
    } else {
      // Create mode - ensure template is set to classic
      setSelectedTemplate('classic');
      setAdditionalChargesList([]);
      setIsAdditionalChargesEnabled(false);
    }
  }, [initialValues]);

  useEffect(() => {
    // When a new customer is added, select it in the form
    if (newlyAddedCustomer) {
      form.setValue('customerId', newlyAddedCustomer.id);
      // Trigger validation to clear the error immediately
      form.trigger('customerId');
    }
  }, [newlyAddedCustomer]);


  useEffect(() => {
    if (generatedInvoiceNumber && !initialValues?.invoiceNumber) {
      form.setValue('invoiceNumber', generatedInvoiceNumber);
    }
  }, [generatedInvoiceNumber, initialValues?.invoiceNumber]);

  // Update form values when business profile loads (for create mode)
  useEffect(() => {
    if (businessProfile && mode === 'create' && !initialValues) {
      // Only update if the current values are empty (initial state)
      const currentNotes = form.getValues('notes');
      const currentTerms = form.getValues('terms');
      
      if (!currentNotes && businessProfile.defaultNotes) {
        form.setValue('notes', businessProfile.defaultNotes);
      }
      if (!currentTerms && businessProfile.defaultTerms) {
        form.setValue('terms', businessProfile.defaultTerms);
      }
      if (businessProfile.currency) {
        form.setValue('currency', businessProfile.currency);
      }
    }
  }, [businessProfile, mode, initialValues]);


  useEffect(() => {
    if (!isTaxEnabled) setTaxRate(0);
    if (!isAdditionalChargesEnabled) form.setValue("additionalCharges", 0);
    if (!isDiscountEnabled) form.setValue("discount", 0);
  }, [isTaxEnabled, isAdditionalChargesEnabled, isDiscountEnabled]);

  // Calculate additional charges total - memoized to prevent unnecessary recalculations
  const calculateAdditionalChargesTotal = React.useCallback((): number => {
    if (!isAdditionalChargesEnabled) return 0;
    
    return additionalChargesList.reduce((total, charge) => {
      if (!charge.isActive) return total;
      
      if (charge.calculationType === 'percentage') {
        return total + (subtotal * charge.amount) / 100;
      }
      return total + charge.amount;
    }, 0);
  }, [isAdditionalChargesEnabled, additionalChargesList, subtotal]);

  // Memoize form values to prevent excessive re-renders
  const additionalChargesFormValue = form.watch('additionalCharges');
  const discountFormValue = form.watch('discount');

  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    setSubtotal(newSubtotal);
    let newTaxAmount = 0;
    if (isTaxEnabled && taxRate > 0) {
      newTaxAmount = (newSubtotal * taxRate) / 100;
    }
    setTaxAmount(newTaxAmount);
    
    // Calculate additional charges inline to avoid circular dependency
    let addCharges = 0;
    if (isAdditionalChargesEnabled) {
      if (additionalChargesList.length > 0) {
        addCharges = additionalChargesList.reduce((total, charge) => {
          if (!charge.isActive) return total;
          if (charge.calculationType === 'percentage') {
            return total + (newSubtotal * charge.amount) / 100;
          }
          return total + charge.amount;
        }, 0);
      } else {
        addCharges = Number(additionalChargesFormValue);
      }
    }
    
    const disc = isDiscountEnabled ? Number(discountFormValue) : 0;
    setTotal(newSubtotal + newTaxAmount + addCharges - disc);
  }, [items, isTaxEnabled, taxRate, isAdditionalChargesEnabled, isDiscountEnabled, additionalChargesList, additionalChargesFormValue, discountFormValue]);

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
    form.setValue("additionalCharges", isNaN(v) ? 0 : v, { shouldDirty: true });
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    form.setValue("discount", isNaN(v) ? 0 : v, { shouldDirty: true });
  };

  const generatePreview = () => {
    // Only validate the form, don't submit
    const isValid = form.trigger();
    if (!isValid) {
      toast({
        title: "Preview Unavailable",
        description: "Please complete all required fields (customer, invoice number, and line items) before generating preview. This ensures accurate invoice presentation.",
        variant: "destructive",
      });
      return;
    }

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
      additionalCharges: vals.additionalCharges,
      additionalChargesList: additionalChargesList, // Add structured charges for preview
      additionalChargesTotal: calculateAdditionalChargesTotal(), // Add calculated total
      discount: vals.discount,
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
          title: "PDF Generation Failed",
          description: "Unable to create PDF document. Please check your browser's download settings and try again. If the issue persists, contact support.",
          variant: "destructive"
        });
      }
    }
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
            title: "Item Creation Issue",
            description: "Unable to add new item to invoice. Please try adding the line item again or refresh the page if the problem persists.",
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
        title: "Item Creation Failed",
        description: "Unable to save new item to your inventory. Please check your connection and try again. The item information has been preserved on this invoice.",
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
    setIsSubmitting(true);
    try {
      // Professional validation: Check for meaningful line items
      const validItems = items.filter(item => 
        item.description?.trim() && 
        item.quantity > 0 && 
        item.rate >= 0
      );
      
      if (validItems.length === 0) {
        toast({
          title: "Invoice Incomplete",
          description: "Please add at least one line item with description, quantity, and rate. Professional invoices require detailed service or product information.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Professional validation: Check for future due date
      if (values.dueDate <= values.date) {
        toast({
          title: "Due Date Issue", 
          description: "Due date should be after the invoice date to allow reasonable payment time. Please adjust the due date to maintain professional payment terms.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Calculate additional charges total from structured charges
      const structuredChargesTotal = calculateAdditionalChargesTotal();
      const finalAdditionalCharges = additionalChargesList.length > 0 
        ? structuredChargesTotal 
        : Number(values.additionalCharges);

      // Add template name to values
      const valuesWithTemplate = {
        ...values,
        templateName: selectedTemplate
      };

      await onSubmit(
        valuesWithTemplate,
        items,
        subtotal + taxAmount + finalAdditionalCharges - Number(values.discount),
        subtotal,
        taxAmount,
        finalAdditionalCharges,
        Number(values.discount),
        additionalChargesList // Pass the structured charges list
      );
      
      // Clear auto-saved data on successful submission
      clearSavedData();
      
      // Reset form and items in sync
      form.reset(values);
      setItems([...items]);
      setInitialItemsJSON(JSON.stringify(items));
    } catch (error) {
      console.error("Submission failed in InvoiceForm:", error);
    } finally {
      setIsSubmitting(false);
    }
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
          onBackToEdit={() => setActiveTab("edit")}
          onSave={async () => {
            const values = form.getValues();
            await localOnSubmit(values);
          }}
          saveButtonText={mode === "create" ? "Save Invoice" : "Save Changes"}
          isSaving={isSubmitting}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-32 px-0 -mx-4 sm:mx-0 sm:px-0 sm:pb-6">
      <div className="flex justify-between items-center px-4 sm:px-0">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="mr-0 h-10 w-10 p-0 rounded-full hover:bg-muted/50"
            >
              <ArrowLeft size={18} />
            </Button>
          </motion.div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold truncate bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {mode === "edit" ? "Edit Invoice" : "Create Invoice"}
            </h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              {mode === "edit" ? "Update your invoice details" : "Create a new invoice for your client"}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 mx-4 sm:mx-0 sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b sm:static sm:border-0 sm:bg-transparent rounded-lg h-12">
          <TabsTrigger value="edit" className="flex items-center gap-2 h-10 rounded-md font-medium transition-all">
            <Edit size={16} />
            <span>Edit</span>
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="flex items-center gap-2 h-10 rounded-md font-medium transition-all"
            onClick={generatePreview}
          >
            <Eye size={16} />
            <span>Preview</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="px-4 sm:px-0">
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={tabVariants}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardContent className="pt-6 pb-4 px-4 sm:p-8 sm:pt-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(localOnSubmit)} className="space-y-6" data-invoice-form>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mb-6"
                    >
                      <FormField
                        control={form.control}
                        name="invoiceNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold text-foreground/90">Invoice Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="INV-001"
                                className="w-full h-12 border-2 border-border/50 rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-background"
                                autoComplete="off"
                                disabled={isLoadingInvoiceNumber}
                                data-testid="invoice-number"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      <FormField
                        control={form.control}
                        name="customerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold text-foreground/90">Customer</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <CustomerCombobox
                                  customers={customers}
                                  value={field.value}
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    // Trigger validation to clear the error immediately
                                    form.trigger('customerId');
                                  }}
                                  placeholder="Search and select a customer..."
                                  disabled={isLoadingCustomers}
                                  isLoading={isLoadingCustomers}
                                  onAddCustomer={onAddCustomer}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Customer Info Card */}
                      {selectedCustomer && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className="col-span-1 md:col-span-2 mt-4"
                        >
                        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 backdrop-blur-sm">
                          <CardContent className="py-4 px-6 flex flex-col gap-2">
                            <div className="font-semibold text-lg flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <UserPlus className="w-4 h-4 text-primary" />
                              </div>
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
                        </motion.div>
                      )}
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold text-foreground/90">Currency</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 border-2 border-border/50 rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20">
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
                            <FormLabel className="text-base font-semibold text-foreground/90">Invoice Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-4 text-left font-normal justify-between h-12 border-2 border-border/50 rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/50",
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
                            <FormLabel className="text-base font-semibold text-foreground/90">Due Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-4 text-left font-normal justify-between h-12 border-2 border-border/50 rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/50",
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
                    </motion.div>
                    {/* Additional Charges Manager */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <AdditionalChargesManager
                        charges={additionalChargesList}
                        onChargesChange={setAdditionalChargesList}
                        subtotal={subtotal}
                        currency={form.watch('currency') || 'USD'}
                        enabled={isAdditionalChargesEnabled}
                        onEnabledChange={setIsAdditionalChargesEnabled}
                      />
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      <div className="p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50">
                        <div className="flex items-center gap-3 mb-3">
                          <Switch
                            checked={isDiscountEnabled}
                            onCheckedChange={setIsDiscountEnabled}
                            id="discount-toggle"
                            className="data-[state=checked]:bg-primary"
                          />
                          <label htmlFor="discount-toggle" className="text-sm font-semibold text-foreground/90">Enable Discount</label>
                        </div>
                        {isDiscountEnabled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={form.watch('discount')}
                              onChange={handleDiscountChange}
                              placeholder="Discount amount"
                              className="w-full h-11 border-2 border-border/50 rounded-lg bg-background/50 backdrop-blur-sm transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                          </motion.div>
                        )}
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/30">
                        <div className="flex items-center gap-3 mb-3">
                          <Switch
                            checked={isTaxEnabled}
                            onCheckedChange={setIsTaxEnabled}
                            id="tax-toggle"
                            className="data-[state=checked]:bg-accent"
                          />
                          <label htmlFor="tax-toggle" className="text-sm font-semibold text-foreground/90">Enable Tax</label>
                        </div>
                        {isTaxEnabled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.01}
                              value={taxRate}
                              onChange={e => setTaxRate(Number(e.target.value))}
                              placeholder="Tax percentage"
                              className="w-full h-11 border-2 border-border/50 rounded-lg bg-background/50 backdrop-blur-sm transition-all duration-200 focus:border-accent focus:ring-2 focus:ring-accent/20"
                            />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                      className="space-y-6 pb-4"
                    >
                      <Collapsible
                        open={isLineItemsOpen}
                        onOpenChange={setIsLineItemsOpen}
                        className="border-2 border-border/50 rounded-xl p-4 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm shadow-sm"
                      >
                        <motion.div
                          initial={false}
                          animate={{ backgroundColor: isLineItemsOpen ? "transparent" : "rgba(0,0,0,0.02)" }}
                          transition={{ duration: 0.2 }}
                        >
                          <CollapsibleTrigger className="flex w-full justify-between items-center p-3 rounded-lg hover:bg-muted/30 transition-colors">
                            <h3 className="text-lg font-semibold text-foreground/90">Line Items</h3>
                            <motion.div
                              animate={{ rotate: isLineItemsOpen ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronsUpDown size={16} />
                            </motion.div>
                          </CollapsibleTrigger>
                        </motion.div>
                        
                        <AnimatePresence>
                          {isLineItemsOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
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
                                      data-testid="add-item-button"
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
                                          <motion.tr
                                            key={item.id}
                                            variants={lineItemVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            layout
                                            className="border-b last:border-b-0"
                                          >
                                            <td className="py-2 pr-2">
                                              <div className="flex flex-col space-y-1">
                                                <div className="flex items-center relative w-full">
                                                  <Input
                                                    value={item.description}
                                                    onChange={e => updateItem(index, "description", e.target.value)}
                                                    placeholder="Item description"
                                                    className="w-full"
                                                    data-testid={`item-description-${index}`}
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
                                                data-testid={`item-quantity-${index}`}
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
                                                data-testid={`item-rate-${index}`}
                                              />
                                            </td>
                                            <td className="py-2 px-2 text-right" data-testid={`item-amount-${index}`}>
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
                                          </motion.tr>
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
                                              data-testid="add-item-button"
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
                                    <span data-testid="invoice-subtotal">{formatCurrency(subtotal, form.getValues('currency'))}</span>
                                  </div>
                                  {isTaxEnabled && (
                                    <div className="flex justify-between">
                                      <span className="font-medium">Tax ({taxRate}%)</span>
                                      <span data-testid="invoice-gst">{formatCurrency(taxAmount, form.getValues('currency'))}</span>
                                    </div>
                                  )}
                                  {isAdditionalChargesEnabled && (
                                    <div className="flex justify-between">
                                      <span className="font-medium">Additional Charges</span>
                                      <span>{formatCurrency(
                                        additionalChargesList.length > 0 
                                          ? calculateAdditionalChargesTotal() 
                                          : Number(form.watch('additionalCharges')),
                                        form.getValues('currency')
                                      )}</span>
                                    </div>
                                  )}
                                  {isDiscountEnabled && (
                                    <div className="flex justify-between">
                                      <span className="font-medium">Discount</span>
                                      <span>-{formatCurrency(Number(form.watch('discount')), form.getValues('currency'))}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between border-t pt-1">
                                    <span className="font-bold">Total</span>
                                    <span className="font-bold" data-testid="invoice-total">{formatCurrency(total, form.getValues('currency'))}</span>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Collapsible>
                    </motion.div>

                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="preview" className="h-full">
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={tabVariants}
          >
            {renderPreviewTab()}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Mobile Fixed Action Buttons - Only visible on mobile and Edit tab, hidden when drawers are open */}
      {activeTab === "edit" && !openLineItemDrawer && !isItemDrawerOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-sm border-t border-border/50 p-4 flex gap-3 sm:hidden">
        <motion.div className="flex gap-3 w-full">
          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            className="flex-1"
          >
            <Button type="button" variant="outline" onClick={onCancel} className="w-full h-12 rounded-xl border-2 border-border/50 hover:border-primary/50 transition-all duration-200">
              Cancel
            </Button>
          </motion.div>
          
          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            className="flex-1"
          >
            <Button 
              type="button" 
              variant="outline" 
              onClick={generatePreview}
              className="w-full gap-2 h-12 rounded-xl border-2 border-border/50 hover:border-accent/50 transition-all duration-200"
            >
              <Eye size={16} />
              <span>Preview</span>
            </Button>
          </motion.div>
          
          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            className="flex-1"
          >
            <Button 
              onClick={() => {
                const form = document.querySelector('form[data-invoice-form]') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="gap-2 w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-200 shadow-lg"
              data-testid="save-invoice-button"
            >
              <Save size={16} />
              <span>{mode === "create" ? "Save Invoice" : "Save Changes"}</span>
            </Button>
          </motion.div>
        </motion.div>
        </div>
      )}

      {/* Desktop Action Buttons - Only visible on desktop and Edit tab, hidden when drawers are open */}
      {activeTab === "edit" && !openLineItemDrawer && !isItemDrawerOpen && (
        <div className="hidden sm:block mt-6">
        <motion.div className="flex gap-3 justify-end">
          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
          >
            <Button type="button" variant="outline" onClick={onCancel} className="h-12 px-6 rounded-xl border-2 border-border/50 hover:border-primary/50 transition-all duration-200">
              Cancel
            </Button>
          </motion.div>
          
          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
          >
            <Button 
              type="button" 
              variant="outline" 
              onClick={generatePreview}
              className="gap-2 h-12 px-6 rounded-xl border-2 border-border/50 hover:border-accent/50 transition-all duration-200"
            >
              <Eye size={16} />
              <span>Preview</span>
            </Button>
          </motion.div>
          
          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
          >
            <Button 
              onClick={() => {
                const form = document.querySelector('form[data-invoice-form]') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="gap-2 h-12 px-6 rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-200 shadow-lg"
              data-testid="save-invoice-button"
            >
              <Save size={16} />
              <span>{mode === "create" ? "Save Invoice" : "Save Changes"}</span>
            </Button>
          </motion.div>
        </motion.div>
        </div>
      )}

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

      {blocker && blocker.state === "blocked" && (
        <AlertDialog open={blocker.state === "blocked"}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Save className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <AlertDialogTitle className="text-lg font-semibold text-foreground">
                    Save Your Invoice Before Leaving?
                  </AlertDialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {mode === 'create' ? 'Draft invoice' : 'Invoice changes'} will be lost
                  </p>
                </div>
              </div>
            </AlertDialogHeader>
            
            <AlertDialogDescription className="text-sm space-y-3">
              <div className="bg-muted/50 p-3 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Unsaved Changes:</h4>
                <ul className="space-y-1 text-sm">
                  {formData.invoiceNumber && (
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Invoice #{formData.invoiceNumber}
                    </li>
                  )}
                  {items.some(item => item.description || item.quantity > 0) && (
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      {items.filter(item => item.description || item.quantity > 0).length} line item(s)
                    </li>
                  )}
                  {formData.customerId && (
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      Customer selection
                    </li>
                  )}
                  {(formData.notes || formData.terms) && (
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                      Notes and terms
                    </li>
                  )}
                </ul>
              </div>
              
              <p className="text-xs text-muted-foreground">
                💡 Your work is automatically saved as a draft every 30 seconds, but manual saving ensures immediate protection.
              </p>
            </AlertDialogDescription>
            
            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <AlertDialogCancel 
                onClick={() => blocker.reset?.()}
                className="order-3 sm:order-1"
              >
                Continue Editing
              </AlertDialogCancel>
              
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    // Attempt to save current state
                    const values = form.getValues();
                    if (formData.invoiceNumber || formData.customerId || items.some(item => item.description)) {
                      await localOnSubmit(values);
                      toast({
                        title: "Invoice Saved",
                        description: "Your invoice has been saved before navigation.",
                      });
                    }
                  } catch (error) {
                    console.error('Save before navigation failed:', error);
                    toast({
                      title: "Save Failed", 
                      description: "Unable to save invoice before navigation. Please check your connection and try saving manually, or your auto-saved draft will be preserved.",
                      variant: "destructive"
                    });
                  }
                  blocker.proceed?.();
                }}
                className="order-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save & Leave
                  </>
                )}
              </Button>
              
              <AlertDialogAction 
                onClick={() => blocker.proceed?.()}
                variant="destructive"
                className="order-1 sm:order-3"
              >
                Leave Without Saving
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default InvoiceForm;
