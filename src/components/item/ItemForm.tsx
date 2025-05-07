
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Item, ItemCategory } from '@/types';
import { Switch } from '@/components/ui/switch';
import { Loader2, Package2, Sparkles } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['product', 'service']),
  categoryId: z.string().optional(),
  salePrice: z.union([
    z.number().min(0, 'Price must be a positive number'),
    z.string().transform(val => val === '' ? undefined : parseFloat(val))
  ]).optional(),
  purchasePrice: z.union([
    z.number().min(0, 'Price must be a positive number'),
    z.string().transform(val => val === '' ? undefined : parseFloat(val))
  ]).optional(),
  taxRate: z.union([
    z.number().min(0, 'Tax rate must be a positive number'),
    z.string().transform(val => val === '' ? undefined : parseFloat(val))
  ]).optional(),
  enableSaleInfo: z.boolean().default(true),
  enablePurchaseInfo: z.boolean().default(false),
  unit: z.string().min(1, 'Unit is required'),
});

export type ItemFormValues = z.infer<typeof itemSchema>;

interface ItemFormProps {
  item?: Item;
  onSubmit: (values: ItemFormValues) => Promise<void>;
  onCancel: () => void;
  categories: ItemCategory[];
  isLoading: boolean;
  onCreateCategory?: (name: string) => Promise<ItemCategory>;
}

const ItemForm: React.FC<ItemFormProps> = ({
  item,
  onSubmit,
  onCancel,
  categories,
  isLoading,
  onCreateCategory
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const defaultValues = {
    name: item?.name || '',
    description: item?.description || '',
    type: item?.type || 'product',
    categoryId: item?.categoryId || undefined,
    salePrice: item?.salePrice || undefined,
    purchasePrice: item?.purchasePrice || undefined,
    taxRate: item?.taxRate || undefined,
    enableSaleInfo: item?.enableSaleInfo ?? true,
    enablePurchaseInfo: item?.enablePurchaseInfo ?? false,
    unit: item?.unit || 'each',
  };

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues
  });

  const watchType = form.watch('type');
  const watchEnableSaleInfo = form.watch('enableSaleInfo');
  const watchEnablePurchaseInfo = form.watch('enablePurchaseInfo');

  const handleCreateCategory = async () => {
    if (!newCategoryName || !onCreateCategory) return;

    try {
      setIsCreatingCategory(true);
      const category = await onCreateCategory({ name: newCategoryName });
      form.setValue('categoryId', category.id);
      setIsCategoryDialogOpen(false);
      setNewCategoryName('');
      toast({
        title: 'Success',
        description: 'Category created successfully'
      });
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleFormSubmit = async (values: ItemFormValues) => {
    try {
      setIsSubmitting(true);
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  const unitOptions = [
    { value: 'each', label: 'Each' },
    { value: 'hour', label: 'Hour' },
    { value: 'day', label: 'Day' },
    { value: 'kg', label: 'Kilogram' },
    { value: 'g', label: 'Gram' },
    { value: 'lb', label: 'Pound' },
    { value: 'oz', label: 'Ounce' },
    { value: 'm', label: 'Meter' },
    { value: 'cm', label: 'Centimeter' },
    { value: 'in', label: 'Inch' },
    { value: 'ft', label: 'Foot' },
  ];

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row space-x-4 my-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="product" id="product" />
                        <label htmlFor="product" className="flex items-center cursor-pointer">
                          <Package2 className="mr-2 h-4 w-4" />
                          <span>Product</span>
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="service" id="service" />
                        <label htmlFor="service" className="flex items-center cursor-pointer">
                          <Sparkles className="mr-2 h-4 w-4" />
                          <span>Service</span>
                        </label>
                      </div>
                    </RadioGroup>
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
                  <div className="flex space-x-2">
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                          {onCreateCategory && (
                            <SelectItem 
                              value="new" 
                              onClick={(e) => {
                                e.preventDefault();
                                setIsCategoryDialogOpen(true);
                              }}
                            >
                              <span className="text-primary">+ Add new category</span>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOptions.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Item description"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="md:col-span-2">
              <div className="bg-muted/30 p-4 rounded-md space-y-4">
                <FormField
                  control={form.control}
                  name="enableSaleInfo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Enable Sale Information</FormLabel>
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

                {watchEnableSaleInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="salePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              min="0"
                              placeholder="0.00"
                              {...field}
                              value={field.value === undefined ? '' : field.value}
                              onChange={(e) => {
                                const value = e.target.value === '' ? undefined : Number(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taxRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Rate (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              min="0"
                              placeholder="0.00"
                              {...field}
                              value={field.value === undefined ? '' : field.value}
                              onChange={(e) => {
                                const value = e.target.value === '' ? undefined : Number(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="enablePurchaseInfo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Enable Purchase Information</FormLabel>
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

                {watchEnablePurchaseInfo && (
                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            placeholder="0.00"
                            {...field}
                            value={field.value === undefined ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : Number(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {item ? 'Update Item' : 'Create Item'}
            </Button>
          </div>
        </form>
      </Form>

      {/* New Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className={`${isMobile ? 'w-[95%] max-w-full' : 'sm:max-w-[425px]'}`}>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <FormLabel>Category Name</FormLabel>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
          </div>
          <DialogFooter className={`${isMobile ? 'flex-col gap-3' : ''}`}>
            <Button
              variant="outline"
              onClick={() => setIsCategoryDialogOpen(false)}
              className={`${isMobile ? 'w-full' : ''}`}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleCreateCategory}
              disabled={isCreatingCategory || !newCategoryName}
              className={`${isMobile ? 'w-full' : ''}`}
            >
              {isCreatingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemForm;
