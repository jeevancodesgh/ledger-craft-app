import { describe, it, expect, beforeEach } from 'vitest';
import { parseCSVTransactions } from '../csvTransactionParser';
import { CSVColumnMapping, ImportedTransaction } from '../../types/bankTransaction';

describe('CSV Transaction Parser', () => {
  let sampleCSVData: string;
  let columnMapping: CSVColumnMapping;

  beforeEach(() => {
    // Sample CSV data representing bank transactions
    sampleCSVData = `Date,Description,Amount,Type,Balance,Reference
2024-01-15,"Coffee Shop Purchase",-4.50,DEBIT,1000.50,REF123
2024-01-16,"Salary Deposit",2500.00,CREDIT,2504.50,PAY456
2024-01-17,"ATM Withdrawal",-100.00,DEBIT,2404.50,ATM789
2024-01-18,"Online Purchase",-25.99,DEBIT,2378.51,WEB001`;

    columnMapping = {
      date: 'Date',
      description: 'Description',
      amount: 'Amount',
      type: 'Type',
      balance: 'Balance',
      reference: 'Reference'
    };
  });

  describe('parseCSVTransactions', () => {
    it('should parse valid CSV data correctly', async () => {
      const result = await parseCSVTransactions(sampleCSVData, columnMapping);

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(4);
      expect(result.errors).toHaveLength(0);

      const firstTransaction = result.transactions[0];
      expect(firstTransaction.date).toBe('2024-01-15');
      expect(firstTransaction.description).toBe('Coffee Shop Purchase');
      expect(firstTransaction.amount).toBe(4.50); // Should be positive number
      expect(firstTransaction.type).toBe('debit');
      expect(firstTransaction.balance).toBe(1000.50);
      expect(firstTransaction.reference).toBe('REF123');
    });

    it('should handle credit transactions correctly', async () => {
      const result = await parseCSVTransactions(sampleCSVData, columnMapping);
      
      const creditTransaction = result.transactions[1];
      expect(creditTransaction.type).toBe('credit');
      expect(creditTransaction.amount).toBe(2500.00);
      expect(creditTransaction.description).toBe('Salary Deposit');
    });

    it('should handle missing optional columns', async () => {
      const csvWithoutBalance = `Date,Description,Amount,Type
2024-01-15,"Coffee Shop Purchase",-4.50,DEBIT
2024-01-16,"Salary Deposit",2500.00,CREDIT`;

      const mappingWithoutBalance: CSVColumnMapping = {
        date: 'Date',
        description: 'Description',
        amount: 'Amount',
        type: 'Type'
      };

      const result = await parseCSVTransactions(csvWithoutBalance, mappingWithoutBalance);

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0].balance).toBeUndefined();
    });

    it('should return errors for invalid CSV data', async () => {
      const invalidCSV = `Date,Description,Amount,Type
invalid-date,"Coffee Shop Purchase",-4.50,DEBIT
2024-01-16,"Salary Deposit",invalid-amount,CREDIT`;

      const result = await parseCSVTransactions(invalidCSV, columnMapping);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty CSV data', async () => {
      const result = await parseCSVTransactions('', columnMapping);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('CSV data is empty');
    });

    it('should detect and convert transaction types automatically', async () => {
      const csvWithDifferentTypes = `Date,Description,Amount
2024-01-15,"Coffee Shop Purchase",-4.50
2024-01-16,"Salary Deposit",2500.00
2024-01-17,"ATM Withdrawal",-100.00`;

      const mappingWithoutType: CSVColumnMapping = {
        date: 'Date',
        description: 'Description',
        amount: 'Amount'
      };

      const result = await parseCSVTransactions(csvWithDifferentTypes, mappingWithoutType);

      expect(result.success).toBe(true);
      expect(result.transactions[0].type).toBe('debit'); // negative amount
      expect(result.transactions[1].type).toBe('credit'); // positive amount
      expect(result.transactions[2].type).toBe('debit'); // negative amount
    });

    it('should validate required columns', async () => {
      const csvMissingRequiredColumn = `Description,Amount,Type
"Coffee Shop Purchase",-4.50,DEBIT`;

      const result = await parseCSVTransactions(csvMissingRequiredColumn, columnMapping);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Required column "Date" not found in CSV');
    });

    it('should handle different date formats', async () => {
      const csvWithDifferentDateFormat = `Date,Description,Amount,Type
15/01/2024,"Coffee Shop Purchase",-4.50,DEBIT
16/01/2024,"Salary Deposit",2500.00,CREDIT`;

      const result = await parseCSVTransactions(csvWithDifferentDateFormat, columnMapping, 'DD/MM/YYYY');

      expect(result.success).toBe(true);
      expect(result.transactions[0].date).toBe('2024-01-15'); // Should convert to ISO format
    });

    it('should handle merchant extraction from description', async () => {
      const csvWithMerchantInfo = `Date,Description,Amount,Type
2024-01-15,"STARBUCKS #123 MAIN ST",-4.50,DEBIT
2024-01-16,"AMAZON.COM WEB PURCHASE",-25.99,DEBIT`;

      const result = await parseCSVTransactions(csvWithMerchantInfo, columnMapping);

      expect(result.success).toBe(true);
      expect(result.transactions[0].merchant).toBe('STARBUCKS');
      expect(result.transactions[1].merchant).toBe('AMAZON.COM');
    });
  });

  describe('Transaction Amount Parsing', () => {
    it('should handle various amount formats', async () => {
      const csvWithDifferentAmounts = `Date,Description,Amount,Type
2024-01-15,"Purchase 1","$4.50",DEBIT
2024-01-16,"Purchase 2","4,500.99",CREDIT
2024-01-17,"Purchase 3","(100.00)",DEBIT`;

      const result = await parseCSVTransactions(csvWithDifferentAmounts, columnMapping);

      expect(result.success).toBe(true);
      expect(result.transactions[0].amount).toBe(4.50);
      expect(result.transactions[1].amount).toBe(4500.99);
      expect(result.transactions[2].amount).toBe(100.00);
      expect(result.transactions[2].type).toBe('debit'); // Parentheses indicate debit
    });
  });

  describe('Duplicate Detection', () => {
    it('should identify potential duplicate transactions', async () => {
      const csvWithDuplicates = `Date,Description,Amount,Type,Reference
2024-01-15,"Coffee Shop Purchase",-4.50,DEBIT,REF123
2024-01-15,"Coffee Shop Purchase",-4.50,DEBIT,REF123
2024-01-16,"Different Purchase",-10.00,DEBIT,REF456`;

      const result = await parseCSVTransactions(csvWithDuplicates, columnMapping);

      expect(result.success).toBe(true);
      expect(result.duplicates).toHaveLength(1);
      expect(result.duplicates[0].indices).toEqual([0, 1]);
    });
  });
});