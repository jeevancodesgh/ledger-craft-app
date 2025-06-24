import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ExpenseTable from '@/components/expense/ExpenseTable';
import ExpenseFormDrawer from '@/components/expense/ExpenseFormDrawer';
import { Expense } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ExpenseFormValues } from '@/components/expense/ExpenseFormDrawer';

const Expenses = () => {
  const { 
    expenses, 
    isLoadingExpenses, 
    createExpense, 
    updateExpense, 
    deleteExpense 
  } = useAppContext();
  const { toast } = useToast();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenDrawer = () => {
    setSelectedExpense(null);
    setIsDrawerOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedExpense(null);
  };

  const handleSaveExpense = async (expenseData: ExpenseFormValues) => {
    try {
      setIsSaving(true);
      
      const mappedData = {
        description: expenseData.description,
        amount: expenseData.amount,
        categoryId: expenseData.categoryId === 'no-category' ? null : expenseData.categoryId || null,
        accountId: expenseData.accountId === 'no-account' ? null : expenseData.accountId || null,
        vendorName: expenseData.vendorName || null,
        receiptUrl: expenseData.receiptUrl || null,
        expenseDate: expenseData.expenseDate,
        status: expenseData.status,
        isBillable: expenseData.isBillable,
        customerId: expenseData.customerId === 'no-customer' ? null : expenseData.customerId || null,
        taxAmount: expenseData.taxAmount,
        currency: expenseData.currency,
        paymentMethod: expenseData.paymentMethod || null,
        notes: expenseData.notes || null,
      };

      if (selectedExpense) {
        // Update existing expense
        await updateExpense(selectedExpense.id, mappedData);
        toast({
          title: "Success",
          description: "Expense updated successfully",
        });
      } else {
        // Create new expense
        await createExpense(mappedData);
        toast({
          title: "Success",
          description: "Expense created successfully",
        });
      }
      handleCloseDrawer();
    } catch (error) {
      console.error("Failed to save expense:", error);
      toast({
        title: "Error",
        description: `Failed to save expense: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense(id);
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete expense:", error);
      toast({
        title: "Error",
        description: `Failed to delete expense: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  if (isLoadingExpenses) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Manage your business expenses and track spending.
          </p>
        </div>
        <Button onClick={handleOpenDrawer}>
          <Plus className="mr-2 h-4 w-4" />
          New Expense
        </Button>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <div className="text-lg font-medium mb-2">No expenses yet</div>
            <div className="text-sm">Get started by creating your first expense.</div>
          </div>
          <Button className="mt-4" onClick={handleOpenDrawer}>
            <Plus className="mr-2 h-4 w-4" />
            Create Expense
          </Button>
        </div>
      ) : (
        <ExpenseTable
          expenses={expenses}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
        />
      )}

      <ExpenseFormDrawer
        open={isDrawerOpen}
        onOpenChange={handleCloseDrawer}
        initialValues={selectedExpense}
        onSubmit={handleSaveExpense}
      />
    </div>
  );
};

export default Expenses;