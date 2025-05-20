import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ItemCategory } from '@/types';
import { CategoryForm } from './CategoryForm';

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
      <DrawerContent className="flex flex-col max-h-[92vh] sm:max-h-[85vh] h-full">
        <div className="mx-auto w-full max-w-2xl flex flex-col flex-1">
          <DrawerHeader className="shrink-0">
            <DrawerTitle>{category ? `Edit ${category.name}` : 'Create New Category'}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-28">
            <CategoryForm
              initialData={category}
              onSubmit={onSave}
              onCancel={handleClose}
              isLoading={isLoading}
            />
          </div>
          <DrawerFooter className="sticky bottom-0 bg-background z-10 border-t flex flex-row gap-2 p-4">
            <Button variant="outline" type="button" onClick={handleClose} disabled={isLoading} className="flex-1 h-12">
              Cancel
            </Button>
            <Button type="submit" form="category-form" disabled={isLoading} className="flex-1 h-12">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CategoryDrawer; 