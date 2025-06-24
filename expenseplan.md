# Expense Management Implementation Plan

## Overview
This document outlines the comprehensive plan for implementing expense management functionality in the Ledger Craft application. The implementation will follow the existing architectural patterns and integrate seamlessly with the current codebase.

## Current Architecture Analysis

### Existing Strengths
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Authentication)
- **UI Framework**: Shadcn/ui + Radix UI + Tailwind CSS
- **State Management**: React Context API + custom hooks
- **Routing**: React Router v6
- **Security**: Row Level Security (RLS) with user isolation

### Current Database Tables
- `customers` - Customer information
- `invoices` - Invoice management
- `line_items` - Invoice line items
- `business_profiles` - Business information
- `items` - Product/service catalog
- `item_categories` - Item categorization
- `profiles` - User profiles
- `accounts` - Financial accounts

## Implementation Plan

### Phase 1: Core Foundation (High Priority)

#### 1. Database Schema Design
Create new tables in Supabase:

```sql
-- Expense categories table
CREATE TABLE expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  description text,
  color varchar,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Expenses table
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount decimal NOT NULL,
  category_id uuid REFERENCES expense_categories(id),
  account_id uuid REFERENCES accounts(id),
  vendor_name varchar,
  receipt_url varchar,
  expense_date date NOT NULL,
  status varchar DEFAULT 'pending', -- pending, approved, rejected
  is_billable boolean DEFAULT false,
  customer_id uuid REFERENCES customers(id), -- for billable expenses
  tax_amount decimal DEFAULT 0,
  currency varchar DEFAULT 'USD',
  payment_method varchar, -- cash, card, bank_transfer, etc.
  notes text,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Enable RLS
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only see their own expense categories" ON expense_categories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own expenses" ON expenses
  FOR ALL USING (auth.uid() = user_id);
```

#### 2. TypeScript Type Definitions
Add to `/src/types/index.ts`:

```typescript
export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category_id?: string;
  account_id?: string;
  vendor_name?: string;
  receipt_url?: string;
  expense_date: string;
  status: 'pending' | 'approved' | 'rejected';
  is_billable: boolean;
  customer_id?: string;
  tax_amount: number;
  currency: string;
  payment_method?: string;
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  // Populated fields
  category?: ExpenseCategory;
  account?: Account;
  customer?: Customer;
}
```

#### 3. Service Layer Extension
Extend `/src/services/supabaseService.ts`:

```typescript
// Expense Categories
export const getExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  // Implementation following existing patterns
};

export const createExpenseCategory = async (category: Omit<ExpenseCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ExpenseCategory> => {
  // Implementation
};

// Expenses
export const getExpenses = async (): Promise<Expense[]> => {
  // Implementation with joins for category, account, customer
};

export const createExpense = async (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Expense> => {
  // Implementation
};

export const updateExpense = async (id: string, expense: Partial<Expense>): Promise<Expense> => {
  // Implementation
};

export const deleteExpense = async (id: string): Promise<void> => {
  // Implementation
};
```

#### 4. Context Integration
Extend `/src/context/AppContext.tsx`:

```typescript
interface AppContextType {
  // ... existing properties
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  loadingExpenses: boolean;
  loadingExpenseCategories: boolean;
  refreshExpenses: () => Promise<void>;
  refreshExpenseCategories: () => Promise<void>;
}
```

#### 5. Core Components
Create component structure:

```
src/components/expense/
├── ExpenseForm.tsx          # Form for creating/editing expenses
├── ExpenseTable.tsx         # Table for displaying expenses
├── ExpenseDrawer.tsx        # Mobile-friendly expense form
├── ExpenseCategoryForm.tsx  # Form for expense categories
├── ExpenseCategorySelect.tsx # Category selection component
└── ExpenseFilters.tsx       # Filtering components
```

### Phase 2: User Interface (Medium Priority)

#### 6. Category Management
- CRUD operations for expense categories
- Color-coded categorization
- Category usage analytics

#### 7. Main Pages
Create pages:
- `/src/pages/Expenses.tsx` - Main expense management page
- `/src/pages/ExpenseCategories.tsx` - Category management page

#### 8. Navigation & Routing
Update `/src/components/layout/Sidebar.tsx`:
```typescript
{
  name: 'Expenses',
  href: '/expenses',
  icon: Receipt,
  current: pathname === '/expenses'
}
```

Update `/src/routes.tsx`:
```typescript
{
  path: '/expenses',
  element: <Expenses />
},
{
  path: '/expense-categories',
  element: <ExpenseCategories />
}
```

#### 9. Dashboard Integration
Add to `/src/pages/Dashboard.tsx`:
- Monthly expense summary widget
- Expense by category chart
- Recent expenses list
- Expense vs budget tracking

### Phase 3: Advanced Features (Low Priority)

#### 10. Account Integration
- Sync expense transactions with account balances
- Account-based expense filtering
- Cash flow impact analysis

#### 11. Receipt Upload
- Supabase Storage integration
- Image/PDF receipt handling
- OCR text extraction (future enhancement)

#### 12. Expense Reports
- Monthly/quarterly expense reports
- Category-wise analysis
- Tax reporting preparation
- Export functionality (PDF, CSV)

#### 13. Billable Expenses
- Link expenses to customers
- Invoice integration for reimbursement
- Markup calculation for billable expenses
- Time tracking integration (future)

## Technical Specifications

### Database Indexes
```sql
-- Performance indexes
CREATE INDEX idx_expenses_user_date ON expenses(user_id, expense_date DESC);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_account ON expenses(account_id);
CREATE INDEX idx_expense_categories_user ON expense_categories(user_id);
```

### API Patterns
Following existing patterns:
- User-scoped queries with RLS
- Comprehensive error handling
- Toast notifications for user feedback
- Loading states for async operations

### UI/UX Considerations
- Mobile-first responsive design
- Drawer-based forms for mobile
- Consistent with existing design system
- Keyboard shortcuts for power users
- Bulk operations support

### Security Considerations
- Row Level Security (RLS) for all tables
- User isolation for all operations
- Secure file upload handling
- Input validation and sanitization

## Success Metrics

### Functional Requirements
- ✅ Create, read, update, delete expenses
- ✅ Categorize expenses with custom categories
- ✅ Link expenses to accounts and customers
- ✅ Upload and manage receipts
- ✅ Generate expense reports
- ✅ Mobile-responsive interface

### Performance Requirements
- Page load time < 2 seconds
- Search/filter response < 500ms
- File upload progress indication
- Efficient data pagination

### Integration Requirements
- Seamless account balance updates
- Invoice integration for billable expenses
- Dashboard analytics integration
- Export functionality

## Timeline Estimate

### Phase 1 (Core Foundation): 1-2 weeks
- Database schema: 1-2 days
- Type definitions: 1 day
- Service layer: 2-3 days
- Context integration: 1 day
- Core components: 3-4 days

### Phase 2 (User Interface): 1-2 weeks
- Category management: 2-3 days
- Main pages: 2-3 days
- Navigation/routing: 1 day
- Dashboard integration: 2-3 days

### Phase 3 (Advanced Features): 2-3 weeks
- Account integration: 3-4 days
- Receipt upload: 4-5 days
- Reporting: 4-5 days
- Billable expenses: 3-4 days

**Total Estimated Timeline: 4-7 weeks**

## Next Steps

1. **Start with Phase 1**: Begin with database schema creation
2. **Iterative Development**: Implement features incrementally
3. **Testing**: Unit tests for services, integration tests for components
4. **User Feedback**: Gather feedback after each phase
5. **Documentation**: Update user documentation as features are added

## Dependencies

- Supabase database access for schema changes
- Supabase Storage for receipt uploads
- Existing authentication system
- Current UI component library
- React Router for navigation

---

This plan provides a comprehensive roadmap for implementing expense management while maintaining consistency with the existing Ledger Craft architecture and design patterns.