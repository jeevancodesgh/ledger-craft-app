import React from 'react';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ItemCategory } from '@/types';
import { CategoryForm } from './CategoryForm';
import { DrawerFormLayout } from '@/components/ui/DrawerFormLayout';

interface CategoryDrawerProps {
  category?: ItemCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: ItemCategory) => Promise<void>;
  isLoading: boolean;
  title?: string;
  description?: string;
}

const CategoryDrawer: React.FC<CategoryDrawerProps> = ({
  category,
  open,
  onOpenChange,
  onSave,
  isLoading,
  title = 'Category Details',
  description = 'View or edit category information',
}) => {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="drawer-content">
        <DrawerFormLayout
          title={category ? `Edit ${category.name}` : 'Create New Category'}
          description={description}
          footer={
            <>
              <Button variant="outline" type="button" onClick={handleClose} disabled={isLoading} className="flex-1 h-12">
                Cancel
              </Button>
              <Button type="submit" form="category-form" disabled={isLoading} className="flex-1 h-12">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
            </>
          }
        >
          <CategoryForm
            initialData={category}
            onSubmit={onSave}
            onCancel={handleClose}
            isLoading={isLoading}
          />
        </DrawerFormLayout>
      </DrawerContent>
    </Drawer>
  );
};

export default CategoryDrawer; 