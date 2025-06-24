import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ExpenseCategory } from '@/types';
import { Edit, MoreHorizontal, Tag, Trash } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ExpenseCategoryTableProps {
  categories: ExpenseCategory[];
  onEdit: (category: ExpenseCategory) => void;
  onDelete: (id: string) => void;
}

const ExpenseCategoryTable: React.FC<ExpenseCategoryTableProps> = ({
  categories,
  onEdit,
  onDelete,
}) => {
  const isMobile = useIsMobile();
  const [categoryToDelete, setCategoryToDelete] = useState<ExpenseCategory | null>(null);

  const handleDelete = (category: ExpenseCategory) => {
    setCategoryToDelete(category);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      onDelete(categoryToDelete.id);
      setCategoryToDelete(null);
    }
  };

  if (isMobile) {
    return (
      <>
        <div className="space-y-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-card rounded-md border p-4 shadow-sm cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onEdit(category)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {category.color ? (
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300" 
                        style={{ backgroundColor: category.color }}
                      />
                    ) : (
                      <Tag className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{category.name}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(category); }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDelete(category); }}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {category.description && (
                <div className="text-sm text-muted-foreground">
                  {category.description}
                </div>
              )}
            </div>
          ))}
        </div>

        <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the category "{categoryToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Color</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {category.color ? (
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300" 
                      style={{ backgroundColor: category.color }}
                    />
                  ) : (
                    <Tag className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">{category.name}</span>
                </div>
              </TableCell>
              <TableCell>
                {category.description || (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {category.color ? (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border border-gray-300" 
                      style={{ backgroundColor: category.color }}
                    />
                    <code className="text-xs text-muted-foreground">
                      {category.color}
                    </code>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(category)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(category)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "{categoryToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ExpenseCategoryTable;