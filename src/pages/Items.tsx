
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Item, ItemCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, Loader2, Plus, Search } from 'lucide-react';
import ItemsTable from '@/components/item/ItemsTable';
import ItemDrawer from '@/components/item/ItemDrawer';
import { ItemFormValues } from '@/components/item/ItemForm';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';

const ItemsPage: React.FC = () => {
  const {
    items,
    isLoadingItems,
    createItem,
    updateItem,
    deleteItem,
    itemCategories,
    isLoadingItemCategories,
    createItemCategory,
  } = useAppContext();

  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | undefined>(undefined);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [itemTypeFilter, setItemTypeFilter] = useState<'all' | 'product' | 'service'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    let result = [...items];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          (item.description && item.description.toLowerCase().includes(term)) ||
          (item.category?.name && item.category.name.toLowerCase().includes(term))
      );
    }

    // Apply type filter
    if (itemTypeFilter !== 'all') {
      result = result.filter((item) => item.type === itemTypeFilter);
    }

    // Apply category filter
    if (categoryFilter) {
      result = result.filter((item) => item.categoryId === categoryFilter);
    }

    setFilteredItems(result);
  }, [items, searchTerm, itemTypeFilter, categoryFilter]);

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(undefined);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleSave = async (values: ItemFormValues) => {
    try {
      if (selectedItem) {
        await updateItem(selectedItem.id, values);
      } else {
        await createItem(values);
      }
      setIsDrawerOpen(false);
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleCreateCategory = async (data: { name: string }) => {
    return await createItemCategory(data);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setItemTypeFilter('all');
    setCategoryFilter(null);
  };

  if (isLoadingItems || isLoadingItemCategories) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Items</h1>
          <p className="text-muted-foreground mt-1">Manage your products and services</p>
        </div>
        <Button onClick={handleCreate} className="whitespace-nowrap">
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-shrink-0">
            <Tabs
              value={itemTypeFilter}
              onValueChange={(value) => setItemTypeFilter(value as 'all' | 'product' | 'service')}
              className="w-fit"
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="product">Products</TabsTrigger>
                <TabsTrigger value="service">Services</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={categoryFilter === null ? "bg-accent text-accent-foreground" : ""}
                onClick={() => setCategoryFilter(null)}
              >
                All Categories
              </DropdownMenuItem>
              {itemCategories.map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  className={categoryFilter === category.id ? "bg-accent text-accent-foreground" : ""}
                  onClick={() => setCategoryFilter(category.id)}
                >
                  {category.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearFilters}>
                Clear Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No items found</h3>
          <p className="text-muted-foreground mt-2">
            {items.length === 0
              ? "You haven't created any items yet. Create one to get started."
              : "No items match your search criteria. Try adjusting your filters."}
          </p>
          {items.length === 0 && (
            <Button onClick={handleCreate} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Item
            </Button>
          )}
          {items.length > 0 && (
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <ItemsTable
          items={filteredItems}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <ItemDrawer
        item={selectedItem}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onSave={handleSave}
        categories={itemCategories}
        isLoading={isLoadingItemCategories}
        onCreateCategory={handleCreateCategory}
        title={selectedItem ? `Edit ${selectedItem.name}` : 'Create New Item'}
      />
    </div>
  );
};

export default ItemsPage;
