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
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, SearchIcon, Package2, Sparkles } from 'lucide-react';
import { Item } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';

interface ItemSelectorProps {
  items: Item[];
  onItemSelect: (item: Item) => void;
  onCreateNewItem?: () => void;
  buttonClassName?: string;
  iconOnly?: boolean;
}

const ItemSelector: React.FC<ItemSelectorProps> = ({ 
  items, 
  onItemSelect,
  onCreateNewItem,
  buttonClassName = "",
  iconOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredItems(items);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = items.filter(item => 
      item.name.toLowerCase().includes(term) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      (item.category?.name && item.category.name.toLowerCase().includes(term))
    );
    
    setFilteredItems(filtered);
  }, [searchTerm, items]);

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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"}
          className={buttonClassName}
        >
          {iconOnly ? (
            <Package2 className="h-4 w-4" />
          ) : (
            "Select Item"
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className={`p-0 ${isMobile ? 'w-[95%]' : 'sm:max-w-[550px]'}`}>
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
            
            {onCreateNewItem && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreateNewItem}
                    className="cursor-pointer"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Item
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default ItemSelector;
