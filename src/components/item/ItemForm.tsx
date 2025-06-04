import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Item, ItemCategory } from '@/types';
import { useAppContext } from '@/context/AppContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface ItemFormProps {
  initialData?: Item | null;
  onSubmit: (data: Item) => void;
  isLoading?: boolean;
  categories?: ItemCategory[];
  onCreateCategory?: (category: Omit<ItemCategory, "id" | "createdAt" | "updatedAt">) => Promise<ItemCategory>;
}

export type ItemFormValues = Item;

const itemFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().nullable().optional(),
  type: z.enum(['product', 'service']).default('product'),
  categoryId: z.string().nullable().optional(),
  salePrice: z.number().nullable().optional(),
  purchasePrice: z.number().nullable().optional(),
  taxRate: z.number().nullable().optional(),
  enableSaleInfo: z.boolean().default(true),
  enablePurchaseInfo: z.boolean().default(false),
  unit: z.string().default('each'),
});

export function ItemForm({ initialData, onSubmit, isLoading = false, categories, onCreateCategory }: ItemFormProps) {
  const { itemCategories, createItemCategory, units } = useAppContext();
  const { toast } = useToast();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const form = useForm<z.infer<typeof itemFormSchema>>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || null,
      type: initialData?.type || 'product',
      categoryId: initialData?.categoryId || null,
      salePrice: initialData?.salePrice || null,
      purchasePrice: initialData?.purchasePrice || null,
      taxRate: initialData?.taxRate || null,
      enableSaleInfo: initialData?.enableSaleInfo ?? true,
      enablePurchaseInfo: initialData?.enablePurchaseInfo ?? false,
      unit: initialData?.unit || 'each',
    },
  });

  // Reset form with initial data when it changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData?.name || '',
        description: initialData?.description || null,
        type: initialData?.type || 'product',
        categoryId: initialData?.categoryId || null,
        salePrice: initialData?.salePrice || null,
        purchasePrice: initialData?.purchasePrice || null,
        taxRate: initialData?.taxRate || null,
        enableSaleInfo: initialData?.enableSaleInfo ?? true,
        enablePurchaseInfo: initialData?.enablePurchaseInfo ?? false,
        unit: initialData?.unit || 'each',
      });
    } else {
       form.reset({
        name: '',
        description: null,
        type: 'product',
        categoryId: null,
        salePrice: null,
        purchasePrice: null,
        taxRate: null,
        enableSaleInfo: true,
        enablePurchaseInfo: false,
        unit: 'each',
      });
    }
  }, [initialData, form]);

  const effectiveCategories = categories || itemCategories;
  const effectiveCreateCategory = onCreateCategory ? onCreateCategory : createItemCategory;

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setIsAddingCategory(true);
      const newCategory = await effectiveCreateCategory({ name: newCategoryName });
      form.setValue('categoryId', newCategory.id);
      setNewCategoryName("");
      toast({
        title: "Success",
        description: `Category "${newCategory.name}" created successfully`,
      });
    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    } finally {
      setIsAddingCategory(false);
    }
  };

  // Manual validation for fields dependent on toggles (Sale/Purchase Info)
  const validateConditionalFields = () => {
    const values = form.getValues();
    if (values.enableSaleInfo && (values.salePrice === null || values.salePrice === undefined)) {
      form.setError('salePrice', { type: 'manual', message: 'Sale price is required when Sale Information is enabled' });
      return false;
    } else {
      form.clearErrors('salePrice');
    }

    if (values.enablePurchaseInfo && (values.purchasePrice === null || values.purchasePrice === undefined)) {
       form.setError('purchasePrice', { type: 'manual', message: 'Purchase price is required when Purchase Information is enabled' });
       return false;
    } else {
      form.clearErrors('purchasePrice');
    }

    return true;
  };

  const handleSubmit = (values: z.infer<typeof itemFormSchema>) => {
     if (!validateConditionalFields()) {
       return;
     }

    // Map form values back to Item type, including ID, createdAt, updatedAt from initialData
    const itemData: Item = {
      id: initialData?.id || '',
      name: values.name,
      type: values.type,
      description: values.description || null,
      categoryId: values.categoryId || null,
      salePrice: values.enableSaleInfo ? values.salePrice || null : null,
      purchasePrice: values.enablePurchaseInfo ? values.purchasePrice || null : null,
      taxRate: values.taxRate || null,
      enableSaleInfo: values.enableSaleInfo,
      enablePurchaseInfo: values.enablePurchaseInfo,
      unit: values.unit,
      createdAt: initialData?.createdAt,
      updatedAt: initialData?.updatedAt,
    };

    onSubmit(itemData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" id="item-form">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel htmlFor="type">Item Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="product" id="product" />
                        <Label htmlFor="product">Product</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="service" id="service" />
                        <Label htmlFor="service">Service</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem className="space-y-2">
                   <FormLabel htmlFor="unit">Unit</FormLabel>
                   <Select
                     onValueChange={field.onChange}
                     value={field.value}
                   >
                     <FormControl>
                       <SelectTrigger id="unit">
                         <SelectValue placeholder="Select unit" />
                       </SelectTrigger>
                     </FormControl>
                     <SelectContent>
                       {units.map((unit) => (
                         <SelectItem key={unit} value={unit}>
                           {unit}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                   <FormMessage />
                 </FormItem>
               )}
             />
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel htmlFor="name">Name*</FormLabel>
                <FormControl>
                  <Input placeholder="Item name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="space-y-2">
                 <FormLabel htmlFor="category">Category</FormLabel>
                 <div className="flex space-x-2">
                   <Select
                     onValueChange={field.onChange}
                     value={field.value || ''}
                   >
                     <FormControl className="flex-1">
                       <SelectTrigger>
                         <SelectValue placeholder="Select a category" />
                       </SelectTrigger>
                     </FormControl>
                     <SelectContent>
                       {effectiveCategories.map((category) => (
                         <SelectItem key={category.id} value={category.id}>
                           {category.name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>

                   <Popover>
                     <PopoverTrigger asChild>
                       <Button type="button" size="icon" disabled={isAddingCategory || isLoading}>
                         <Plus className="h-4 w-4" />
                       </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-80">
                       <div className="space-y-2">
                         <Label htmlFor="newCategory">New Category</Label>
                         <div className="flex space-x-2">
                           <Input
                             id="newCategory"
                             value={newCategoryName}
                             onChange={(e) => setNewCategoryName(e.target.value)}
                             placeholder="Category name"
                             disabled={isAddingCategory || isLoading}
                           />
                           <Button
                             type="button"
                             onClick={handleCreateCategory}
                             disabled={isAddingCategory || !newCategoryName.trim() || isLoading}
                           >
                             Add
                           </Button>
                         </div>
                       </div>
                     </PopoverContent>
                   </Popover>
                 </div>
                 <FormMessage />
               </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel htmlFor="description">Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Item description" rows={3} {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2 pt-3 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="enableSaleInfo">Sale Information</Label>
              <FormField
                control={form.control}
                name="enableSaleInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        id="enableSaleInfo"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Toggle Sale Information"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {form.watch('enableSaleInfo') && (
              <div className="space-y-4 pt-2">
                <FormField
                  control={form.control}
                  name="salePrice"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel htmlFor="salePrice">Sale Price*</FormLabel>
                      <FormControl>
                        <Input
                          id="salePrice"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value === null || field.value === undefined ? '' : field.value}
                          onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                       {form.formState.errors.salePrice && (
                         <FormMessage>{form.formState.errors.salePrice.message}</FormMessage>
                       )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel htmlFor="taxRate">Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          id="taxRate"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                           {...field}
                           value={field.value === null || field.value === undefined ? '' : field.value}
                           onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="enablePurchaseInfo">Purchase Information</Label>
              <FormField
                control={form.control}
                name="enablePurchaseInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                         id="enablePurchaseInfo"
                         checked={field.value}
                         onCheckedChange={field.onChange}
                         aria-label="Toggle Purchase Information"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {form.watch('enablePurchaseInfo') && (
              <div className="space-y-2 pt-2">
                 <FormField
                  control={form.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel htmlFor="purchasePrice">Purchase Price*</FormLabel>
                      <FormControl>
                        <Input
                           id="purchasePrice"
                           type="number"
                           step="0.01"
                           placeholder="0.00"
                           {...field}
                           value={field.value === null || field.value === undefined ? '' : field.value}
                           onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      {form.formState.errors.purchasePrice && (
                         <FormMessage>{form.formState.errors.purchasePrice.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
