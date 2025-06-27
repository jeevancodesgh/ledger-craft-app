import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import InvoiceForm from '../InvoiceForm';
import { Invoice, Customer, BusinessProfile } from '@/types/index';

// Mock the AppContext
const mockAppContext = {
  createItem: vi.fn(),
  items: [],
  isLoadingItems: false,
  units: ['each', 'kg', 'g'],
};

vi.mock('@/context/AppContext', () => ({
  useAppContext: () => mockAppContext,
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useBlocker: () => ({ state: 'unblocked' }),
  };
});

// Mock other dependencies
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/utils/pdfUtils', () => ({
  generateInvoicePdf: vi.fn(),
}));

// Mock UI components
vi.mock('@/components/ui/form', () => ({
  Form: ({ children }: { children: React.ReactNode }) => <form>{children}</form>,
  FormControl: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormField: ({ children, render }: { children?: React.ReactNode; render?: any }) => 
    render ? render({ field: { value: '', onChange: vi.fn() } }) : <div>{children}</div>,
  FormItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormLabel: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
  FormMessage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockCustomers: Customer[] = [
  {
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
];

const mockBusinessProfile: BusinessProfile = {
  id: '1',
  name: 'Test Business',
  email: 'business@test.com',
  phone: '123-456-7890',
  address: '123 Business St',
  city: 'Business City',
  state: 'Business State',
  zip: '12345',
  country: 'Business Country',
  currency: 'USD',
  logoUrl: null,
  theme: {
    primary: '#3B82F6',
    secondary: '#06B6D4',
    accent: '#10B981',
    text: '#111827',
    textLight: '#6B7280',
    background: '#F9FAFB',
    surface: '#FFFFFF',
  },
  defaultNotes: 'Thank you for your business!',
  defaultTerms: 'Payment due within 30 days',
  userId: 'user1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const defaultProps = {
  mode: 'create' as const,
  customers: mockCustomers,
  businessProfile: mockBusinessProfile,
  isLoadingCustomers: false,
  onSubmit: jest.fn(),
  onCancel: jest.fn(),
  availableItems: [],
  isLoadingItems: false,
  generatedInvoiceNumber: 'INV-001',
  isLoadingInvoiceNumber: false,
};

const InvoiceFormWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('InvoiceForm Template Saving', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should include templateName in form submission for create mode', async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <InvoiceFormWrapper>
        <InvoiceForm {...defaultProps} onSubmit={mockOnSubmit} />
      </InvoiceFormWrapper>
    );

    // Wait for form to be rendered
    await waitFor(() => {
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    // Look for template selector buttons (they should be rendered)
    const templateButtons = screen.getAllByRole('button');
    const modernTemplateButton = templateButtons.find(button => 
      button.textContent?.includes('Modern') || button.getAttribute('data-template') === 'modern'
    );

    if (modernTemplateButton) {
      await user.click(modernTemplateButton);
    }

    // Fill out required form fields
    const customerSelect = screen.getByRole('combobox');
    if (customerSelect) {
      await user.click(customerSelect);
      const customerOption = screen.getByText('Test Customer');
      await user.click(customerOption);
    }

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save/i }) || 
                        screen.getByRole('button', { name: /create/i });
    
    if (submitButton) {
      await user.click(submitButton);
    }

    // Wait for submission
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // Check if templateName was included in the submission
    const submissionArgs = mockOnSubmit.mock.calls[0];
    const formValues = submissionArgs[0];
    
    expect(formValues).toHaveProperty('templateName');
    console.log('Form submission values:', formValues);
  });

  it('should include templateName in form submission for edit mode', async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();

    const mockInitialValues: Partial<Invoice> = {
      id: '1',
      invoiceNumber: 'INV-001',
      customerId: '1',
      date: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      items: [],
      subtotal: 0,
      taxAmount: 0,
      total: 0,
      status: 'draft',
      currency: 'USD',
      notes: 'Test notes',
      terms: 'Test terms',
      templateName: 'classic',
    };

    render(
      <InvoiceFormWrapper>
        <InvoiceForm 
          {...defaultProps} 
          mode="edit"
          initialValues={mockInitialValues}
          onSubmit={mockOnSubmit} 
        />
      </InvoiceFormWrapper>
    );

    // Wait for form to be rendered with initial values
    await waitFor(() => {
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    // Change template selection
    const templateButtons = screen.getAllByRole('button');
    const corporateTemplateButton = templateButtons.find(button => 
      button.textContent?.includes('Corporate') || button.getAttribute('data-template') === 'corporate'
    );

    if (corporateTemplateButton) {
      await user.click(corporateTemplateButton);
    }

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save/i }) || 
                        screen.getByRole('button', { name: /update/i });
    
    if (submitButton) {
      await user.click(submitButton);
    }

    // Wait for submission
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // Check if templateName was included in the submission
    const submissionArgs = mockOnSubmit.mock.calls[0];
    const formValues = submissionArgs[0];
    
    expect(formValues).toHaveProperty('templateName');
    expect(formValues.templateName).toBe('corporate');
    console.log('Edit form submission values:', formValues);
  });

  it('should default to classic template when no template is specified', async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <InvoiceFormWrapper>
        <InvoiceForm {...defaultProps} onSubmit={mockOnSubmit} />
      </InvoiceFormWrapper>
    );

    // Wait for form to be rendered
    await waitFor(() => {
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    // Submit without changing template (should default to classic)
    const submitButton = screen.getByRole('button', { name: /save/i }) || 
                        screen.getByRole('button', { name: /create/i });
    
    if (submitButton) {
      await user.click(submitButton);
    }

    // Wait for submission
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // Check if templateName defaults to classic
    const submissionArgs = mockOnSubmit.mock.calls[0];
    const formValues = submissionArgs[0];
    
    expect(formValues).toHaveProperty('templateName');
    expect(formValues.templateName).toBe('classic');
  });
});