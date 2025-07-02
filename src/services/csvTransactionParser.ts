import { CSVColumnMapping, ImportedTransaction } from '../types/bankTransaction';

export interface CSVParseResult {
  success: boolean;
  transactions: ImportedTransaction[];
  errors: string[];
  duplicates?: Array<{
    indices: number[];
    transaction: ImportedTransaction;
  }>;
}

export async function parseCSVTransactions(
  csvData: string,
  columnMapping: CSVColumnMapping,
  dateFormat?: string
): Promise<CSVParseResult> {
  const errors: string[] = [];
  const transactions: ImportedTransaction[] = [];
  const duplicateMap = new Map<string, number[]>();

  try {
    // Validate input
    if (!csvData || csvData.trim().length === 0) {
      return {
        success: false,
        transactions: [],
        errors: ['CSV data is empty']
      };
    }

    // Parse CSV data
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      return {
        success: false,
        transactions: [],
        errors: ['CSV must contain at least a header row and one data row']
      };
    }

    // Extract headers
    const headers = parseCSVLine(lines[0]);
    
    // Validate required columns exist
    const requiredColumns = ['date', 'description', 'amount'];
    for (const requiredColumn of requiredColumns) {
      const mappedColumn = columnMapping[requiredColumn as keyof CSVColumnMapping];
      if (!mappedColumn || !headers.includes(mappedColumn)) {
        errors.push(`Required column "${mappedColumn || requiredColumn}" not found in CSV`);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        transactions: [],
        errors
      };
    }

    // Create column index mapping
    const columnIndices: Record<string, number> = {};
    Object.entries(columnMapping).forEach(([key, columnName]) => {
      if (columnName) {
        columnIndices[key] = headers.indexOf(columnName);
      }
    });

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const row = parseCSVLine(lines[i]);
        if (row.length === 0) continue; // Skip empty rows

        const transaction = parseTransactionRow(row, columnIndices, dateFormat, i + 1);
        if (transaction) {
          transactions.push(transaction);

          // Check for duplicates
          const duplicateKey = `${transaction.date}-${transaction.description}-${transaction.amount}`;
          if (!duplicateMap.has(duplicateKey)) {
            duplicateMap.set(duplicateKey, []);
          }
          duplicateMap.get(duplicateKey)!.push(transactions.length - 1);
        }
      } catch (error) {
        errors.push(`Error parsing row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Identify duplicates
    const duplicates = Array.from(duplicateMap.entries())
      .filter(([, indices]) => indices.length > 1)
      .map(([, indices]) => ({
        indices,
        transaction: transactions[indices[0]]
      }));

    return {
      success: errors.length === 0,
      transactions,
      errors,
      duplicates: duplicates.length > 0 ? duplicates : undefined
    };

  } catch (error) {
    return {
      success: false,
      transactions: [],
      errors: [`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function parseTransactionRow(
  row: string[],
  columnIndices: Record<string, number>,
  dateFormat?: string,
  rowNumber?: number
): ImportedTransaction | null {
  try {
    // Extract date
    const dateIndex = columnIndices.date;
    if (dateIndex === undefined || dateIndex === -1 || dateIndex >= row.length) {
      throw new Error('Date column not found');
    }
    const dateStr = row[dateIndex]?.trim();
    if (!dateStr) {
      throw new Error('Date is required');
    }
    const date = parseDate(dateStr, dateFormat);

    // Extract description
    const descriptionIndex = columnIndices.description;
    if (descriptionIndex === undefined || descriptionIndex === -1 || descriptionIndex >= row.length) {
      throw new Error('Description column not found');
    }
    const description = row[descriptionIndex]?.trim();
    if (!description) {
      throw new Error('Description is required');
    }

    // Extract amount
    const amountIndex = columnIndices.amount;
    if (amountIndex === undefined || amountIndex === -1 || amountIndex >= row.length) {
      throw new Error('Amount column not found');
    }
    const amountStr = row[amountIndex]?.trim();
    if (!amountStr) {
      throw new Error('Amount is required');
    }
    const { amount, type: inferredType } = parseAmount(amountStr);

    // Extract type (if available, otherwise use inferred type)
    let type: 'debit' | 'credit' = inferredType;
    const typeIndex = columnIndices.type;
    if (typeIndex !== undefined && typeIndex !== -1 && typeIndex < row.length && row[typeIndex]) {
      const typeStr = row[typeIndex]?.trim().toLowerCase();
      if (typeStr === 'debit' || typeStr === 'credit') {
        type = typeStr;
      }
    }

    // Extract optional fields
    const balance = columnIndices.balance !== undefined && columnIndices.balance !== -1 && columnIndices.balance < row.length && row[columnIndices.balance]
      ? parseFloat(cleanAmountString(row[columnIndices.balance])) || undefined
      : undefined;

    const reference = columnIndices.reference !== undefined && columnIndices.reference !== -1 && columnIndices.reference < row.length && row[columnIndices.reference]
      ? row[columnIndices.reference]?.trim() || undefined
      : undefined;

    // Extract merchant from description
    const merchant = extractMerchant(description);

    return {
      date,
      description,
      amount,
      type,
      balance,
      reference,
      merchant
    };

  } catch (error) {
    throw new Error(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Parse error'}`);
  }
}

function parseDate(dateStr: string, format?: string): string {
  // Remove quotes and clean up
  const cleanDate = dateStr.replace(/['"]/g, '').trim();
  
  try {
    let year: number, month: number, day: number;
    
    if (format === 'DD/MM/YYYY') {
      const parts = cleanDate.split('/');
      if (parts.length === 3) {
        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
        year = parseInt(parts[2]);
      } else {
        throw new Error('Invalid date format');
      }
    } else {
      // Default to ISO format or auto-parse
      const date = new Date(cleanDate);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return date.toISOString().split('T')[0];
    }
    
    // Validate date components
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new Error('Invalid date components');
    }
    
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error('Invalid date values');
    }
    
    // Construct date string in ISO format
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    
    return `${year}-${monthStr}-${dayStr}`;
  } catch (error) {
    throw new Error(`Invalid date format: ${cleanDate}`);
  }
}

function parseAmount(amountStr: string): { amount: number; type: 'debit' | 'credit' } {
  const cleaned = cleanAmountString(amountStr);
  
  // Check for parentheses (indicating negative/debit)
  const isParentheses = amountStr.includes('(') && amountStr.includes(')');
  
  // Check for negative sign
  const isNegative = cleaned.startsWith('-') || isParentheses;
  
  // Parse the absolute value
  const absoluteValue = parseFloat(cleaned.replace('-', ''));
  
  if (isNaN(absoluteValue)) {
    throw new Error(`Invalid amount: ${amountStr}`);
  }
  
  // Determine transaction type
  const type: 'debit' | 'credit' = isNegative ? 'debit' : 'credit';
  
  // Always return positive amount (the type indicates debit/credit)
  return {
    amount: absoluteValue,
    type
  };
}

function cleanAmountString(amountStr: string): string {
  return amountStr
    .replace(/['"$,()]/g, '') // Remove quotes, dollar signs, commas, parentheses
    .replace(/\s+/g, '') // Remove whitespace
    .trim();
}

function extractMerchant(description: string): string | undefined {
  // Simple merchant extraction - take first word/phrase before common separators
  const patterns = [
    /^([A-Z][A-Z0-9\s&.-]+?)(?:\s+#\d+|\s+\d{4}|\s+[A-Z]{2,3}\s|\s+WEB|\s+ONLINE)/i,
    /^([A-Z][A-Z0-9\s&.-]+?)(?:\s+\d+)/i,
    /^([A-Z]{3,})/i
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1] && match[1].length > 2) {
      return match[1].trim();
    }
  }
  
  return undefined;
}