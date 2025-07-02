import { describe, it, expect } from 'vitest';
import { transactionImportService } from '../transactionImportService';
import { ImportedTransaction } from '../../types/bankTransaction';

describe('Transaction Import Service', () => {
  const mockBankAccountId = 'test-bank-account-id';

  describe('detectDuplicates', () => {
    it('should detect exact duplicate transactions', () => {
      const transactions: ImportedTransaction[] = [
        {
          date: '2024-01-15',
          description: 'Coffee Shop Purchase',
          amount: 4.50,
          type: 'debit'
        }
      ];

      const existing = [
        {
          id: '1',
          transactionDate: '2024-01-15',
          description: 'Coffee Shop Purchase',
          amount: 4.50,
          type: 'debit' as const,
          bankAccountId: mockBankAccountId,
          isReconciled: false,
          userId: 'test-user',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      const duplicates = transactionImportService.detectDuplicates(transactions, existing);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0]).toBe(0); // Index of duplicate transaction
    });

    it('should not detect similar but different transactions as duplicates', () => {
      const transactions: ImportedTransaction[] = [
        {
          date: '2024-01-15',
          description: 'Coffee Shop Purchase',
          amount: 4.50,
          type: 'debit'
        }
      ];

      const existing = [
        {
          id: '1',
          transactionDate: '2024-01-15',
          description: 'Coffee Shop Purchase',
          amount: 5.50, // Different amount
          type: 'debit' as const,
          bankAccountId: mockBankAccountId,
          isReconciled: false,
          userId: 'test-user',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      const duplicates = transactionImportService.detectDuplicates(transactions, existing);

      expect(duplicates).toHaveLength(0);
    });

    it('should handle fuzzy matching for similar descriptions', () => {
      const transactions: ImportedTransaction[] = [
        {
          date: '2024-01-15',
          description: 'STARBUCKS #123 MAIN ST',
          amount: 4.50,
          type: 'debit'
        }
      ];

      const existing = [
        {
          id: '1',
          transactionDate: '2024-01-15',
          description: 'STARBUCKS MAIN STREET',
          amount: 4.50,
          type: 'debit' as const,
          bankAccountId: mockBankAccountId,
          isReconciled: false,
          userId: 'test-user',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      const duplicates = transactionImportService.detectDuplicates(transactions, existing, { fuzzyMatch: true });

      expect(duplicates).toHaveLength(1);
    });
  });

  describe('categorizeTransactions', () => {
    it('should automatically categorize transactions based on merchant/description', () => {
      const transactions: ImportedTransaction[] = [
        {
          date: '2024-01-15',
          description: 'STARBUCKS #123',
          amount: 4.50,
          type: 'debit'
        },
        {
          date: '2024-01-16',
          description: 'SHELL GAS STATION',
          amount: 45.00,
          type: 'debit'
        },
        {
          date: '2024-01-17',
          description: 'SALARY DEPOSIT',
          amount: 2500.00,
          type: 'credit'
        }
      ];

      const categorized = transactionImportService.categorizeTransactions(transactions);

      expect(categorized[0].category).toBe('Food & Dining');
      expect(categorized[1].category).toBe('Transportation');
      expect(categorized[2].category).toBe('Income');
    });

    it('should leave unknown transactions uncategorized', () => {
      const transactions: ImportedTransaction[] = [
        {
          date: '2024-01-15',
          description: 'UNKNOWN MERCHANT XYZ',
          amount: 50.00,
          type: 'debit'
        }
      ];

      const categorized = transactionImportService.categorizeTransactions(transactions);

      expect(categorized[0].category).toBeUndefined();
    });
  });

  describe('validateImportData', () => {
    it('should validate transaction data before import', () => {
      const validTransaction: ImportedTransaction = {
        date: '2024-01-15',
        description: 'Valid Transaction',
        amount: 100.00,
        type: 'debit'
      };

      const result = transactionImportService.validateImportData([validTransaction]);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject transactions with invalid dates', () => {
      const invalidTransaction: ImportedTransaction = {
        date: 'invalid-date',
        description: 'Invalid Date Transaction',
        amount: 100.00,
        type: 'debit'
      };

      const result = transactionImportService.validateImportData([invalidTransaction]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            row: 0,
            field: 'date',
            message: 'Invalid date format'
          })
        ])
      );
    });

    it('should reject transactions with zero or negative amounts', () => {
      const invalidTransaction: ImportedTransaction = {
        date: '2024-01-15',
        description: 'Zero Amount Transaction',
        amount: 0,
        type: 'debit'
      };

      const result = transactionImportService.validateImportData([invalidTransaction]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            row: 0,
            field: 'amount',
            message: 'Amount must be greater than zero'
          })
        ])
      );
    });

    it('should reject transactions with empty descriptions', () => {
      const invalidTransaction: ImportedTransaction = {
        date: '2024-01-15',
        description: '',
        amount: 100.00,
        type: 'debit'
      };

      const result = transactionImportService.validateImportData([invalidTransaction]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            row: 0,
            field: 'description',
            message: 'Description is required'
          })
        ])
      );
    });
  });

  describe('getImportSummary', () => {
    it('should provide detailed import summary', () => {
      const mockResult = {
        success: true,
        importedCount: 3,
        duplicatesSkipped: 1,
        errors: [],
        transactions: [
          {
            id: '1',
            bankAccountId: mockBankAccountId,
            transactionDate: '2024-01-15',
            description: 'Coffee Shop',
            amount: 4.50,
            type: 'debit' as const,
            category: 'Food & Dining',
            isReconciled: false,
            userId: 'test-user',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: '2',
            bankAccountId: mockBankAccountId,
            transactionDate: '2024-01-17',
            description: 'Salary',
            amount: 2500.00,
            type: 'credit' as const,
            category: 'Income',
            isReconciled: false,
            userId: 'test-user',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ]
      };

      const summary = transactionImportService.getImportSummary(mockResult);

      expect(summary).toMatchObject({
        totalProcessed: 4, // 3 imported + 1 skipped
        successfulImports: 3,
        duplicatesSkipped: 1,
        errorsCount: 0,
        categorizedCount: 2,
        dateRange: {
          earliest: '2024-01-15',
          latest: '2024-01-17'
        }
      });
    });
  });
});