
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

interface ItemFormProps {
  initialData?: Item | null;
  onSubmit: (data: Item) => void;
  onCancel: () => void;
}

export function ItemForm({ initialData, onSubmit, onCancel }: ItemFormProps) {
  const { itemCategories, createItemCategory } = useAppContext();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [formData, setFormData] = useState<Partial<Item>>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    type: initialData?.type || 'product',
    categoryId: initialData?.categoryId || undefined,
    salePrice: initialData?.salePrice || undefined,
    purchasePrice: initialData?.purchasePrice || undefined,
    taxRate: initialData?.taxRate || undefined,
    enableSaleInfo: initialData?.enableSaleInfo ?? true,
    enablePurchaseInfo: initialData?.enablePurchaseInfo ?? false,
    unit: initialData?.unit || 'each',
  });

  const handleChange = (field: keyof Item, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const validateForm = () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return false;
    }

    if (formData.enableSaleInfo && !formData.salePrice) {
      toast({
        title: "Error",
        description: "Sale price is required when Sale Information is enabled",
        variant: "destructive",
      });
      return false;
    }

    if (formData.enablePurchaseInfo && !formData.purchasePrice) {
      toast({
        title: "Error",
        description: "Purchase price is required when Purchase Information is enabled",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      setIsAddingCategory(true);
      const newCategory = await createItemCategory({ name: newCategoryName });
      setFormData({
        ...formData,
        categoryId: newCategory.id
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Make sure required fields are present
      const itemData: Item = {
        id: initialData?.id || '',
        name: formData.name!,
        type: formData.type as 'product' | 'service',
        description: formData.description || null,
        categoryId: formData.categoryId || null,
        salePrice: formData.enableSaleInfo ? formData.salePrice || null : null,
        purchasePrice: formData.enablePurchaseInfo ? formData.purchasePrice || null : null,
        taxRate: formData.taxRate || null,
        enableSaleInfo: formData.enableSaleInfo || false,
        enablePurchaseInfo: formData.enablePurchaseInfo || false,
        unit: formData.unit || 'each',
        createdAt: initialData?.createdAt,
        updatedAt: initialData?.updatedAt,
      };
      
      onSubmit(itemData);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to save item",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Item Type</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value) => handleChange('type', value)}
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
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Input
              id="unit"
              value={formData.unit}
              onChange={(e) => handleChange('unit', e.target.value)}
              placeholder="each, hour, kg, etc."
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name">Name*</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Item name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <div className="flex space-x-2">
            <Select
              value={formData.categoryId}
              onValueChange={(value) => handleChange('categoryId', value)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {itemCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" size="icon">
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
                    />
                    <Button 
                      type="button" 
                      onClick={handleCreateCategory}
                      disabled={isAddingCategory || !newCategoryName.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Item description"
            rows={3}
          />
        </div>
        
        <div className="space-y-2 pt-3 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="enableSaleInfo">Sale Information</Label>
            <Switch
              id="enableSaleInfo"
              checked={formData.enableSaleInfo}
              onCheckedChange={(checked) => handleChange('enableSaleInfo', checked)}
            />
          </div>
          
          {formData.enableSaleInfo && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale Price*</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  value={formData.salePrice || ''}
                  onChange={(e) => handleChange('salePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  value={formData.taxRate || ''}
                  onChange={(e) => handleChange('taxRate', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-2 pt-3 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="enablePurchaseInfo">Purchase Information</Label>
            <Switch
              id="enablePurchaseInfo"
              checked={formData.enablePurchaseInfo}
              onCheckedChange={(checked) => handleChange('enablePurchaseInfo', checked)}
            />
          </div>
          
          {formData.enablePurchaseInfo && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="purchasePrice">Purchase Price*</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                value={formData.purchasePrice || ''}
                onChange={(e) => handleChange('purchasePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
