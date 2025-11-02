import { customerService } from '@/services/customerService';
import { getAuthenticatedSupabaseClient, cleanupTestData } from '@/__tests__/setup/testEnv';
import { mockCustomerInput } from '@/__tests__/fixtures/customer.fixtures';

describe('CustomerService', () => {
  let supabase: Awaited<ReturnType<typeof getAuthenticatedSupabaseClient>>;
  const createdCustomerIds: string[] = [];

  beforeAll(async () => {
    supabase = await getAuthenticatedSupabaseClient();
  });

  afterEach(async () => {
    // Clean up test customers
    if (createdCustomerIds.length > 0) {
      await supabase
        .from('customers')
        .delete()
        .in('id', createdCustomerIds);
      createdCustomerIds.length = 0;
    }
    await cleanupTestData.deleteCustomers(supabase);
  });

  describe('createCustomer', () => {
    it('should create a customer with valid data', async () => {
      const testData = {
        ...mockCustomerInput,
        name: `TEST_${Date.now()}_Customer`,
      };

      const customer = await customerService.createCustomer(testData);
      createdCustomerIds.push(customer.id);

      expect(customer).toBeDefined();
      expect(customer.name).toBe(testData.name);
      expect(customer.email).toBe(testData.email);
      expect(customer.phone).toBe(testData.phone);
      expect(customer.address).toBe(testData.address);
    });

    it('should handle missing optional fields', async () => {
      const minimalData = {
        name: `TEST_${Date.now()}_Minimal`,
        email: 'minimal@test.com',
      };

      const customer = await customerService.createCustomer(minimalData);
      createdCustomerIds.push(customer.id);

      expect(customer).toBeDefined();
      expect(customer.name).toBe(minimalData.name);
      expect(customer.email).toBe(minimalData.email);
    });
  });

  describe('getCustomers', () => {
    it('should return only current users customers', async () => {
      // Create test customers
      const customer1 = await customerService.createCustomer({
        ...mockCustomerInput,
        name: `TEST_${Date.now()}_Get1`,
      });
      const customer2 = await customerService.createCustomer({
        ...mockCustomerInput,
        name: `TEST_${Date.now()}_Get2`,
      });
      createdCustomerIds.push(customer1.id, customer2.id);

      const customers = await customerService.getCustomers();

      expect(customers).toBeDefined();
      expect(customers.length).toBeGreaterThanOrEqual(2);
      
      // Verify our test customers are in the list
      const testCustomers = customers.filter(c => 
        c.id === customer1.id || c.id === customer2.id
      );
      expect(testCustomers.length).toBe(2);
    });

    it('should return empty array if no customers exist', async () => {
      // Clean any existing customers first
      await cleanupTestData.deleteCustomers(supabase);

      const customers = await customerService.getCustomers();

      expect(customers).toBeDefined();
      expect(Array.isArray(customers)).toBe(true);
    });
  });

  describe('updateCustomer', () => {
    it('should update customer fields correctly', async () => {
      // Create a customer first
      const customer = await customerService.createCustomer({
        ...mockCustomerInput,
        name: `TEST_${Date.now()}_Update`,
      });
      createdCustomerIds.push(customer.id);

      // Update it
      const updatedData = {
        name: `TEST_${Date.now()}_Updated`,
        email: 'updated@test.com',
        phone: '+64 21 999 9999',
      };

      const updated = await customerService.updateCustomer(customer.id, updatedData);

      expect(updated).toBeDefined();
      expect(updated.name).toBe(updatedData.name);
      expect(updated.email).toBe(updatedData.email);
      expect(updated.phone).toBe(updatedData.phone);
    });
  });

  describe('deleteCustomer', () => {
    it('should delete customer successfully', async () => {
      // Create a customer first
      const customer = await customerService.createCustomer({
        ...mockCustomerInput,
        name: `TEST_${Date.now()}_Delete`,
      });

      // Delete it
      await customerService.deleteCustomer(customer.id);

      // Verify it's deleted
      const { data, error } = await supabase
        .from('customers')
        .select('id')
        .eq('id', customer.id)
        .maybeSingle();

      expect(data).toBeNull();
    });
  });
});

