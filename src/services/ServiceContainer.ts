/**
 * Dependency Injection Container following SOLID principles
 * Single Responsibility: Manages service dependencies
 * Open/Closed: Easy to extend with new services
 * Dependency Inversion: Depends on abstractions, not concretions
 */

import { customerService, invoiceService, businessProfileService, itemService, itemCategoryService, accountService, expenseService, expenseCategoryService } from "@/services/supabaseService";
import { paymentService } from "@/services/paymentService";

// Service interfaces for dependency inversion
export interface ICustomerService {
  getCustomers(): Promise<any[]>;
  createCustomer(customer: any): Promise<any>;
  updateCustomer(id: string, customer: any): Promise<any>;
  deleteCustomer(id: string): Promise<void>;
  getCustomer(id: string): Promise<any>;
}

export interface IInvoiceService {
  getInvoices(): Promise<any[]>;
  createInvoice(invoice: any, lineItems: any[]): Promise<any>;
  updateInvoice(id: string, invoice: any): Promise<any>;
  deleteInvoice(id: string): Promise<void>;
  getInvoice(id: string): Promise<any>;
  getNextInvoiceNumber(): Promise<string>;
  updateInvoiceStatus(id: string, status: any): Promise<any>;
}

export interface IBusinessProfileService {
  getBusinessProfile(): Promise<any>;
  saveBusinessProfile(profile: any): Promise<any>;
  updateBusinessProfile(profile: any): Promise<any>;
}

export interface IPaymentService {
  getPayments(): Promise<any[]>;
  getReceipts(): Promise<any[]>;
  createPayment(payment: any): Promise<any>;
  getInvoicesWithBalance(): Promise<any[]>;
}

export interface IItemService {
  getItems(): Promise<any[]>;
  createItem(item: any): Promise<any>;
  updateItem(id: string, item: any): Promise<any>;
  deleteItem(id: string): Promise<void>;
  getItem(id: string): Promise<any>;
}

export interface IItemCategoryService {
  getItemCategories(): Promise<any[]>;
  createItemCategory(category: any): Promise<any>;
  updateItemCategory(id: string, category: any): Promise<any>;
  deleteItemCategory(id: string): Promise<void>;
  getItemCategory(id: string): Promise<any>;
}

export interface IAccountService {
  getAccounts(): Promise<any[]>;
}

export interface IExpenseService {
  getExpenses(): Promise<any[]>;
  createExpense(expense: any): Promise<any>;
  updateExpense(id: string, expense: any): Promise<any>;
  deleteExpense(id: string): Promise<void>;
  getExpense(id: string): Promise<any>;
}

export interface IExpenseCategoryService {
  getExpenseCategories(): Promise<any[]>;
  createExpenseCategory(category: any): Promise<any>;
  updateExpenseCategory(id: string, category: any): Promise<any>;
  deleteExpenseCategory(id: string): Promise<void>;
  getExpenseCategory(id: string): Promise<any>;
}

// Service container class
class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, any> = new Map();

  private constructor() {
    this.registerDefaultServices();
  }

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  private registerDefaultServices(): void {
    // Register all services with their interfaces
    this.register('customerService', customerService);
    this.register('invoiceService', invoiceService);
    this.register('businessProfileService', businessProfileService);
    this.register('itemService', itemService);
    this.register('itemCategoryService', itemCategoryService);
    this.register('accountService', accountService);
    this.register('expenseService', expenseService);
    this.register('expenseCategoryService', expenseCategoryService);
    this.register('paymentService', paymentService);
  }

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found in container`);
    }
    return service as T;
  }

  // Convenience getters for type safety
  get customerService(): ICustomerService {
    return this.get<ICustomerService>('customerService');
  }

  get invoiceService(): IInvoiceService {
    return this.get<IInvoiceService>('invoiceService');
  }

  get businessProfileService(): IBusinessProfileService {
    return this.get<IBusinessProfileService>('businessProfileService');
  }

  get paymentService(): IPaymentService {
    return this.get<IPaymentService>('paymentService');
  }

  get itemService(): IItemService {
    return this.get<IItemService>('itemService');
  }

  get itemCategoryService(): IItemCategoryService {
    return this.get<IItemCategoryService>('itemCategoryService');
  }

  get accountService(): IAccountService {
    return this.get<IAccountService>('accountService');
  }

  get expenseService(): IExpenseService {
    return this.get<IExpenseService>('expenseService');
  }

  get expenseCategoryService(): IExpenseCategoryService {
    return this.get<IExpenseCategoryService>('expenseCategoryService');
  }
}

export const serviceContainer = ServiceContainer.getInstance();
