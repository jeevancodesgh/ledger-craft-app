import { 
  Expense, 
  ExpenseCategory, 
  SupabaseExpense, 
  SupabaseExpenseCategory,
  ExpenseStatus,
  PaymentMethod 
} from '@/types'

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
}

// Expense Category Fixtures
export const mockSupabaseExpenseCategory: SupabaseExpenseCategory = {
  id: 'cat-1',
  name: 'Office Supplies',
  description: 'General office supplies and materials',
  color: '#FF6B35',
  user_id: mockUser.id,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockExpenseCategory: ExpenseCategory = {
  id: 'cat-1',
  name: 'Office Supplies',
  description: 'General office supplies and materials',
  color: '#FF6B35',
  userId: mockUser.id,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

export const mockCreateExpenseCategoryData: Omit<ExpenseCategory, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Travel',
  description: 'Business travel expenses',
  color: '#4ECDC4',
  userId: mockUser.id,
}

// Expense Fixtures
export const mockSupabaseExpense: SupabaseExpense = {
  id: 'exp-1',
  description: 'Office supplies purchase',
  amount: 125.50,
  category_id: 'cat-1',
  account_id: 'acc-1',
  vendor_name: 'Staples',
  receipt_url: 'https://example.com/receipt.pdf',
  expense_date: '2024-01-15',
  status: 'pending' as ExpenseStatus,
  is_billable: false,
  customer_id: null,
  tax_amount: 12.55,
  currency: 'USD',
  payment_method: 'card' as PaymentMethod,
  notes: 'Monthly office supply order',
  user_id: mockUser.id,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
}

export const mockExpense: Expense = {
  id: 'exp-1',
  description: 'Office supplies purchase',
  amount: 125.50,
  categoryId: 'cat-1',
  accountId: 'acc-1',
  vendorName: 'Staples',
  receiptUrl: 'https://example.com/receipt.pdf',
  expenseDate: '2024-01-15',
  status: 'pending',
  isBillable: false,
  customerId: null,
  taxAmount: 12.55,
  currency: 'USD',
  paymentMethod: 'card',
  notes: 'Monthly office supply order',
  userId: mockUser.id,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
}

export const mockCreateExpenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'category' | 'account' | 'customer'> = {
  description: 'Client lunch meeting',
  amount: 85.00,
  categoryId: 'cat-2',
  accountId: 'acc-1',
  vendorName: 'Restaurant ABC',
  receiptUrl: null,
  expenseDate: '2024-01-20',
  status: 'pending',
  isBillable: true,
  customerId: 'cust-1',
  taxAmount: 8.50,
  currency: 'USD',
  paymentMethod: 'card',
  notes: 'Lunch with client to discuss project',
  userId: mockUser.id,
}

export const mockSupabaseExpenseWithJoins = {
  ...mockSupabaseExpense,
  expense_categories: mockSupabaseExpenseCategory,
  accounts: {
    id: 'acc-1',
    name: 'Business Checking',
    type: 'bank',
    currency: 'USD',
    opening_balance: 5000,
    current_balance: 4500,
    user_id: mockUser.id,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  customers: null,
}

export const mockExpenseFilters = {
  categoryId: 'cat-1',
  accountId: 'acc-1',
  customerId: 'cust-1',
  status: 'pending' as ExpenseStatus,
  dateFrom: '2024-01-01',
  dateTo: '2024-01-31',
}

// Error fixtures
export const mockSupabaseError = {
  message: 'Database error',
  code: 'PGRST301',
}

export const mockNotFoundError = {
  message: 'Record not found',
  code: 'PGRST116',
}