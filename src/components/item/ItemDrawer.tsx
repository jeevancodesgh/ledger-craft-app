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
  onCreateCategory?: (name: string) => Promise<ItemCategory>;
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
  const drawerSize = isMobile ? 'h-[92%]' : 'h-[85%]';

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={`${drawerSize} overflow-y-auto`}>
        <div className="mx-auto w-full max-w-3xl">
          <DrawerHeader>
            <DrawerTitle>{item ? `Edit ${item.name}` : 'Create New Item'}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <ItemForm
              initialData={item}
              onSubmit={onSave}
              onCancel={handleClose}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ItemDrawer;
