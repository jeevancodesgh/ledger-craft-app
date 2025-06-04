import React, { useState, useEffect } from 'react';
import { 
  Command, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem,
  CommandSeparator
} from '@/components/ui/command';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { PlusCircle, SearchIcon, Package2, Sparkles } from 'lucide-react';
import { Item } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppContext } from '@/context/AppContext';
import { itemService } from '@/services/supabaseService';

interface ItemSelectorProps {
  onItemSelect: (item: Item) => void;
  onCreateNewItem?: () => void;
  buttonClassName?: string;
  iconOnly?: boolean;
  refetch: () => void;
}

const ItemSelector: React.FC<ItemSelectorProps> = ({ 
  onItemSelect,
  onCreateNewItem,
  buttonClassName = "",
  iconOnly = false,
  refetch
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const { itemCategories } = useAppContext();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedItems = await itemService.getItems();
        setItems(fetchedItems);
      } catch (err) {
        console.error("Error fetching items:", err);
        setError("Failed to load items.");
        setItems([]); // Clear items on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [refetch]); // Refetch when the refetch function changes

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.category?.name && item.category.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleItemSelect = (item: Item) => {
    onItemSelect(item);
    setOpen(false);
    setSearchTerm('');
  };

  const handleCreateNewItem = () => {
    if (onCreateNewItem) {
      onCreateNewItem();
      setOpen(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchTerm('');
    }
  };
  
  // Group items by type
  const products = filteredItems.filter(item => item.type === 'product');
  const services = filteredItems.filter(item => item.type === 'service');

  const content = (
    <>
      <DialogHeader className="p-4">
        <DialogTitle>Select an Item</DialogTitle>
        <DialogDescription>
          Search for an existing item or create a new one.
        </DialogDescription>
      </DialogHeader>
      <Command className="rounded-lg border shadow-md">
        <div className="flex items-center border-b px-3">
          <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput
            autoFocus
            placeholder="Search items..."
            className="flex h-11 w-full rounded-md bg-transparent py-3 outline-none placeholder:text-muted-foreground"
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
        </div>
        <CommandList className="max-h-[300px] overflow-auto">
          <CommandEmpty>No items found.</CommandEmpty>
          
          {products.length > 0 && (
            <CommandGroup heading="Products">
              {products.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`product-${item.id}`}
                  onSelect={() => handleItemSelect(item)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    <Package2 className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground flex gap-3">
                        <span>{item.enableSaleInfo && item.salePrice ? `$${item.salePrice.toFixed(2)}` : ""}</span>
                        {item.category?.name && <span>{item.category.name}</span>}
                      </div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          
          {services.length > 0 && (
            <CommandGroup heading="Services">
              {services.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`service-${item.id}`}
                  onSelect={() => handleItemSelect(item)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    <Sparkles className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground flex gap-3">
                        <span>{item.enableSaleInfo && item.salePrice ? `$${item.salePrice.toFixed(2)}` : ""}</span>
                        {item.category?.name && <span>{item.category.name}</span>}
                      </div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
        {/* Create New Item Button */}
        {onCreateNewItem && (
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              onClick={handleCreateNewItem}
              className="w-full justify-start text-primary"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Item
            </Button>
          </div>
        )}
      </Command>
    </>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            size="sm" // Mobile size is always sm
            className={buttonClassName}
            disabled={isLoading} // Disable button while loading
          >
            {iconOnly ? (
              <Package2 className="h-4 w-4" />
            ) : (
              "Select Item"
            )}
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[95%]"> {/* Full page height */}
          {/* Use DrawerHeader, DrawerTitle, etc. for mobile */}
          {/* <DrawerHeader>
            <DrawerTitle>Select an Item</DrawerTitle>
            <DrawerDescription>
              Search for an existing item or create a new one.
            </DrawerDescription>
          </DrawerHeader> */}
          {content} {/* Reuse the common content */}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="default" // Desktop size is always default
          className={buttonClassName}
          disabled={isLoading} // Disable button while loading
        >
          {iconOnly ? (
            <Package2 className="h-4 w-4" />
          ) : (
            "Select Item"
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className={`p-0 ${isMobile ? 'w-[95%]' : 'sm:max-w-[700px]'}`}> {/* Wider desktop dialog */}
        {/* Use DialogHeader, DialogTitle, etc. for desktop */}
        {content} {/* Reuse the common content */}
      </DialogContent>
    </Dialog>
  );
};

export default ItemSelector;
