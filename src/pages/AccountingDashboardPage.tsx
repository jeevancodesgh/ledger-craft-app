import React, { useState, useEffect } from 'react';
import { AccountingDashboard } from '@/components/accounting/AccountingDashboard';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { FinancialSummary, AccountBalanceSummary } from '@/types/payment';
import { accountingService } from '@/services/accountingService';
// import { testSupabaseConnection } from '@/services/accountingServiceTest';

interface RevenueExpenseData {
  month: string;
  revenue: number;
  expenses: number;
}

interface CashFlowData {
  day: string;
  inflow: number;
  outflow: number;
}

interface ExpenseBreakdownData {
  category: string;
  amount: number;
  percentage: number;
}

export default function AccountingDashboardPage() {
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [accountBalances, setAccountBalances] = useState<AccountBalanceSummary[]>([]);
  const [revenueExpenseData, setRevenueExpenseData] = useState<RevenueExpenseData[]>([]);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [expenseBreakdownData, setExpenseBreakdownData] = useState<ExpenseBreakdownData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();

  const fetchAccountingData = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching accounting data from Supabase...');
      
      // Fetch all real data from Supabase
      const [
        financialData, 
        accountData, 
        revenueData, 
        cashData, 
        expenseData
      ] = await Promise.all([
        accountingService.getFinancialSummary(),
        accountingService.getAccountBalances(),
        accountingService.getRevenueExpenseData(6),
        accountingService.getCashFlowData(28),
        accountingService.getExpenseBreakdown()
      ]);

      setFinancialSummary(financialData);
      setAccountBalances(accountData);
      setRevenueExpenseData(revenueData);
      setCashFlowData(cashData);
      setExpenseBreakdownData(expenseData);
      
      console.log('All accounting data loaded successfully');
    } catch (error) {
      console.error('Failed to load accounting data:', error);
      toast({
        title: "Error",
        description: `Failed to load accounting data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountingData();
  }, []);

  const handleRefresh = () => {
    fetchAccountingData();
  };

  const handleExportReport = async (type: string) => {
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} report exported successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive"
      });
    }
  };

  if (isLoading || !financialSummary) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart Skeleton */}
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>

        {/* Additional Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <AccountingDashboard
      financialSummary={financialSummary}
      accountBalances={accountBalances}
      revenueExpenseData={revenueExpenseData}
      cashFlowData={cashFlowData}
      expenseBreakdownData={expenseBreakdownData}
      isLoading={isLoading}
      onRefresh={handleRefresh}
      onExportReport={handleExportReport}
    />
  );
}