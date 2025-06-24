import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExpenseFormDrawer from '../ExpenseFormDrawer';
import { useAppContext } from '@/context/AppContext';
import { mockExpenseCategories, mockAccounts, mockCustomers } from '@/test/fixtures/expenseFixtures';

// Mock the context
vi.mock('@/context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockContextValue = {
  expenseCategories: mockExpenseCategories,
  accounts: mockAccounts,
  customers: mockCustomers,
  isLoadingExpenseCategories: false,
  isLoadingAccounts: false,
  isLoadingCustomers: false,
};

describe('ExpenseFormDrawer', () => {
  const mockOnSubmit = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppContext).mockReturnValue(mockContextValue);
  });

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSubmit: mockOnSubmit,
  };

  it('renders the form when open', () => {
    render(<ExpenseFormDrawer {...defaultProps} />);
    
    expect(screen.getByText('Create Expense')).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
  });

  it('shows edit title when editing existing expense', () => {
    const initialValues = {
      id: '1',
      description: 'Test expense',
      amount: 100,
      categoryId: 'cat-1',
      accountId: 'acc-1',
      expenseDate: '2024-01-01',
      status: 'pending' as const,
      isBillable: false,
      taxAmount: 0,
      currency: 'USD',
      userId: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    render(<ExpenseFormDrawer {...defaultProps} initialValues={initialValues} />);
    
    expect(screen.getByText('Edit Expense')).toBeInTheDocument();
  });

  it('submits form with correct data', async () => {
    render(<ExpenseFormDrawer {...defaultProps} />);
    
    const descriptionInput = screen.getByLabelText(/description/i);
    const amountInput = screen.getByLabelText(/amount/i);
    const submitButton = screen.getByRole('button', { name: /create expense/i });

    fireEvent.change(descriptionInput, { target: { value: 'Test expense' } });
    fireEvent.change(amountInput, { target: { value: '150.50' } });
    
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Test expense',
          amount: 150.50,
        })
      );
    });
  });

  it('populates form fields when initialValues provided', () => {
    const initialValues = {
      id: '1',
      description: 'Existing expense',
      amount: 75.25,
      categoryId: 'cat-1',
      accountId: 'acc-1',
      vendorName: 'Test Vendor',
      expenseDate: '2024-01-15',
      status: 'approved' as const,
      isBillable: true,
      customerId: 'cust-1',
      taxAmount: 7.53,
      currency: 'USD',
      notes: 'Test notes',
      userId: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    render(<ExpenseFormDrawer {...defaultProps} initialValues={initialValues} />);
    
    expect(screen.getByDisplayValue('Existing expense')).toBeInTheDocument();
    expect(screen.getByDisplayValue('75.25')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Vendor')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
    expect(screen.getByDisplayValue('7.53')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();
  });

  it('shows customer field when isBillable is true', async () => {
    render(<ExpenseFormDrawer {...defaultProps} />);
    
    const billableSwitch = screen.getByRole('switch');
    fireEvent.click(billableSwitch);

    await waitFor(() => {
      expect(screen.getByText(/customer/i)).toBeInTheDocument();
    });
  });

  it('closes drawer when cancel button clicked', () => {
    render(<ExpenseFormDrawer {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('validates required fields', async () => {
    render(<ExpenseFormDrawer {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /create expense/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    });
  });

  it('validates amount field', async () => {
    render(<ExpenseFormDrawer {...defaultProps} />);
    
    const descriptionInput = screen.getByLabelText(/description/i);
    const amountInput = screen.getByLabelText(/amount/i);
    const submitButton = screen.getByRole('button', { name: /create expense/i });

    fireEvent.change(descriptionInput, { target: { value: 'Test' } });
    fireEvent.change(amountInput, { target: { value: '0' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument();
    });
  });
});