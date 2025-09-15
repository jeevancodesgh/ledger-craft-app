/**
 * SOLID-compliant Data Manager
 * S - Single Responsibility: Each class has one reason to change
 * O - Open/Closed: Open for extension, closed for modification
 * L - Liskov Substitution: Can be substituted with any IDataManager implementation
 * I - Interface Segregation: Implements focused interfaces
 * D - Dependency Inversion: Depends on abstractions (ServiceContainer)
 */

import { IDataManager, IDataState, ILoadingState, IDataSubscriber } from "@/interfaces/IDataManager";
import { serviceContainer } from "@/services/ServiceContainer";
import { Customer, Invoice, BusinessProfile, Item, ItemCategory, Account, Expense, ExpenseCategory } from "@/types";
import { Payment, Receipt, CreatePaymentRequest, EnhancedInvoice } from "@/types/payment";

// Single Responsibility: State Management
class DataStateManager {
  private data: IDataState = {
    customers: [],
    invoices: [],
    businessProfile: null,
    items: [],
    itemCategories: [],
    accounts: [],
    expenses: [],
    expenseCategories: [],
    payments: [],
    receipts: [],
    units: ['each', 'hour', 'kg', 'g', 'mg', 'liter', 'ml', 'meter', 'cm', 'mm', 'sq meter', 'sq foot', 'cubic meter', 'cubic foot', 'gallon', 'quart', 'pint', 'ounce', 'lb', 'box', 'pack', 'pair', 'roll', 'set', 'sheet', 'unit']
  };

  private loading: ILoadingState = {
    customers: true,
    invoices: true,
    businessProfile: true,
    items: true,
    itemCategories: true,
    accounts: true,
    expenses: true,
    expenseCategories: true,
    payments: true,
    receipts: true
  };

  getData(): IDataState {
    return { ...this.data };
  }

  getLoading(): ILoadingState {
    return { ...this.loading };
  }

  updateData<K extends keyof IDataState>(key: K, value: IDataState[K]): void {
    this.data[key] = value;
  }

  updateLoading<K extends keyof ILoadingState>(key: K, value: ILoadingState[K]): void {
    this.loading[key] = value;
  }

  reset(): void {
    this.data = {
      customers: [],
      invoices: [],
      businessProfile: null,
      items: [],
      itemCategories: [],
      accounts: [],
      expenses: [],
      expenseCategories: [],
      payments: [],
      receipts: []
    };
    this.loading = {
      customers: true,
      invoices: true,
      businessProfile: true,
      items: true,
      itemCategories: true,
      accounts: true,
      expenses: true,
      expenseCategories: true,
      payments: true,
      receipts: true
    };
  }
}

// Single Responsibility: Subscription Management
class SubscriptionManager {
  private subscribers: Set<IDataSubscriber> = new Set();

  subscribe(callback: IDataSubscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  unsubscribe(callback: IDataSubscriber): void {
    this.subscribers.delete(callback);
  }

  notify(data: IDataState, loading: ILoadingState): void {
    this.subscribers.forEach(callback => {
      callback(data, loading);
    });
  }
}

// Single Responsibility: Lifecycle Management
class LifecycleManager {
  private initialized = false;
  private currentUserId: string | null = null;

  initialize(userId: string): boolean {
    if (this.initialized && this.currentUserId === userId) {
      console.log('DataManager: Already initialized for user', userId);
      return false; // Already initialized
    }

    if (this.currentUserId !== userId) {
      console.log('DataManager: New user, resetting data');
      this.reset();
    }

    console.log('DataManager: Initializing data for user', userId);
    this.currentUserId = userId;
    this.initialized = true;
    return true; // Needs initialization
  }

  reset(): void {
    console.log('DataManager: Resetting lifecycle');
    this.initialized = false;
    this.currentUserId = null;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }
}

// Main DataManager implementing all interfaces
class SOLIDDataManager implements IDataManager {
  private static instance: SOLIDDataManager;
  private stateManager = new DataStateManager();
  private subscriptionManager = new SubscriptionManager();
  private lifecycleManager = new LifecycleManager();

  private constructor() {}

  static getInstance(): SOLIDDataManager {
    if (!SOLIDDataManager.instance) {
      SOLIDDataManager.instance = new SOLIDDataManager();
    }
    return SOLIDDataManager.instance;
  }

  // ISubscriptionManager implementation
  subscribe(callback: IDataSubscriber): () => void {
    // Immediately call with current data
    callback(this.stateManager.getData(), this.stateManager.getLoading());
    return this.subscriptionManager.subscribe(callback);
  }

  unsubscribe(callback: IDataSubscriber): void {
    this.subscriptionManager.unsubscribe(callback);
  }

  notify(): void {
    this.subscriptionManager.notify(
      this.stateManager.getData(),
      this.stateManager.getLoading()
    );
  }

  // ILifecycleManager implementation
  async initialize(userId: string): Promise<void> {
    const needsInitialization = this.lifecycleManager.initialize(userId);
    
    if (!needsInitialization) {
      return;
    }

    // Fetch all data in parallel
    await Promise.all([
      this.fetchCustomers(),
      this.fetchInvoices(),
      this.fetchBusinessProfile(),
      this.fetchItems(),
      this.fetchItemCategories(),
      this.fetchAccounts(),
      this.fetchExpenses(),
      this.fetchExpenseCategories(),
      this.fetchPayments(),
      this.fetchReceipts()
    ]);
  }

  reset(): void {
    this.lifecycleManager.reset();
    this.stateManager.reset();
    this.notify();
  }

  isInitialized(): boolean {
    return this.lifecycleManager.isInitialized();
  }

  getCurrentUserId(): string | null {
    return this.lifecycleManager.getCurrentUserId();
  }

  // Data access
  getData(): IDataState {
    return this.stateManager.getData();
  }

  getLoading(): ILoadingState {
    return this.stateManager.getLoading();
  }

  // Generic fetch method following DRY principle
  private async fetchData<T>(
    key: keyof IDataState,
    fetchFn: () => Promise<T>,
    transform?: (data: T) => any
  ): Promise<void> {
    try {
      this.stateManager.updateLoading(key as keyof ILoadingState, true);
      this.notify();

      const result = await fetchFn();
      const transformedData = transform ? transform(result) : result;
      this.stateManager.updateData(key, transformedData);
    } catch (error) {
      console.error(`DataManager: Error fetching ${String(key)}:`, error);
    } finally {
      this.stateManager.updateLoading(key as keyof ILoadingState, false);
      this.notify();
    }
  }

  // IDataFetcher implementation
  async fetchCustomers(): Promise<void> {
    await this.fetchData('customers', () => serviceContainer.customerService.getCustomers());
  }

  async fetchInvoices(): Promise<void> {
    await this.fetchData('invoices', () => serviceContainer.invoiceService.getInvoices(), 
      (data: Invoice[]) => data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  }

  async fetchBusinessProfile(): Promise<void> {
    await this.fetchData('businessProfile', () => serviceContainer.businessProfileService.getBusinessProfile());
  }

  async fetchItems(): Promise<void> {
    await this.fetchData('items', () => serviceContainer.itemService.getItems());
  }

  async fetchItemCategories(): Promise<void> {
    await this.fetchData('itemCategories', () => serviceContainer.itemCategoryService.getItemCategories());
  }

  async fetchAccounts(): Promise<void> {
    await this.fetchData('accounts', () => serviceContainer.accountService.getAccounts());
  }

  async fetchExpenses(): Promise<void> {
    await this.fetchData('expenses', () => serviceContainer.expenseService.getExpenses());
  }

  async fetchExpenseCategories(): Promise<void> {
    await this.fetchData('expenseCategories', () => serviceContainer.expenseCategoryService.getExpenseCategories());
  }

  async fetchPayments(): Promise<void> {
    await this.fetchData('payments', () => serviceContainer.paymentService.getPayments());
  }

  async fetchReceipts(): Promise<void> {
    await this.fetchData('receipts', () => serviceContainer.paymentService.getReceipts());
  }

  // IDataCRUD implementation
  async createInvoice(invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt">): Promise<Invoice> {
    try {
      const newInvoice = await serviceContainer.invoiceService.createInvoice(invoice);
      const currentData = this.stateManager.getData();
      const updatedInvoices = [newInvoice, ...currentData.invoices]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.stateManager.updateData('invoices', updatedInvoices);
      this.notify();
      return newInvoice;
    } catch (error) {
      console.error('DataManager: Error creating invoice:', error);
      throw error;
    }
  }

  async updateInvoice(invoice: Invoice): Promise<Invoice> {
    try {
      const updatedInvoice = await serviceContainer.invoiceService.updateInvoice(invoice);
      const currentData = this.stateManager.getData();
      const index = currentData.invoices.findIndex(i => i.id === invoice.id);
      if (index !== -1) {
        const updatedInvoices = [...currentData.invoices];
        updatedInvoices[index] = updatedInvoice;
        this.stateManager.updateData('invoices', updatedInvoices);
        this.notify();
      }
      return updatedInvoice;
    } catch (error) {
      console.error('DataManager: Error updating invoice:', error);
      throw error;
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      await serviceContainer.invoiceService.deleteInvoice(id);
      const currentData = this.stateManager.getData();
      const updatedInvoices = currentData.invoices.filter(i => i.id !== id);
      this.stateManager.updateData('invoices', updatedInvoices);
      this.notify();
    } catch (error) {
      console.error('DataManager: Error deleting invoice:', error);
      throw error;
    }
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    try {
      return await serviceContainer.invoiceService.getInvoice(id);
    } catch (error) {
      console.error('DataManager: Error getting invoice:', error);
      throw error;
    }
  }

  async getNextInvoiceNumber(): Promise<string> {
    try {
      return await serviceContainer.invoiceService.getNextInvoiceNumber();
    } catch (error) {
      console.error('DataManager: Error getting next invoice number:', error);
      throw error;
    }
  }

  async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<Invoice> {
    try {
      const updatedInvoice = await serviceContainer.invoiceService.updateInvoiceStatus(id, status);
      const currentData = this.stateManager.getData();
      const index = currentData.invoices.findIndex(i => i.id === id);
      if (index !== -1) {
        const updatedInvoices = [...currentData.invoices];
        updatedInvoices[index] = updatedInvoice;
        this.stateManager.updateData('invoices', updatedInvoices);
        this.notify();
      }
      return updatedInvoice;
    } catch (error) {
      console.error('DataManager: Error updating invoice status:', error);
      throw error;
    }
  }

  // Customer CRUD operations
  async createCustomer(customer: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer> {
    try {
      const newCustomer = await serviceContainer.customerService.createCustomer(customer);
      const currentData = this.stateManager.getData();
      this.stateManager.updateData('customers', [...currentData.customers, newCustomer]);
      this.notify();
      return newCustomer;
    } catch (error) {
      console.error('DataManager: Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, customer: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">>): Promise<Customer> {
    try {
      const updatedCustomer = await serviceContainer.customerService.updateCustomer(id, customer);
      const currentData = this.stateManager.getData();
      const index = currentData.customers.findIndex(c => c.id === id);
      if (index !== -1) {
        const updatedCustomers = [...currentData.customers];
        updatedCustomers[index] = updatedCustomer;
        this.stateManager.updateData('customers', updatedCustomers);
        this.notify();
      }
      return updatedCustomer;
    } catch (error) {
      console.error('DataManager: Error updating customer:', error);
      throw error;
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      await serviceContainer.customerService.deleteCustomer(id);
      const currentData = this.stateManager.getData();
      const updatedCustomers = currentData.customers.filter(c => c.id !== id);
      this.stateManager.updateData('customers', updatedCustomers);
      this.notify();
    } catch (error) {
      console.error('DataManager: Error deleting customer:', error);
      throw error;
    }
  }

  async getCustomer(id: string): Promise<Customer | null> {
    try {
      return await serviceContainer.customerService.getCustomer(id);
    } catch (error) {
      console.error('DataManager: Error getting customer:', error);
      throw error;
    }
  }

  // Business Profile operations
  async saveBusinessProfile(profile: Omit<BusinessProfile, "id" | "createdAt" | "updatedAt">): Promise<BusinessProfile> {
    try {
      const savedProfile = await serviceContainer.businessProfileService.saveBusinessProfile(profile);
      this.stateManager.updateData('businessProfile', savedProfile);
      this.notify();
      return savedProfile;
    } catch (error) {
      console.error('DataManager: Error saving business profile:', error);
      throw error;
    }
  }

  async updateBusinessProfile(profile: BusinessProfile): Promise<BusinessProfile> {
    try {
      const updatedProfile = await serviceContainer.businessProfileService.updateBusinessProfile(profile);
      this.stateManager.updateData('businessProfile', updatedProfile);
      this.notify();
      return updatedProfile;
    } catch (error) {
      console.error('DataManager: Error updating business profile:', error);
      throw error;
    }
  }

  // Payment operations
  async createPayment(payment: CreatePaymentRequest): Promise<Payment> {
    try {
      const newPayment = await serviceContainer.paymentService.createPayment(payment);
      const currentData = this.stateManager.getData();
      this.stateManager.updateData('payments', [newPayment, ...currentData.payments]);
      // Refresh invoices and receipts to update payment status
      await Promise.all([this.fetchInvoices(), this.fetchReceipts()]);
      return newPayment;
    } catch (error) {
      console.error('DataManager: Error creating payment:', error);
      throw error;
    }
  }

  async getInvoicesWithBalance(): Promise<EnhancedInvoice[]> {
    try {
      return await serviceContainer.paymentService.getInvoicesWithBalance();
    } catch (error) {
      console.error('DataManager: Error getting invoices with balance:', error);
      throw error;
    }
  }
}

export const solidDataManager = SOLIDDataManager.getInstance();
