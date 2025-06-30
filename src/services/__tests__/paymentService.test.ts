import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { paymentService } from '../paymentService';
import { taxCalculationService } from '../taxCalculationService';
import { receiptService } from '../receiptService';
import { journalEntryService } from '../journalEntryService';
import { 
  Payment, 
  CreatePaymentRequest, 
  TaxCalculationResult, 
  PaymentProcessingResult,
  ValidationResult 
} from '@/types/payment';

// Mock dependencies
jest.mock('../taxCalculationService');
jest.mock('../receiptService');
jest.mock('../journalEntryService');
jest.mock('../supabaseService');

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Payment Creation', () => {
    it('should create a payment with valid data', async () => {
      // Arrange
      const paymentRequest: CreatePaymentRequest = {
        invoiceId: 'inv-123',
        paymentMethod: 'bank_transfer',
        amount: 1000.00,
        paymentDate: '2024-01-15',
        referenceNumber: 'REF-001',
        generateReceipt: true
      };

      const mockPayment: Payment = {
        id: 'pay-123',
        invoiceId: 'inv-123',
        userId: 'user-123',
        paymentMethod: 'bank_transfer',
        amount: 1000.00,
        paymentDate: '2024-01-15',
        referenceNumber: 'REF-001',
        status: 'completed',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      };

      // Mock the service methods
      (paymentService.create as jest.Mock).mockResolvedValue(mockPayment);

      // Act
      const result = await paymentService.create(paymentRequest);

      // Assert
      expect(result).toEqual(mockPayment);
      expect(result.amount).toBe(1000.00);
      expect(result.status).toBe('completed');
    });

    it('should validate payment amount against invoice balance', async () => {
      // Arrange
      const paymentRequest: CreatePaymentRequest = {
        invoiceId: 'inv-123',
        paymentMethod: 'cash',
        amount: 1500.00, // More than invoice balance
        paymentDate: '2024-01-15'
      };

      // Mock invoice with balance of 1000
      const mockInvoice = {
        id: 'inv-123',
        total: 1000.00,
        totalPaid: 0,
        balanceDue: 1000.00
      };

      (paymentService.validatePayment as jest.Mock).mockResolvedValue({
        isValid: false,
        errors: ['Payment amount exceeds invoice balance'],
        warnings: []
      });

      // Act & Assert
      await expect(paymentService.create(paymentRequest))
        .rejects.toThrow('Payment amount exceeds invoice balance');
    });

    it('should handle partial payments correctly', async () => {
      // Arrange
      const paymentRequest: CreatePaymentRequest = {
        invoiceId: 'inv-123',
        paymentMethod: 'cash',
        amount: 500.00, // Partial payment
        paymentDate: '2024-01-15'
      };

      const mockPayment: Payment = {
        id: 'pay-123',
        invoiceId: 'inv-123',
        userId: 'user-123',
        paymentMethod: 'cash',
        amount: 500.00,
        paymentDate: '2024-01-15',
        status: 'completed',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      };

      (paymentService.create as jest.Mock).mockResolvedValue(mockPayment);
      (paymentService.updateInvoiceStatus as jest.Mock).mockResolvedValue({
        paymentStatus: 'partially_paid',
        totalPaid: 500.00,
        balanceDue: 500.00
      });

      // Act
      const result = await paymentService.create(paymentRequest);

      // Assert
      expect(result.amount).toBe(500.00);
      expect(paymentService.updateInvoiceStatus).toHaveBeenCalledWith(
        'inv-123', 
        500.00, 
        'partially_paid'
      );
    });
  });

  describe('Payment Validation', () => {
    it('should validate required fields', async () => {
      // Arrange
      const invalidPayment = {
        // Missing invoiceId
        paymentMethod: 'cash',
        amount: 100.00,
        paymentDate: '2024-01-15'
      } as CreatePaymentRequest;

      // Act
      const validation = await paymentService.validatePayment(invalidPayment);

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invoice ID is required');
    });

    it('should validate payment amount is positive', async () => {
      // Arrange
      const invalidPayment: CreatePaymentRequest = {
        invoiceId: 'inv-123',
        paymentMethod: 'cash',
        amount: -100.00, // Negative amount
        paymentDate: '2024-01-15'
      };

      // Act
      const validation = await paymentService.validatePayment(invalidPayment);

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Payment amount must be positive');
    });

    it('should validate payment date is not in future', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const invalidPayment: CreatePaymentRequest = {
        invoiceId: 'inv-123',
        paymentMethod: 'cash',
        amount: 100.00,
        paymentDate: futureDate.toISOString().split('T')[0]
      };

      // Act
      const validation = await paymentService.validatePayment(invalidPayment);

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Payment date cannot be in the future');
    });
  });

  describe('Payment Processing Integration', () => {
    it('should process complete payment workflow', async () => {
      // Arrange
      const paymentRequest: CreatePaymentRequest = {
        invoiceId: 'inv-123',
        paymentMethod: 'bank_transfer',
        amount: 1000.00,
        paymentDate: '2024-01-15',
        generateReceipt: true
      };

      const mockPayment: Payment = {
        id: 'pay-123',
        invoiceId: 'inv-123',
        userId: 'user-123',
        paymentMethod: 'bank_transfer',
        amount: 1000.00,
        paymentDate: '2024-01-15',
        status: 'completed',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      };

      const mockReceipt = {
        id: 'rec-123',
        paymentId: 'pay-123',
        receiptNumber: 'REC-001'
      };

      const mockJournalEntry = {
        id: 'je-123',
        entryNumber: 'JE-001',
        description: 'Payment received for Invoice inv-123'
      };

      // Mock all service calls
      (paymentService.create as jest.Mock).mockResolvedValue(mockPayment);
      (receiptService.generate as jest.Mock).mockResolvedValue(mockReceipt);
      (journalEntryService.createPaymentEntry as jest.Mock).mockResolvedValue(mockJournalEntry);

      // Act
      const result = await paymentService.processPayment(paymentRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.payment).toEqual(mockPayment);
      expect(result.receipt).toEqual(mockReceipt);
      expect(result.journalEntry).toEqual(mockJournalEntry);
      expect(receiptService.generate).toHaveBeenCalledWith('pay-123', true);
      expect(journalEntryService.createPaymentEntry).toHaveBeenCalledWith(mockPayment);
    });

    it('should handle payment processing errors gracefully', async () => {
      // Arrange
      const paymentRequest: CreatePaymentRequest = {
        invoiceId: 'inv-123',
        paymentMethod: 'bank_transfer',
        amount: 1000.00,
        paymentDate: '2024-01-15'
      };

      // Mock payment creation to fail
      (paymentService.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      const result = await paymentService.processPayment(paymentRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to create payment: Database error');
    });
  });

  describe('Payment Queries', () => {
    it('should retrieve payments by invoice ID', async () => {
      // Arrange
      const invoiceId = 'inv-123';
      const mockPayments: Payment[] = [
        {
          id: 'pay-123',
          invoiceId: 'inv-123',
          userId: 'user-123',
          paymentMethod: 'bank_transfer',
          amount: 500.00,
          paymentDate: '2024-01-15',
          status: 'completed',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 'pay-124',
          invoiceId: 'inv-123',
          userId: 'user-123',
          paymentMethod: 'cash',
          amount: 500.00,
          paymentDate: '2024-01-16',
          status: 'completed',
          createdAt: '2024-01-16T10:00:00Z',
          updatedAt: '2024-01-16T10:00:00Z'
        }
      ];

      (paymentService.getByInvoiceId as jest.Mock).mockResolvedValue(mockPayments);

      // Act
      const result = await paymentService.getByInvoiceId(invoiceId);

      // Assert
      expect(result).toEqual(mockPayments);
      expect(result).toHaveLength(2);
      expect(result.every(p => p.invoiceId === invoiceId)).toBe(true);
    });

    it('should calculate total payments for invoice', async () => {
      // Arrange
      const invoiceId = 'inv-123';
      const mockPayments: Payment[] = [
        { amount: 500.00, status: 'completed' } as Payment,
        { amount: 300.00, status: 'completed' } as Payment,
        { amount: 200.00, status: 'failed' } as Payment // Should be excluded
      ];

      (paymentService.getByInvoiceId as jest.Mock).mockResolvedValue(mockPayments);

      // Act
      const total = await paymentService.calculateTotalPaid(invoiceId);

      // Assert
      expect(total).toBe(800.00); // Only completed payments
    });
  });

  describe('Payment Status Updates', () => {
    it('should update invoice status to paid when fully paid', async () => {
      // Arrange
      const invoiceId = 'inv-123';
      const invoiceTotal = 1000.00;
      const paymentAmount = 1000.00;

      (paymentService.updateInvoiceStatus as jest.Mock).mockResolvedValue({
        paymentStatus: 'paid',
        totalPaid: 1000.00,
        balanceDue: 0
      });

      // Act
      const result = await paymentService.updateInvoiceStatus(
        invoiceId, 
        paymentAmount, 
        'paid'
      );

      // Assert
      expect(result.paymentStatus).toBe('paid');
      expect(result.balanceDue).toBe(0);
    });

    it('should update invoice status to partially_paid when partially paid', async () => {
      // Arrange
      const invoiceId = 'inv-123';
      const paymentAmount = 500.00;

      (paymentService.updateInvoiceStatus as jest.Mock).mockResolvedValue({
        paymentStatus: 'partially_paid',
        totalPaid: 500.00,
        balanceDue: 500.00
      });

      // Act
      const result = await paymentService.updateInvoiceStatus(
        invoiceId, 
        paymentAmount, 
        'partially_paid'
      );

      // Assert
      expect(result.paymentStatus).toBe('partially_paid');
      expect(result.balanceDue).toBe(500.00);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount payments', async () => {
      // Arrange
      const paymentRequest: CreatePaymentRequest = {
        invoiceId: 'inv-123',
        paymentMethod: 'bank_transfer',
        amount: 0,
        paymentDate: '2024-01-15'
      };

      // Act
      const validation = await paymentService.validatePayment(paymentRequest);

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Payment amount must be greater than 0');
    });

    it('should handle concurrent payments for same invoice', async () => {
      // Arrange
      const paymentRequest1: CreatePaymentRequest = {
        invoiceId: 'inv-123',
        paymentMethod: 'bank_transfer',
        amount: 800.00,
        paymentDate: '2024-01-15'
      };

      const paymentRequest2: CreatePaymentRequest = {
        invoiceId: 'inv-123',
        paymentMethod: 'cash',
        amount: 800.00,
        paymentDate: '2024-01-15'
      };

      // Mock invoice with balance of 1000
      (paymentService.validatePayment as jest.Mock)
        .mockResolvedValueOnce({ isValid: true, errors: [], warnings: [] })
        .mockResolvedValueOnce({ 
          isValid: false, 
          errors: ['Payment would exceed invoice balance'], 
          warnings: [] 
        });

      // Act
      const result1 = paymentService.processPayment(paymentRequest1);
      const result2 = paymentService.processPayment(paymentRequest2);

      // Assert
      await expect(result1).resolves.toHaveProperty('success', true);
      await expect(result2).rejects.toThrow('Payment would exceed invoice balance');
    });
  });
});