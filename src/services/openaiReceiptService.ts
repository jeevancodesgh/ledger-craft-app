import OpenAI from 'openai';
import { ReceiptScanResult, ReceiptScanError, ReceiptScanOptions } from '@/types/receipt';

class OpenAIReceiptService {
  private openai: OpenAI | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('OpenAI API key not found. Receipt scanning will be disabled.');
      return;
    }

    try {
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // Note: In production, this should be handled server-side
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
    }
  }

  public isAvailable(): boolean {
    return this.isInitialized && this.openai !== null;
  }

  private getPrompt(): string {
    return `
You are a receipt data extraction expert. Analyze this receipt image and extract the following information in JSON format:

{
  "merchantName": "Business name from receipt (string or null)",
  "date": "Transaction date in YYYY-MM-DD format (string or null)", 
  "total": "Total amount as number (number or null)",
  "tax": "Tax amount as number (number or null)",
  "subtotal": "Subtotal before tax (number or null)",
  "items": [
    {
      "description": "Item name/description (string)",
      "quantity": "Number of items (number, default 1)",
      "price": "Item price as number (number)"
    }
  ],
  "paymentMethod": "cash, card, or other (string or null)",
  "suggestedCategory": "One of: Food & Beverage, Transportation, Office Supplies, Travel, Entertainment, Health & Medical, Shopping, Utilities, Other (string or null)",
  "confidence": "0-100 score of extraction confidence (number)",
  "notes": "Any additional relevant information (string or null)"
}

IMPORTANT RULES:
- Extract only information clearly visible in the receipt
- Use null for missing information - NEVER guess or hallucinate data
- For dates, convert to YYYY-MM-DD format
- For amounts, extract as numbers without currency symbols
- If you cannot see the receipt clearly, return confidence score below 50
- Items array can be empty if individual items are not clearly visible
- Return valid JSON only`;
  }

  public async scanReceipt(
    imageData: string, 
    options: ReceiptScanOptions = {}
  ): Promise<ReceiptScanResult> {
    if (!this.isAvailable()) {
      throw new ReceiptScanError({
        code: 'API_ERROR',
        message: 'OpenAI service is not available. Please check your API key configuration.'
      });
    }

    const { model = 'gpt-4o-mini', maxTokens = 1000 } = options;

    try {
      // Ensure image data is properly formatted
      const base64Data = imageData.startsWith('data:') 
        ? imageData 
        : `data:image/jpeg;base64,${imageData}`;

      const response = await this.openai!.chat.completions.create({
        model,
        max_tokens: maxTokens,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: this.getPrompt()
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Data,
                  detail: "high"
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content received from OpenAI');
      }

      const result = JSON.parse(content) as ReceiptScanResult;
      
      // Validate and sanitize the result
      return this.validateAndSanitizeResult(result);

    } catch (error) {
      console.error('Receipt scanning error:', error);
      
      if (error instanceof SyntaxError) {
        throw new ReceiptScanError({
          code: 'PROCESSING_ERROR',
          message: 'Failed to parse AI response. Please try again.'
        });
      }

      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new ReceiptScanError({
            code: 'NETWORK_ERROR',
            message: 'Network error occurred. Please check your connection and try again.'
          });
        }

        throw new ReceiptScanError({
          code: 'API_ERROR',
          message: error.message
        });
      }

      throw new ReceiptScanError({
        code: 'PROCESSING_ERROR',
        message: 'An unexpected error occurred while processing the receipt.'
      });
    }
  }

  private validateAndSanitizeResult(result: any): ReceiptScanResult {
    // Ensure all required fields exist with proper types
    return {
      merchantName: typeof result.merchantName === 'string' ? result.merchantName : null,
      date: this.validateDate(result.date),
      total: this.validateNumber(result.total),
      tax: this.validateNumber(result.tax),
      subtotal: this.validateNumber(result.subtotal),
      items: Array.isArray(result.items) ? result.items.filter(this.validateItem) : [],
      paymentMethod: this.validatePaymentMethod(result.paymentMethod),
      suggestedCategory: typeof result.suggestedCategory === 'string' ? result.suggestedCategory : null,
      confidence: this.validateNumber(result.confidence) || 0,
      notes: typeof result.notes === 'string' ? result.notes : null
    };
  }

  private validateDate(date: any): string | null {
    if (typeof date !== 'string') return null;
    
    // Basic date format validation (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return null;
    
    // Check if it's a valid date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return null;
    
    return date;
  }

  private validateNumber(value: any): number | null {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return !isNaN(parsed) ? parsed : null;
    }
    return null;
  }

  private validateItem = (item: any): boolean => {
    return (
      typeof item === 'object' &&
      typeof item.description === 'string' &&
      item.description.length > 0 &&
      typeof item.price === 'number' &&
      !isNaN(item.price)
    );
  };

  private validatePaymentMethod(method: any): 'cash' | 'card' | 'other' | null {
    if (typeof method === 'string') {
      const normalized = method.toLowerCase();
      if (['cash', 'card', 'other'].includes(normalized)) {
        return normalized as 'cash' | 'card' | 'other';
      }
    }
    return null;
  }

  // Utility method to convert file to base64
  public static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // Utility method to compress image before sending to API
  public static async compressImage(
    file: File, 
    maxWidth: number = 1024, 
    quality: number = 0.8
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}

// Create singleton instance
export const openaiReceiptService = new OpenAIReceiptService();

// Export error class for external use
export class ReceiptScanError extends Error {
  public code: 'PROCESSING_ERROR' | 'INVALID_IMAGE' | 'API_ERROR' | 'NETWORK_ERROR';

  constructor({ code, message }: { code: ReceiptScanError['code']; message: string }) {
    super(message);
    this.name = 'ReceiptScanError';
    this.code = code;
  }
}