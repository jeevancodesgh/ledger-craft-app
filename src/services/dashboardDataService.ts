import { supabase } from '@/lib/supabase';
import { startOfMonth, endOfMonth, format, subMonths, startOfWeek, endOfWeek, eachDayOfInterval, eachMonthOfInterval, subDays } from 'date-fns';

export interface RevenueExpenseData {
  month: string;
  revenue: number;
  expenses: number;
}

export interface CashFlowData {
  day: string;
  inflow: number;
  outflow: number;
}

export interface ExpenseBreakdownData {
  category: string;
  amount: number;
  percentage: number;
}

export interface AccountTypeData {
  name: string;
  value: number;
  color: string;
}

export class DashboardDataService {
  private static instance: DashboardDataService;
  
  static getInstance(): DashboardDataService {
    if (!DashboardDataService.instance) {
      DashboardDataService.instance = new DashboardDataService();
    }
    return DashboardDataService.instance;
  }

  async getRevenueExpenseData(months: number = 6): Promise<RevenueExpenseData[]> {
    try {
      const endDate = new Date();
      const startDate = subMonths(endDate, months);
      
      // Get all months in the range
      const monthsInRange = eachMonthOfInterval({ start: startDate, end: endDate });
      
      // Get invoice data
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('total_amount, created_at, status')
        .eq('status', 'paid')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (invoiceError) throw invoiceError;

      // Get expense data
      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('amount, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (expenseError) throw expenseError;

      // Group data by month
      const monthlyData: RevenueExpenseData[] = monthsInRange.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        // Calculate revenue for this month
        const monthRevenue = invoices
          ?.filter(invoice => {
            const invoiceDate = new Date(invoice.created_at);
            return invoiceDate >= monthStart && invoiceDate <= monthEnd;
          })
          .reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0;

        // Calculate expenses for this month
        const monthExpenses = expenses
          ?.filter(expense => {
            const expenseDate = new Date(expense.created_at);
            return expenseDate >= monthStart && expenseDate <= monthEnd;
          })
          .reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;

        return {
          month: format(month, 'MMM'),
          revenue: monthRevenue,
          expenses: monthExpenses
        };
      });

      return monthlyData;
    } catch (error) {
      console.error('Error fetching revenue/expense data:', error);
      return [];
    }
  }

  async getCashFlowData(days: number = 30): Promise<CashFlowData[]> {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, days);
      
      // Get cash inflows (paid invoices)
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('total_amount, created_at, status')
        .eq('status', 'paid')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (invoiceError) throw invoiceError;

      // Get cash outflows (expenses)
      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('amount, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (expenseError) throw expenseError;

      // Group by week for better visualization
      const weeklyData: CashFlowData[] = [];
      const weeksInRange = Math.ceil(days / 7);
      
      for (let i = 0; i < weeksInRange; i++) {
        const weekStart = subDays(endDate, (weeksInRange - i - 1) * 7);
        const weekEnd = subDays(endDate, (weeksInRange - i - 2) * 7);
        
        // Calculate inflow for this week
        const weekInflow = invoices
          ?.filter(invoice => {
            const invoiceDate = new Date(invoice.created_at);
            return invoiceDate >= weekStart && invoiceDate <= weekEnd;
          })
          .reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0;

        // Calculate outflow for this week
        const weekOutflow = expenses
          ?.filter(expense => {
            const expenseDate = new Date(expense.created_at);
            return expenseDate >= weekStart && expenseDate <= weekEnd;
          })
          .reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;

        weeklyData.push({
          day: format(weekStart, 'dd'),
          inflow: weekInflow,
          outflow: weekOutflow
        });
      }

      return weeklyData;
    } catch (error) {
      console.error('Error fetching cash flow data:', error);
      return [];
    }
  }

  async getExpenseBreakdownData(): Promise<ExpenseBreakdownData[]> {
    try {
      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(new Date());
      
      // Get expense data grouped by category
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('amount, category')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Group by category
      const categoryTotals = new Map<string, number>();
      let totalExpenses = 0;

      expenses?.forEach(expense => {
        const category = expense.category || 'General';
        const amount = expense.amount || 0;
        categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
        totalExpenses += amount;
      });

      // Convert to array and calculate percentages
      const breakdownData: ExpenseBreakdownData[] = Array.from(categoryTotals.entries())
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount) // Sort by amount descending
        .slice(0, 10); // Top 10 categories

      return breakdownData;
    } catch (error) {
      console.error('Error fetching expense breakdown data:', error);
      return [];
    }
  }

  async getAccountTypeData(): Promise<AccountTypeData[]> {
    try {
      // Get bank account balances (assets)
      const { data: bankAccounts, error: bankError } = await supabase
        .from('bank_accounts')
        .select('balance, account_type');

      if (bankError) throw bankError;

      // Get accounts receivable (assets)
      const { data: unpaidInvoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('status', 'sent');

      if (invoiceError) throw invoiceError;

      // Get accounts payable (liabilities)
      const { data: unpaidExpenses, error: expenseError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('status', 'pending');

      if (expenseError) throw expenseError;

      // Calculate totals
      const cashAssets = bankAccounts?.reduce((sum, account) => sum + (account.balance || 0), 0) || 0;
      const receivables = unpaidInvoices?.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0;
      const totalAssets = cashAssets + receivables;

      const totalLiabilities = unpaidExpenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
      const equity = totalAssets - totalLiabilities;

      return [
        { name: 'Assets', value: totalAssets, color: '#10B981' },
        { name: 'Liabilities', value: totalLiabilities, color: '#EF4444' },
        { name: 'Equity', value: equity, color: '#3B82F6' }
      ];
    } catch (error) {
      console.error('Error fetching account type data:', error);
      return [
        { name: 'Assets', value: 0, color: '#10B981' },
        { name: 'Liabilities', value: 0, color: '#EF4444' },
        { name: 'Equity', value: 0, color: '#3B82F6' }
      ];
    }
  }

  async getReceivablesAging(): Promise<{
    current: number;
    thirtyDays: number;
    sixtyDays: number;
  }> {
    try {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const sixtyDaysAgo = subDays(now, 60);

      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('total_amount, created_at, due_date')
        .eq('status', 'sent');

      if (error) throw error;

      let current = 0;
      let thirtyDays = 0;
      let sixtyDays = 0;

      invoices?.forEach(invoice => {
        const dueDate = new Date(invoice.due_date || invoice.created_at);
        const amount = invoice.total_amount || 0;

        if (dueDate >= thirtyDaysAgo) {
          current += amount;
        } else if (dueDate >= sixtyDaysAgo) {
          thirtyDays += amount;
        } else {
          sixtyDays += amount;
        }
      });

      return { current, thirtyDays, sixtyDays };
    } catch (error) {
      console.error('Error fetching receivables aging:', error);
      return { current: 0, thirtyDays: 0, sixtyDays: 0 };
    }
  }

  async getPayablesAging(): Promise<{
    notDue: number;
    dueThisWeek: number;
    overdue: number;
  }> {
    try {
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('amount, due_date, created_at')
        .eq('status', 'pending');

      if (error) throw error;

      let notDue = 0;
      let dueThisWeek = 0;
      let overdue = 0;

      expenses?.forEach(expense => {
        const dueDate = new Date(expense.due_date || expense.created_at);
        const amount = expense.amount || 0;

        if (dueDate > oneWeekFromNow) {
          notDue += amount;
        } else if (dueDate >= now) {
          dueThisWeek += amount;
        } else {
          overdue += amount;
        }
      });

      return { notDue, dueThisWeek, overdue };
    } catch (error) {
      console.error('Error fetching payables aging:', error);
      return { notDue: 0, dueThisWeek: 0, overdue: 0 };
    }
  }
}

export const dashboardDataService = DashboardDataService.getInstance();