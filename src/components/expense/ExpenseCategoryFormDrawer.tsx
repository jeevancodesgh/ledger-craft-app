import React, { useEffect } from 'react';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ExpenseCategory } from '@/types';
import { DrawerFormLayout } from '@/components/ui/DrawerFormLayout';

const expenseCategoryFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional().or(z.literal('')),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Must be a valid hex color' }).optional().or(z.literal(''))
});

export type ExpenseCategoryFormValues = z.infer<typeof expenseCategoryFormSchema>;

interface ExpenseCategoryFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: ExpenseCategory | null;
  onSubmit: (values: ExpenseCategoryFormValues) => void;
}

const predefinedColors = [
  '#FF6B35', '#F7931E', '#FFD700', '#32CD32', '#20B2AA',
  '#4169E1', '#9932CC', '#DC143C', '#FF1493', '#00CED1',
  '#FF4500', '#DAA520', '#9ACD32', '#40E0D0', '#BA55D3'
];

const ExpenseCategoryFormDrawer: React.FC<ExpenseCategoryFormDrawerProps> = ({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
}) => {
  const form = useForm<ExpenseCategoryFormValues>({
    resolver: zodResolver(expenseCategoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      color: ''
    }
  });

  useEffect(() => {
    if (initialValues) {
      form.reset({
        name: initialValues.name || '',
        description: initialValues.description || '',
        color: initialValues.color || ''
      });
    } else {
      form.reset({
        name: '',
        description: '',
        color: ''
      });
    }
  }, [initialValues, form]);

  const handleSubmit = (values: ExpenseCategoryFormValues) => {
    onSubmit(values);
  };

  useEffect(() => {
    if (!open) {
      form.reset({
        name: '',
        description: '',
        color: ''
      });
    }
  }, [open, form]);

  const selectedColor = form.watch('color');

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="drawer-content">
        <DrawerFormLayout
          title={initialValues ? 'Edit Expense Category' : 'Create Expense Category'}
          description={initialValues ? 'Update the category details below.' : 'Fill in the category details below to create a new expense category.'}
          footer={
            <>
              <Button type="submit" form="expense-category-form" className="flex-1 h-12">
                {initialValues ? 'Update Category' : 'Create Category'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-12">
                Cancel
              </Button>
            </>
          }
        >
          <Form {...form}>
            <form id="expense-category-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter category name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter category description (optional)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <div className="space-y-3">
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input 
                            {...field} 
                            placeholder="#FF6B35" 
                            className="flex-1"
                          />
                          {selectedColor && (
                            <div 
                              className="w-8 h-8 rounded border border-gray-300"
                              style={{ backgroundColor: selectedColor }}
                            />
                          )}
                        </div>
                      </FormControl>
                      <div className="grid grid-cols-5 gap-2">
                        {predefinedColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded border-2 transition-all ${
                              selectedColor === color 
                                ? 'border-gray-800 scale-110' 
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => field.onChange(color)}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
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

export default ExpenseCategoryFormDrawer;