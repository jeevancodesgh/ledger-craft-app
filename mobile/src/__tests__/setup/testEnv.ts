import { createClient } from '@supabase/supabase-js';

// Test user credentials (can be overridden with environment variables)
// Matches web app E2E test configuration
export const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || process.env.EXPO_PUBLIC_TEST_EMAIL || 'test@ledgercraft.com',
  password: process.env.E2E_TEST_PASSWORD || process.env.EXPO_PUBLIC_TEST_PASSWORD || 'Test123!@#',
  userId: '', // Will be set after authentication
};

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://viqckjmborlqaemavrzu.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpcWNram1ib3JscWFlbWF2cnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NjIxMzIsImV4cCI6MjA2MDQzODEzMn0.ccFdzJbDBjGzYaGenOz8Gnsuyj-LtljPeXAjcFyPllA';

// Create test Supabase client (without SecureStore for testing)
export const createTestSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: (key: string) => Promise.resolve(null),
        setItem: (key: string, value: string) => Promise.resolve(),
        removeItem: (key: string) => Promise.resolve(),
      },
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
};

// Get authenticated Supabase client for tests
export const getAuthenticatedSupabaseClient = async () => {
  const client = createTestSupabaseClient();
  
  const { data, error } = await client.auth.signInWithPassword({
    email: TEST_USER.email,
    password: TEST_USER.password,
  });

  if (error) {
    throw new Error(`Failed to authenticate test user: ${error.message}`);
  }

  if (data.user) {
    TEST_USER.userId = data.user.id;
  }

  return client;
};

// Cleanup utilities for test data
export const cleanupTestData = {
  // Delete test customers
  async deleteCustomers(client: ReturnType<typeof createTestSupabaseClient>, prefix: string = 'TEST_') {
    const { data: customers } = await client
      .from('customers')
      .select('id, name')
      .ilike('name', `${prefix}%`);

    if (customers && customers.length > 0) {
      const ids = customers.map((c: any) => c.id);
      await client.from('customers').delete().in('id', ids);
      console.log(`Cleaned up ${customers.length} test customers`);
    }
  },

  // Delete test items
  async deleteItems(client: ReturnType<typeof createTestSupabaseClient>, prefix: string = 'TEST_') {
    const { data: items } = await client
      .from('items')
      .select('id, name')
      .ilike('name', `${prefix}%`);

    if (items && items.length > 0) {
      const ids = items.map((i: any) => i.id);
      await client.from('items').delete().in('id', ids);
      console.log(`Cleaned up ${items.length} test items`);
    }
  },

  // Delete test invoices
  async deleteInvoices(client: ReturnType<typeof createTestSupabaseClient>, prefix: string = 'TEST_INV_') {
    const { data: invoices } = await client
      .from('invoices')
      .select('id, invoice_number')
      .ilike('invoice_number', `${prefix}%`);

    if (invoices && invoices.length > 0) {
      const ids = invoices.map((inv: any) => inv.id);
      
      // Delete line items first (foreign key constraint)
      await client.from('line_items').delete().in('invoice_id', ids);
      
      // Then delete invoices
      await client.from('invoices').delete().in('id', ids);
      console.log(`Cleaned up ${invoices.length} test invoices`);
    }
  },

  // Delete test business profile (use with caution)
  async deleteBusinessProfile(client: ReturnType<typeof createTestSupabaseClient>, userId: string) {
    await client
      .from('business_profiles')
      .delete()
      .eq('user_id', userId);
    console.log(`Cleaned up business profile for user ${userId}`);
  },

  // Clean all test data for current user
  async cleanAll(client: ReturnType<typeof createTestSupabaseClient>) {
    await this.deleteInvoices(client);
    await this.deleteCustomers(client);
    await this.deleteItems(client);
  },
};

// Mock navigation functions
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => true),
  getId: jest.fn(() => 'test-screen'),
  getState: jest.fn(() => ({})),
  getParent: jest.fn(),
  addListener: jest.fn(() => () => {}),
  removeListener: jest.fn(),
};

// Mock route
export const mockRoute = {
  key: 'test-route',
  name: 'TestScreen',
  params: {},
};

