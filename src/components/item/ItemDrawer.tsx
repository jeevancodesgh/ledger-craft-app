import React, { useEffect } from 'react';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Item, ItemCategory } from '@/types';
import { ItemForm } from './ItemForm';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] sm:max-h-[85vh] drawer-content">
        <DrawerHeader className="shrink-0 flex-shrink-0 sticky top-0 bg-background z-10">
          <DrawerTitle>{item ? `Edit ${item.name}` : 'Create New Item'}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto p-4 pb-24">
          <ItemForm
            initialData={item}
            onSubmit={onSave}
            isLoading={isLoading}
            categories={categories}
            onCreateCategory={onCreateCategory}
          />
        </div>
        <DrawerFooter className="flex-row gap-2 px-4 pt-4 border-t bg-background sticky bottom-0">
          <Button variant="outline" type="button" onClick={handleClose} disabled={isLoading} className="flex-1 h-12">
            Cancel
          </Button>
          <Button type="submit" form="item-form" disabled={isLoading} className="flex-1 h-12">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default ItemDrawer;
