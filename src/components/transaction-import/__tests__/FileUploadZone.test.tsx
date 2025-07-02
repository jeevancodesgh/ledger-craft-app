import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUploadZone } from '../FileUploadZone';
import { BankAccount } from '@/types/bankTransaction';

const mockBankAccounts: BankAccount[] = [
  {
    id: '1',
    accountName: 'Test Checking',
    accountNumber: '12-3456-7890123-00',
    bankName: 'ANZ Bank',
    accountType: 'checking',
    currency: 'NZD',
    openingBalance: 1000,
    currentBalance: 1500,
    isActive: true,
    userId: 'test-user',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    accountName: 'Test Savings',
    accountNumber: '12-3456-7890123-01',
    bankName: 'ANZ Bank',
    accountType: 'savings',
    currency: 'NZD',
    openingBalance: 5000,
    currentBalance: 5200,
    isActive: true,
    userId: 'test-user',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

describe('FileUploadZone', () => {
  const mockOnFileSelect = vi.fn();
  const mockOnAccountSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render bank account selection', () => {
    render(
      <FileUploadZone
        onFileSelect={mockOnFileSelect}
        bankAccounts={mockBankAccounts}
        selectedAccount={null}
        onAccountSelect={mockOnAccountSelect}
      />
    );

    expect(screen.getByText('Select Bank Account')).toBeInTheDocument();
    expect(screen.getByText('Test Checking')).toBeInTheDocument();
    expect(screen.getByText('Test Savings')).toBeInTheDocument();
  });

  it('should show empty state when no bank accounts', () => {
    render(
      <FileUploadZone
        onFileSelect={mockOnFileSelect}
        bankAccounts={[]}
        selectedAccount={null}
        onAccountSelect={mockOnAccountSelect}
      />
    );

    expect(screen.getByText('No active bank accounts found. Please add a bank account first.')).toBeInTheDocument();
  });

  it('should call onAccountSelect when account is clicked', async () => {
    const user = userEvent.setup();

    render(
      <FileUploadZone
        onFileSelect={mockOnFileSelect}
        bankAccounts={mockBankAccounts}
        selectedAccount={null}
        onAccountSelect={mockOnAccountSelect}
      />
    );

    await user.click(screen.getByText('Test Checking'));

    expect(mockOnAccountSelect).toHaveBeenCalledWith(mockBankAccounts[0]);
  });

  it('should show upload zone with selected account', () => {
    render(
      <FileUploadZone
        onFileSelect={mockOnFileSelect}
        bankAccounts={mockBankAccounts}
        selectedAccount={mockBankAccounts[0]}
        onAccountSelect={mockOnAccountSelect}
      />
    );

    expect(screen.getByText('Drop your bank statement here, or')).toBeInTheDocument();
    // Check for the selected account info separately since it may be in different elements
    expect(screen.getByText('Selected Account:')).toBeInTheDocument();
    expect(screen.getByText('Test Checking (ANZ Bank)')).toBeInTheDocument();
  });

  it('should show disabled state when no account selected', () => {
    render(
      <FileUploadZone
        onFileSelect={mockOnFileSelect}
        bankAccounts={mockBankAccounts}
        selectedAccount={null}
        onAccountSelect={mockOnAccountSelect}
      />
    );

    expect(screen.getByText('Select a bank account first')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <FileUploadZone
        onFileSelect={mockOnFileSelect}
        bankAccounts={mockBankAccounts}
        selectedAccount={mockBankAccounts[0]}
        onAccountSelect={mockOnAccountSelect}
        loading={true}
      />
    );

    expect(screen.getByText('Processing file...')).toBeInTheDocument();
  });

  it('should show supported formats info', () => {
    render(
      <FileUploadZone
        onFileSelect={mockOnFileSelect}
        bankAccounts={mockBankAccounts}
        selectedAccount={null}
        onAccountSelect={mockOnAccountSelect}
      />
    );

    expect(screen.getByText('Supported File Formats')).toBeInTheDocument();
    expect(screen.getByText('CSV Files')).toBeInTheDocument();
    expect(screen.getByText('PDF Files')).toBeInTheDocument();
  });

  it('should highlight selected account', () => {
    render(
      <FileUploadZone
        onFileSelect={mockOnFileSelect}
        bankAccounts={mockBankAccounts}
        selectedAccount={mockBankAccounts[0]}
        onAccountSelect={mockOnAccountSelect}
      />
    );

    const selectedAccountCard = screen.getByText('Test Checking').closest('.ring-2');
    expect(selectedAccountCard).toBeInTheDocument();
  });

  it('should display account balances correctly', () => {
    render(
      <FileUploadZone
        onFileSelect={mockOnFileSelect}
        bankAccounts={mockBankAccounts}
        selectedAccount={null}
        onAccountSelect={mockOnAccountSelect}
      />
    );

    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    expect(screen.getByText('$5,200.00')).toBeInTheDocument();
  });

  it('should display account types correctly', () => {
    render(
      <FileUploadZone
        onFileSelect={mockOnFileSelect}
        bankAccounts={mockBankAccounts}
        selectedAccount={null}
        onAccountSelect={mockOnAccountSelect}
      />
    );

    expect(screen.getByText('CHECKING')).toBeInTheDocument();
    expect(screen.getByText('SAVINGS')).toBeInTheDocument();
  });
});