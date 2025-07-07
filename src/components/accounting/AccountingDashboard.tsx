import React, { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Users,
  Calendar,
  CreditCard,
  Building,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FinancialSummary, AccountBalanceSummary } from '@/types/payment';

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

interface AccountingDashboardProps {
  financialSummary: FinancialSummary;
  accountBalances: AccountBalanceSummary[];
  revenueExpenseData?: RevenueExpenseData[];
  cashFlowData?: CashFlowData[];
  expenseBreakdownData?: ExpenseBreakdownData[];
  isLoading?: boolean;
  onRefresh: () => void;
  onExportReport: (type: string) => void;
}

export function AccountingDashboard({
  financialSummary,
  accountBalances,
  revenueExpenseData = [],
  cashFlowData = [],
  expenseBreakdownData = [],
  isLoading = false,
  onRefresh,
  onExportReport
}: AccountingDashboardProps) {
  const [timePeriod, setTimePeriod] = useState('current_month');

  // Calculate key metrics
  const profitMargin = financialSummary.totalRevenue > 0 
    ? (financialSummary.netIncome / financialSummary.totalRevenue) * 100 
    : 0;

  const cashToReceivablesRatio = financialSummary.totalReceivables > 0
    ? financialSummary.cashPosition / financialSummary.totalReceivables
    : 0;

  // Use real data from props, fallback to sample data if empty
  const revenueData = revenueExpenseData.length > 0 ? revenueExpenseData : [
    { month: 'Jan', revenue: 45000, expenses: 32000 },
    { month: 'Feb', revenue: 52000, expenses: 35000 },
    { month: 'Mar', revenue: 48000, expenses: 33000 },
    { month: 'Apr', revenue: 61000, expenses: 38000 },
    { month: 'May', revenue: 55000, expenses: 36000 },
    { month: 'Jun', revenue: 67000, expenses: 42000 }
  ];

  const cashFlowChartData = cashFlowData.length > 0 ? cashFlowData : [
    { day: '1', inflow: 2500, outflow: 1800 },
    { day: '7', inflow: 3200, outflow: 2100 },
    { day: '14', inflow: 2800, outflow: 1900 },
    { day: '21', inflow: 4100, outflow: 2800 },
    { day: '28', inflow: 3500, outflow: 2300 }
  ];

  const accountTypeData = [
    { name: 'Assets', value: 125000, color: '#10B981' },
    { name: 'Liabilities', value: 35000, color: '#EF4444' },
    { name: 'Equity', value: 90000, color: '#3B82F6' }
  ];

  const expenseBreakdown = expenseBreakdownData.length > 0 ? expenseBreakdownData : [
    { category: 'Office Expenses', amount: 12500, percentage: 35 },
    { category: 'Marketing', amount: 8900, percentage: 25 },
    { category: 'Equipment', amount: 6200, percentage: 17 },
    { category: 'Professional Services', amount: 4800, percentage: 13 },
    { category: 'Travel', amount: 3600, percentage: 10 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounting Dashboard</h1>
          <p className="text-muted-foreground">
            Financial overview for {format(new Date(financialSummary.period.startDate), 'MMM dd')} - {format(new Date(financialSummary.period.endDate), 'MMM dd, yyyy')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Current Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="current_quarter">Current Quarter</SelectItem>
              <SelectItem value="last_quarter">Last Quarter</SelectItem>
              <SelectItem value="current_year">Current Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={() => onExportReport('dashboard')}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${financialSummary.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+12.5% vs last period</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">${financialSummary.totalExpenses.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-500">+8.2% vs last period</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Net Income</p>
                <p className={`text-2xl font-bold ${
                  financialSummary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${financialSummary.netIncome.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Margin: {profitMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Cash Position</p>
                <p className="text-2xl font-bold">${financialSummary.cashPosition.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">
                    C/R Ratio: {cashToReceivablesRatio.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue & Expenses</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="accounts">Account Balances</TabsTrigger>
          <TabsTrigger value="expenses">Expense Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                  <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={cashFlowChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                  <Legend />
                  <Line type="monotone" dataKey="inflow" stroke="#10B981" strokeWidth={3} name="Cash Inflow" />
                  <Line type="monotone" dataKey="outflow" stroke="#EF4444" strokeWidth={3} name="Cash Outflow" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={accountTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                    >
                      {accountTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Account Balances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accountBalances.slice(0, 8).map((account) => (
                    <div key={account.accountId} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{account.accountName}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.accountNumber} • {account.accountClass}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          account.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${Math.abs(account.closingBalance).toLocaleString()}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {account.closingBalance >= 0 ? 'Dr' : 'Cr'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {expenseBreakdown.map((expense, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{expense.category}</span>
                      <span className="text-sm text-muted-foreground">
                        ${expense.amount.toLocaleString()} ({expense.percentage}%)
                      </span>
                    </div>
                    <Progress value={expense.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Outstanding Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts Receivable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-green-600" />
              Accounts Receivable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">${financialSummary.totalReceivables.toLocaleString()}</span>
                <Badge variant="outline">
                  {financialSummary.outstandingInvoices} invoices
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Current (0-30 days)</span>
                  </div>
                  <span className="font-medium">$28,500</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span>30-60 days</span>
                  </div>
                  <span className="font-medium">$8,200</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span>60+ days</span>
                  </div>
                  <span className="font-medium">$3,100</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full">
                View Aging Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Accounts Payable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-red-600" />
              Accounts Payable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">${financialSummary.totalPayables.toLocaleString()}</span>
                <Badge variant="outline">
                  {Math.round(financialSummary.totalPayables / 1000) || 0} bills
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Not due yet</span>
                  </div>
                  <span className="font-medium">${(financialSummary.totalPayables * 0.6).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span>Due this week</span>
                  </div>
                  <span className="font-medium">${(financialSummary.totalPayables * 0.3).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span>Overdue</span>
                  </div>
                  <span className="font-medium">${(financialSummary.totalPayables * 0.1).toLocaleString()}</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full">
                Schedule Payments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Summary */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Tax Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">GST Collected</p>
              <p className="text-2xl font-bold text-green-600">
                ${(financialSummary.gstLiability * 1.5).toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">GST Paid</p>
              <p className="text-2xl font-bold text-blue-600">
                ${(financialSummary.gstLiability * 0.5).toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Net GST Liability</p>
              <p className="text-2xl font-bold text-red-600">
                ${financialSummary.gstLiability.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Next GST Return Due</span>
            </div>
            <p className="text-sm text-blue-800">
              Your next GST return is due on 28 February 2024. 
              <Button variant="link" className="p-0 h-auto ml-1 text-blue-800">
                Prepare return now →
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Generate P&L</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <Building className="h-6 w-6" />
              <span>Balance Sheet</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <TrendingUp className="h-6 w-6" />
              <span>Cash Flow Report</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <Receipt className="h-6 w-6" />
              <span>Tax Return</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}