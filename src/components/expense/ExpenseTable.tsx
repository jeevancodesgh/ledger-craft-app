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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Expense } from '@/types';
import { formatCurrency } from '@/utils/invoiceUtils';
import { Edit, MoreHorizontal, Receipt, Trash, ExternalLink, FileImage, FileText, Eye } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'approved':
      return 'default';
    case 'rejected':
      return 'destructive';
    case 'pending':
    default:
      return 'secondary';
  }
};

const getReceiptIcon = (url: string) => {
  if (!url) return null;
  
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('.pdf') || lowerUrl.includes('pdf')) {
    return <FileText className="h-4 w-4" />;
  }
  if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || 
      lowerUrl.includes('.png') || lowerUrl.includes('.gif') || 
      lowerUrl.includes('.webp')) {
    return <FileImage className="h-4 w-4" />;
  }
  return <FileText className="h-4 w-4" />;
};

const getReceiptLabel = (url: string) => {
  if (!url) return 'No receipt';
  
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('.pdf') || lowerUrl.includes('pdf')) {
    return 'PDF Receipt';
  }
  if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || 
      lowerUrl.includes('.png') || lowerUrl.includes('.gif') || 
      lowerUrl.includes('.webp')) {
    return 'Image Receipt';
  }
  return 'Receipt';
};

const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  onEdit,
  onDelete,
}) => {
  const isMobile = useIsMobile();
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const handleDelete = (expense: Expense) => {
    setExpenseToDelete(expense);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      onDelete(expenseToDelete.id);
      setExpenseToDelete(null);
    }
  };

  if (isMobile) {
    return (
      <>
        <div className="space-y-4">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-card rounded-md border p-4 shadow-sm cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onEdit(expense)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{expense.description}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(expense); }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDelete(expense); }}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span>Amount:</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(expense.amount, expense.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Date:</span>
                  <span>{format(new Date(expense.expenseDate), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Status:</span>
                  <Badge variant={getStatusBadgeVariant(expense.status)}>
                    {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                  </Badge>
                </div>
                {expense.category && (
                  <div className="flex justify-between items-center">
                    <span>Category:</span>
                    <div className="flex items-center gap-1">
                      {expense.category.color && (
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: expense.category.color }}
                        />
                      )}
                      <span>{expense.category.name}</span>
                    </div>
                  </div>
                )}
                {expense.vendorName && (
                  <div className="flex justify-between items-center">
                    <span>Vendor:</span>
                    <span>{expense.vendorName}</span>
                  </div>
                )}
                {expense.isBillable && (
                  <div className="flex justify-between items-center">
                    <span>Billable:</span>
                    <Badge variant="outline">Billable</Badge>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Receipt:</span>
                  {expense.receiptUrl ? (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        window.open(expense.receiptUrl!, '_blank'); 
                      }}
                      className="h-7 px-2"
                      title={`View ${getReceiptLabel(expense.receiptUrl)}`}
                    >
                      {getReceiptIcon(expense.receiptUrl)}
                      <span className="ml-1 text-xs">{getReceiptLabel(expense.receiptUrl)}</span>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">No receipt</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <AlertDialog open={!!expenseToDelete} onOpenChange={() => setExpenseToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the expense "{expenseToDelete?.description}"? This action cannot be undone.
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
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Receipt</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{expense.description}</div>
                    {expense.isBillable && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Billable
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(expense.amount, expense.currency)}
                {expense.taxAmount > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Tax: {formatCurrency(expense.taxAmount, expense.currency)}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {format(new Date(expense.expenseDate), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                {expense.category ? (
                  <div className="flex items-center gap-2">
                    {expense.category.color && (
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: expense.category.color }}
                      />
                    )}
                    <span>{expense.category.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Uncategorized</span>
                )}
              </TableCell>
              <TableCell>
                {expense.vendorName || (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(expense.status)}>
                  {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                {expense.receiptUrl ? (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open(expense.receiptUrl!, '_blank')}
                      className="h-8 px-2"
                      title={`View ${getReceiptLabel(expense.receiptUrl)}`}
                    >
                      {getReceiptIcon(expense.receiptUrl)}
                      <Eye className="h-3 w-3 ml-1" />
                    </Button>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {getReceiptLabel(expense.receiptUrl)}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">No receipt</span>
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
                    <DropdownMenuItem onClick={() => onEdit(expense)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(expense)}
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

      <AlertDialog open={!!expenseToDelete} onOpenChange={() => setExpenseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the expense "{expenseToDelete?.description}"? This action cannot be undone.
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

export default ExpenseTable;