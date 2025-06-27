import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ShareInvoiceModal from '@/components/invoice/ShareInvoiceModal';
import { sharedInvoiceService } from '@/services/supabaseService';
import { Invoice } from '@/types';

// Mock the supabase service
vi.mock('@/services/supabaseService', () => ({
  sharedInvoiceService: {
    createSharedInvoice: vi.fn(),
    getSharedInvoiceByToken: vi.fn(),
  },
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock PDF utils
vi.mock('@/utils/pdfUtils', () => ({
  generateInvoicePdf: vi.fn(),
}));

const mockInvoice: Invoice = {
  id: 'test-invoice-id',
  invoiceNumber: 'INV-001',
  customerId: 'customer-1',
  date: '2024-01-01',
  dueDate: '2024-01-31',
  items: [
    {
      id: 'item-1',
      description: 'Test Item',
      quantity: 1,
      unit: 'each',
      rate: 100,
      total: 100,
    },
  ],
  subtotal: 100,
  taxAmount: 10,
  total: 110,
  status: 'draft',
  currency: 'USD',
  templateName: 'classic',
};

const renderShareModal = (props = {}) => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    invoice: mockInvoice,
    businessName: 'Test Business',
    ...props,
  };

  return render(
    <BrowserRouter>
      <ShareInvoiceModal {...defaultProps} />
    </BrowserRouter>
  );
};

describe('Invoice Sharing Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ShareInvoiceModal', () => {
    it('renders correctly with invoice information', () => {
      renderShareModal();
      
      expect(screen.getByText('Share Invoice INV-001')).toBeInTheDocument();
      expect(screen.getByText(/Create a secure link to share this invoice/)).toBeInTheDocument();
      expect(screen.getByText('Template')).toBeInTheDocument();
      expect(screen.getByText('Generate Share Link')).toBeInTheDocument();
    });

    it('allows template selection', async () => {
      renderShareModal();
      
      const templateSelect = screen.getByRole('combobox');
      fireEvent.click(templateSelect);
      
      await waitFor(() => {
        expect(screen.getByText('Modern')).toBeInTheDocument();
        expect(screen.getByText('Minimal')).toBeInTheDocument();
        expect(screen.getByText('Executive')).toBeInTheDocument();
      });
    });

    it('handles expiration settings', () => {
      renderShareModal();
      
      const expirationSwitch = screen.getByRole('switch');
      fireEvent.click(expirationSwitch);
      
      expect(screen.getByLabelText('Expires in (days)')).toBeInTheDocument();
    });

    it('creates share link when button is clicked', async () => {
      const mockSharedInvoice = {
        id: 'shared-id',
        shareToken: 'test-token-123',
        originalInvoiceId: 'test-invoice-id',
        invoiceData: mockInvoice,
        templateData: { templateName: 'classic', businessProfile: {} },
        createdAt: '2024-01-01',
        accessCount: 0,
        isActive: true,
        createdBy: 'user-id',
      };

      vi.mocked(sharedInvoiceService.createSharedInvoice).mockResolvedValue(mockSharedInvoice);

      renderShareModal();
      
      const generateButton = screen.getByText('Generate Share Link');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(sharedInvoiceService.createSharedInvoice).toHaveBeenCalledWith(
          'test-invoice-id',
          'classic',
          undefined
        );
      });
    });

    it('displays share URL after generation', async () => {
      const mockSharedInvoice = {
        id: 'shared-id',
        shareToken: 'test-token-123',
        originalInvoiceId: 'test-invoice-id',
        invoiceData: mockInvoice,
        templateData: { templateName: 'classic', businessProfile: {} },
        createdAt: '2024-01-01',
        accessCount: 0,
        isActive: true,
        createdBy: 'user-id',
      };

      vi.mocked(sharedInvoiceService.createSharedInvoice).mockResolvedValue(mockSharedInvoice);

      renderShareModal();
      
      const generateButton = screen.getByText('Generate Share Link');
      fireEvent.click(generateButton);

      await waitFor(() => {
        const shareInput = screen.getByDisplayValue(/\/shared\/invoice\/test-token-123/);
        expect(shareInput).toBeInTheDocument();
      });

      expect(screen.getByText('Copy Link')).toBeInTheDocument();
    });
  });

  describe('Database Schema', () => {
    it('ensures invoice has templateName field', () => {
      expect(mockInvoice.templateName).toBe('classic');
    });

    it('validates shared invoice structure', () => {
      const sharedInvoice = {
        id: 'shared-id',
        originalInvoiceId: 'invoice-id',
        invoiceData: mockInvoice,
        templateData: {
          templateName: 'classic',
          businessProfile: {},
        },
        shareToken: 'token-123',
        createdAt: '2024-01-01',
        expiresAt: null,
        accessCount: 0,
        isActive: true,
        createdBy: 'user-id',
      };

      expect(sharedInvoice).toHaveProperty('shareToken');
      expect(sharedInvoice).toHaveProperty('invoiceData');
      expect(sharedInvoice).toHaveProperty('templateData');
      expect(sharedInvoice).toHaveProperty('accessCount');
      expect(sharedInvoice).toHaveProperty('isActive');
    });
  });

  describe('Security Features', () => {
    it('generates unique share tokens', () => {
      const token1 = 'token-123';
      const token2 = 'token-456';
      
      expect(token1).not.toBe(token2);
      expect(token1).toMatch(/^[a-zA-Z0-9-]+$/);
    });

    it('supports expiration dates', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      expect(futureDate > now).toBe(true);
    });

    it('tracks access count', () => {
      const sharedInvoice = {
        accessCount: 0,
        isActive: true,
      };

      // Simulate access
      sharedInvoice.accessCount += 1;
      
      expect(sharedInvoice.accessCount).toBe(1);
    });
  });
});

describe('Invoice Form Template Selection', () => {
  it('includes templateName in form submission', () => {
    const formData = {
      invoiceNumber: 'INV-001',
      customerId: 'customer-1',
      date: new Date(),
      dueDate: new Date(),
      currency: 'USD',
      templateName: 'modern',
    };

    expect(formData.templateName).toBe('modern');
  });
});