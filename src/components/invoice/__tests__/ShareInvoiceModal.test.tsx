import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ShareInvoiceModal from '../ShareInvoiceModal';
import { Invoice } from '@/types/index';

// Mock the dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/services/supabaseService', () => ({
  sharedInvoiceService: {
    createSharedInvoice: vi.fn().mockResolvedValue({
      shareToken: 'test-token-123',
      id: '1',
      invoiceId: '1',
      templateName: 'modern',
      expiresAt: null,
      createdAt: new Date().toISOString(),
    }),
  },
}));

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => 
    open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, defaultValue }: { 
    children: React.ReactNode; 
    onValueChange: (value: string) => void;
    defaultValue?: string;
  }) => (
    <div data-testid="template-select" data-default-value={defaultValue}>
      <select onChange={(e) => onValueChange(e.target.value)} defaultValue={defaultValue}>
        <option value="classic">Classic</option>
        <option value="modern">Modern</option>
        <option value="minimal">Minimal</option>
        <option value="executive">Executive</option>
        <option value="corporate">Corporate</option>
        <option value="modernPro">Modern Pro</option>
      </select>
      {children}
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => 
    <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}));

const mockInvoice: Invoice = {
  id: '1',
  invoiceNumber: 'INV-001',
  customerId: '1',
  customer: {
    id: '1',
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '123-456-7890',
    address: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    zip: '12345',
    country: 'Test Country',
    isVip: false,
    userId: 'user1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  date: new Date().toISOString(),
  dueDate: new Date().toISOString(),
  items: [],
  subtotal: 100,
  taxAmount: 10,
  total: 110,
  status: 'draft',
  currency: 'USD',
  notes: 'Test notes',
  terms: 'Test terms',
  userId: 'user1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  templateName: 'modern', // This is the key field we're testing
};

const defaultProps = {
  open: true,
  onOpenChange: jest.fn(),
  invoice: mockInvoice,
  businessName: 'Test Business',
};

describe('ShareInvoiceModal Template Selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use saved template as default selection', async () => {
    render(<ShareInvoiceModal {...defaultProps} />);

    // Wait for modal to be rendered
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Check if the template select has the correct default value
    const templateSelect = screen.getByTestId('template-select');
    expect(templateSelect).toHaveAttribute('data-default-value', 'modern');

    // Verify the select element has the correct default value
    const selectElement = templateSelect.querySelector('select');
    expect(selectElement).toHaveValue('modern');
  });

  it('should default to classic when no template is saved', async () => {
    const invoiceWithoutTemplate = {
      ...mockInvoice,
      templateName: undefined,
    };

    render(
      <ShareInvoiceModal 
        {...defaultProps} 
        invoice={invoiceWithoutTemplate} 
      />
    );

    // Wait for modal to be rendered
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Check if the template select defaults to classic
    const templateSelect = screen.getByTestId('template-select');
    expect(templateSelect).toHaveAttribute('data-default-value', 'classic');

    // Verify the select element has the correct default value
    const selectElement = templateSelect.querySelector('select');
    expect(selectElement).toHaveValue('classic');
  });

  it('should handle different saved template types correctly', async () => {
    const testCases = [
      { templateName: 'corporate', expected: 'corporate' },
      { templateName: 'minimal', expected: 'minimal' },
      { templateName: 'executive', expected: 'executive' },
      { templateName: 'modernPro', expected: 'modernPro' },
      { templateName: 'classic', expected: 'classic' },
    ];

    for (const testCase of testCases) {
      const invoiceWithTemplate = {
        ...mockInvoice,
        templateName: testCase.templateName,
      };

      const { unmount } = render(
        <ShareInvoiceModal 
          {...defaultProps} 
          invoice={invoiceWithTemplate} 
        />
      );

      // Wait for modal to be rendered
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Check if the template select has the correct default value
      const templateSelect = screen.getByTestId('template-select');
      expect(templateSelect).toHaveAttribute('data-default-value', testCase.expected);

      // Verify the select element has the correct default value
      const selectElement = templateSelect.querySelector('select');
      expect(selectElement).toHaveValue(testCase.expected);

      unmount();
    }
  });

  it('should allow changing template selection', async () => {
    const user = userEvent.setup();
    
    render(<ShareInvoiceModal {...defaultProps} />);

    // Wait for modal to be rendered
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Find and change the select value
    const selectElement = screen.getByRole('combobox') || 
                         screen.getByTestId('template-select')?.querySelector('select');
    
    if (selectElement) {
      await user.selectOptions(selectElement, 'corporate');
      expect(selectElement).toHaveValue('corporate');
    }
  });

  it('should create share link with selected template', async () => {
    const user = userEvent.setup();
    const { sharedInvoiceService } = require('@/services/supabaseService');
    
    render(<ShareInvoiceModal {...defaultProps} />);

    // Wait for modal to be rendered
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Find the create link button
    const createButton = screen.getByRole('button', { name: /create.*link/i }) ||
                        screen.getByRole('button', { name: /generate.*link/i });

    if (createButton) {
      await user.click(createButton);

      // Wait for the service to be called
      await waitFor(() => {
        expect(sharedInvoiceService.createSharedInvoice).toHaveBeenCalledWith(
          '1', // invoice ID
          'modern', // template name (from the default)
          undefined // expiration
        );
      });
    }
  });
});