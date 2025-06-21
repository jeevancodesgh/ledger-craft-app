import React from 'react';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Item, ItemCategory } from '@/types';
import { ItemForm } from './ItemForm';
import { DrawerFormLayout } from '@/components/ui/DrawerFormLayout';

interface ItemDrawerProps {
  item?: Item;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: Item) => Promise<void>;
  categories: ItemCategory[];
  isLoading: boolean;
  onCreateCategory?: (category: Omit<ItemCategory, "id" | "createdAt" | "updatedAt">) => Promise<ItemCategory>;
  title?: string;
  description?: string;
}

const ItemDrawer: React.FC<ItemDrawerProps> = ({
  item,
  open,
  onOpenChange,
  onSave,
  categories,
  isLoading,
  onCreateCategory,
  title = 'Item Details',
  description = 'View or edit item information'
}) => {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="drawer-content">
        <DrawerFormLayout
          title={item ? `Edit ${item.name}` : 'Create New Item'}
          description={description}
          footer={
            <>
              <Button variant="outline" type="button" onClick={handleClose} disabled={isLoading} className="flex-1 h-12">
                Cancel
              </Button>
              <Button type="submit" form="item-form" disabled={isLoading} className="flex-1 h-12">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
            </>
          }
        >
          <ItemForm
            initialData={item}
            onSubmit={onSave}
            isLoading={isLoading}
            categories={categories}
            onCreateCategory={onCreateCategory}
          />
        </DrawerFormLayout>
      </DrawerContent>
    </Drawer>
  );
};

export default ItemDrawer;
