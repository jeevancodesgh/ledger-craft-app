import React, { useState, useEffect } from 'react';
import { AccountingDashboard } from '@/components/accounting/AccountingDashboard';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { FinancialSummary, AccountBalanceSummary } from '@/types/payment';

export default function AccountingDashboardPage() {
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [accountBalances, setAccountBalances] = useState<AccountBalanceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();

  const fetchAccountingData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock financial summary data
      const mockFinancialSummary: FinancialSummary = {
        totalRevenue: 125000,
        totalExpenses: 87500,
        netIncome: 37500,
        totalReceivables: 45000,
        totalPayables: 22000,
        cashPosition: 68000,
        gstLiability: 15750,
        outstandingInvoices: 12,
        period: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }
      };

      // Mock account balances
      const mockAccountBalances: AccountBalanceSummary[] = [
        {
          accountId: 'acc-1',
          accountName: 'Business Checking',
          accountNumber: '1110',
          accountClass: 'Asset',
          openingBalance: 45000,
          totalDebits: 85000,
          totalCredits: 62000,
          closingBalance: 68000
        },
        {
          accountId: 'acc-2',
          accountName: 'Accounts Receivable',
          accountNumber: '1200',
          accountClass: 'Asset',
          openingBalance: 38000,
          totalDebits: 95000,
          totalCredits: 88000,
          closingBalance: 45000
        },
        {
          accountId: 'acc-3',
          accountName: 'Office Equipment',
          accountNumber: '1500',
          accountClass: 'Asset',
          openingBalance: 25000,
          totalDebits: 5000,
          totalCredits: 2000,
          closingBalance: 28000
        },
        {
          accountId: 'acc-4',
          accountName: 'Accounts Payable',
          accountNumber: '2100',
          accountClass: 'Liability',
          openingBalance: 18000,
          totalDebits: 45000,
          totalCredits: 49000,
          closingBalance: 22000
        },
        {
          accountId: 'acc-5',
          accountName: 'GST Payable',
          accountNumber: '2200',
          accountClass: 'Liability',
          openingBalance: 12000,
          totalDebits: 8500,
          totalCredits: 12250,
          closingBalance: 15750
        },
        {
          accountId: 'acc-6',
          accountName: 'Service Revenue',
          accountNumber: '4000',
          accountClass: 'Revenue',
          openingBalance: 0,
          totalDebits: 0,
          totalCredits: 125000,
          closingBalance: 125000
        },
        {
          accountId: 'acc-7',
          accountName: 'Office Rent',
          accountNumber: '6000',
          accountClass: 'Expense',
          openingBalance: 0,
          totalDebits: 24000,
          totalCredits: 0,
          closingBalance: 24000
        },
        {
          accountId: 'acc-8',
          accountName: 'Marketing Expenses',
          accountNumber: '6400',
          accountClass: 'Expense',
          openingBalance: 0,
          totalDebits: 15500,
          totalCredits: 0,
          closingBalance: 15500
        }
      ];

      setFinancialSummary(mockFinancialSummary);
      setAccountBalances(mockAccountBalances);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load accounting data",
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
      isLoading={isLoading}
      onRefresh={handleRefresh}
      onExportReport={handleExportReport}
    />
  );
}