import { invoiceService } from '@/services/invoiceService';
import { getAuthenticatedSupabaseClient, cleanupTestData } from '@/__tests__/setup/testEnv';
import { mockInvoiceInput, mockLineItems } from '@/__tests__/fixtures/invoice.fixtures';
import { mockCustomer } from '@/__tests__/fixtures/customer.fixtures';

describe('InvoiceService', () => {
  let supabase: Awaited<ReturnType<typeof getAuthenticatedSupabaseClient>>;
  const createdInvoiceIds: string[] = [];
  const createdCustomerIds: string[] = [];

  beforeAll(async () => {
    supabase = await getAuthenticatedSupabaseClient();
  });

  afterEach(async () => {
    // Clean up test invoices and customers
    if (createdInvoiceIds.length > 0) {
      // Delete line items first
      await supabase
        .from('line_items')
        .delete()
        .in('invoice_id', createdInvoiceIds);
        
      await supabase
        .from('invoices')
        .delete()
        .in('id', createdInvoiceIds);
      createdInvoiceIds.length = 0;
    }
    
    if (createdCustomerIds.length > 0) {
      await supabase
        .from('customers')
        .delete()
        .in('id', createdCustomerIds);
      createdCustomerIds.length = 0;
    }
    
    await cleanupTestData.deleteInvoices(supabase);
  });

  describe('generateInvoiceNumber', () => {
    it('should generate invoice number following format', async () => {
      const invoiceNumber = await invoiceService.generateInvoiceNumber();

      expect(invoiceNumber).toBeDefined();
      expect(typeof invoiceNumber).toBe('string');
      expect(invoiceNumber.length).toBeGreaterThan(0);
    });

    it('should generate unique invoice numbers', async () => {
      const number1 = await invoiceService.generateInvoiceNumber();
      const number2 = await invoiceService.generateInvoiceNumber();

      // Numbers should be different (sequences should increment)
      expect(number1).not.toBe(number2);
    });
  });

  describe('createInvoice', () => {
    it('should create invoice with line items', async () => {
      // Create a test customer first
      const { data: customer } = await supabase
        .from('customers')
        .insert({
          name: `TEST_${Date.now()}_InvoiceCustomer`,
          email: 'invoice@test.com',
        })
        .select()
        .single();
      
      if (customer) {
        createdCustomerIds.push(customer.id);
      }

      const testData = {
        ...mockInvoiceInput,
        invoiceNumber: `TEST_INV_${Date.now()}`,
        customerId: customer!.id,
      };

      const invoice = await invoiceService.createInvoice(testData);
      createdInvoiceIds.push(invoice.id);

      expect(invoice).toBeDefined();
      expect(invoice.invoiceNumber).toBe(testData.invoiceNumber);
      expect(invoice.customerId).toBe(testData.customerId);
      expect(invoice.subtotal).toBe(testData.subtotal);
      expect(invoice.total).toBe(testData.total);
      expect(invoice.status).toBe('draft');
    });
  });

  describe('getInvoices', () => {
    it('should return users invoices', async () => {
      // Create a test customer
      const { data: customer } = await supabase
        .from('customers')
        .insert({
          name: `TEST_${Date.now()}_GetInvoiceCustomer`,
          email: 'getinvoice@test.com',
        })
        .select()
        .single();
      
      if (customer) {
        createdCustomerIds.push(customer.id);
      }

      // Create a test invoice
      const invoice = await invoiceService.createInvoice({
        ...mockInvoiceInput,
        invoiceNumber: `TEST_INV_${Date.now()}_Get`,
        customerId: customer!.id,
      });
      createdInvoiceIds.push(invoice.id);

      const invoices = await invoiceService.getInvoices();

      expect(invoices).toBeDefined();
      expect(Array.isArray(invoices)).toBe(true);
      expect(invoices.some(inv => inv.id === invoice.id)).toBe(true);
    });
  });

  describe('updateInvoiceStatus', () => {
    it('should change invoice status correctly', async () => {
      // Create a test customer
      const { data: customer } = await supabase
        .from('customers')
        .insert({
          name: `TEST_${Date.now()}_StatusCustomer`,
          email: 'status@test.com',
        })
        .select()
        .single();
      
      if (customer) {
        createdCustomerIds.push(customer.id);
      }

      // Create a test invoice
      const invoice = await invoiceService.createInvoice({
        ...mockInvoiceInput,
        invoiceNumber: `TEST_INV_${Date.now()}_Status`,
        customerId: customer!.id,
      });
      createdInvoiceIds.push(invoice.id);

      // Update status to sent
      await invoiceService.updateInvoiceStatus(invoice.id, 'sent');

      // Verify status changed
      const { data: updated } = await supabase
        .from('invoices')
        .select('status')
        .eq('id', invoice.id)
        .single();

      expect(updated?.status).toBe('sent');
    });
  });
});

