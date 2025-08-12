import React, { useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/utils/invoiceUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps, LineChart, Line, ComposedChart } from 'recharts';
import { PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar, DollarSign, Users, TrendingUp, TrendingDown, Clock, Plus, Edit, ChevronRight, CreditCard, Receipt, AlertTriangle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileBalanceCard from '@/components/mobile/MobileBalanceCard';
import MobileQuickActions from '@/components/mobile/MobileQuickActions';
import MobileChartCard from '@/components/mobile/MobileChartCard';

const Dashboard = () => {
  const { 
    invoices, 
    isLoadingInvoices, 
    customers, 
    isLoadingCustomers, 
    expenses,
    isLoadingExpenses,
    expenseCategories,
    refreshInvoices, 
    refreshCustomers,
    refreshExpenses 
  } = useAppContext();
  
  useEffect(() => {
    refreshInvoices();
    refreshCustomers();
    refreshExpenses();
  }, []);
  
  const isLoadingStats = isLoadingInvoices || isLoadingCustomers || isLoadingExpenses;
  const isMobile = useIsMobile();
  
  // Calculate invoice stats
  const totalInvoices = invoices.length;
  const totalCustomers = customers.length;
  const customerCount = customers.length;
  const totalEarnings = invoices.reduce((sum, invoice) => sum + invoice.total, 0);

  // Calculate expense stats
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const currentMonthExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.expenseDate);
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Financial KPIs
  const netIncome = totalEarnings - totalExpenses;
  const profitMargin = totalEarnings > 0 ? ((netIncome / totalEarnings) * 100) : 0;
  const expenseRatio = totalEarnings > 0 ? ((totalExpenses / totalEarnings) * 100) : 0;
  const burnRate = currentMonthExpenses; // Monthly burn rate

  // Calculate revenue and expenses by month for current year
  const currentYear = new Date().getFullYear();
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({ 
    month: i + 1, 
    revenue: 0, 
    expenses: 0,
    netIncome: 0 
  }));

  // Process invoices
  invoices.forEach(invoice => {
    const date = new Date(invoice.date);
    if (date.getFullYear() === currentYear && invoice.status === 'paid') {
      monthlyData[date.getMonth()].revenue += invoice.total;
    }
  });

  // Process expenses
  expenses.forEach(expense => {
    const date = new Date(expense.expenseDate);
    if (date.getFullYear() === currentYear) {
      monthlyData[date.getMonth()].expenses += expense.amount;
    }
  });

  // Calculate net income for each month
  monthlyData.forEach(month => {
    month.netIncome = month.revenue - month.expenses;
  });

  const revenueByMonth = monthlyData.map(item => ({
    month: item.month,
    revenue: item.revenue
  }));

  // Calculate invoice status counts
  let paidInvoices = 0, unpaidInvoices = 0, overdueInvoices = 0;
  invoices.forEach(invoice => {
    if (invoice.status === 'paid') paidInvoices++;
    else if (invoice.status === 'sent') unpaidInvoices++;
    else if (invoice.status === 'overdue') overdueInvoices++;
  });

  // Calculate expense categories breakdown
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const categoryName = expense.category?.name || 'Uncategorized';
    acc[categoryName] = (acc[categoryName] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const expenseCategoryData = Object.entries(expensesByCategory)
    .map(([name, amount]) => ({ name, amount, color: getRandomColor() }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5); // Top 5 categories

  // Helper function for category colors
  function getRandomColor() {
    const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#84CC16'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Recent high-value expenses
  const recentHighExpenses = [...expenses]
    .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
    .slice(0, 5)
    .filter(expense => expense.amount > 100); // Only show expenses > $100

  // Billable expenses not yet invoiced
  const billableExpenses = expenses
    .filter(expense => expense.isBillable && expense.customerId)
    .reduce((sum, expense) => sum + expense.amount, 0);

  if (isLoadingStats) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  }

  // Helper function to get trend indicator
  const getTrendIcon = (value: number, isGoodWhenPositive = true) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    const isGood = isGoodWhenPositive ? isPositive : !isPositive;
    return isGood ? 
      <TrendingUp className="h-4 w-4 text-emerald-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  // Get financial health color
  const getHealthColor = (margin: number) => {
    if (margin >= 10) return 'text-emerald-600';
    if (margin >= 5) return 'text-amber-500';
    return 'text-red-500';
  };

  // Calculate month names for charts
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = revenueByMonth.map(item => ({
    name: monthNames[item.month - 1],
    revenue: item.revenue
  }));

  // Combined financial data for cash flow chart
  const cashFlowData = monthlyData.map(item => ({
    name: monthNames[item.month - 1],
    revenue: item.revenue,
    expenses: item.expenses,
    netIncome: item.netIncome
  }));

  // Financial overview pie chart data
  const financialOverviewData = [
    { name: 'Revenue', value: totalEarnings, color: '#10B981' },
    { name: 'Expenses', value: totalExpenses, color: '#EF4444' }
  ];

  // Calculate invoice status distribution for pie chart
  const totalStatusInvoices = paidInvoices + unpaidInvoices + overdueInvoices;
  const invoiceStatusData = [
    { name: 'Paid', value: paidInvoices, color: '#10B981' },
    { name: 'Unpaid', value: unpaidInvoices, color: '#F59E0B' },
    { name: 'Overdue', value: overdueInvoices, color: '#EF4444' },
  ];

  // Enhanced tooltip for cash flow chart
  const CashFlowTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium text-gray-700 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value || 0)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Get recent invoices
  const recentInvoices = [...(invoices || [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  
  // Get pending invoices (sent or overdue)
  const pendingInvoices = [...(invoices || [])]
    .filter(invoice => invoice.status === 'sent' || invoice.status === 'overdue')
    .slice(0, 5);

  // Calculate average invoice value
  const avgInvoiceValue = invoices && invoices.length > 0 
    ? invoices.reduce((sum, invoice) => sum + invoice.total, 0) / invoices.length
    : 0;

  // Calculate YTD (Year to Date) revenue
  const ytdRevenue = invoices
    ? invoices
        .filter(invoice => 
          invoice.status === 'paid' && 
          new Date(invoice.date).getFullYear() === currentYear
        )
        .reduce((sum, invoice) => sum + invoice.total, 0)
    : 0;
  
  // Calculate collection efficiency (paid invoices value / total invoices value)
  const totalInvoiceValue = invoices
    ? invoices.reduce((sum, invoice) => sum + invoice.total, 0)
    : 0;
  
  const paidInvoiceValue = invoices
    ? invoices
        .filter(invoice => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + invoice.total, 0)
    : 0;
  
  const collectionEfficiency = totalInvoiceValue > 0 
    ? Math.round((paidInvoiceValue / totalInvoiceValue) * 100)
    : 0;

  // Format tooltip values
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-medium text-gray-700">{label}</p>
          <p className="text-emerald-600">{formatCurrency(payload[0].value || 0)}</p>
        </div>
      );
    }
    return null;
  };
  
  // --- New Analytics Widgets ---
  // 1. Status breakdown
  const statusBreakdown = [
    { label: 'Draft', value: invoices.filter(i => i.status === 'draft').length, color: 'bg-gray-200 text-gray-800' },
    { label: 'Sent', value: invoices.filter(i => i.status === 'sent').length, color: 'bg-blue-100 text-blue-800' },
    { label: 'Paid', value: invoices.filter(i => i.status === 'paid').length, color: 'bg-green-100 text-green-800' },
    { label: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length, color: 'bg-red-100 text-red-800' },
  ];

  // 2. Average days to payment (for paid invoices)
  // If no paid invoices or missing dates, show N/A
  const paidWithDates = invoices.filter(i => i.status === 'paid' && i.date && i.updatedAt);
  const avgDaysToPayment = paidWithDates.length > 0
    ? Math.round(
        paidWithDates.reduce((sum, i) => {
          const paidDate = new Date(i.updatedAt).getTime();
          const issueDate = new Date(i.date).getTime();
          if (isNaN(paidDate) || isNaN(issueDate)) return sum;
          return sum + ((paidDate - issueDate) / (1000 * 60 * 60 * 24));
        }, 0) / paidWithDates.length
      )
    : null;

  // 3. Top 5 customers by total paid amount
  const customerPaidMap: Record<string, number> = {};
  invoices.forEach(i => {
    if (i.status === 'paid') {
      const key = i.customer?.name || i.customerId;
      customerPaidMap[key] = (customerPaidMap[key] || 0) + Number(i.total);
    }
  });
  const topCustomers = Object.entries(customerPaidMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // 4. Most overdue invoices (top 5 by overdue days)
  const now = new Date();
  const mostOverdueInvoices = invoices
    .filter(i => i.status === 'overdue' && i.dueDate)
    .map(i => {
      const dueTime = Number(new Date(i.dueDate).getTime());
      const nowTime = Number(now.getTime());
      let overdueDays: number = 0;
      if (Number.isFinite(dueTime) && Number.isFinite(nowTime)) {
        const diff = (nowTime - dueTime) / (1000 * 60 * 60 * 24);
        overdueDays = Number.isFinite(diff) ? Math.trunc(Math.max(0, diff)) : 0;
      }
      return { ...i, overdueDays };
    })
    .sort((a, b) => b.overdueDays - a.overdueDays)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {isMobile ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>

          {/* Mobile Balance Overview */}
          <div className="space-y-4">
            <MobileBalanceCard
              title="Net Income"
              amount={netIncome}
              subtitle={`Revenue: ${formatCurrency(totalEarnings)} | Expenses: ${formatCurrency(totalExpenses)}`}
              variant={netIncome >= 0 ? 'success' : 'danger'}
              icon={<DollarSign className="h-5 w-5" />}
              trend={{
                value: profitMargin,
                isPositive: profitMargin > 0
              }}
            />
            
            <div className="grid grid-cols-2 gap-3">
              <Card className="gradient-overlay-blue mobile-card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Profit Margin
                    </h3>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className={`text-2xl font-bold ${getHealthColor(profitMargin)}`}>
                    {profitMargin.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {profitMargin >= 10 ? 'Healthy' : profitMargin >= 5 ? 'Fair' : 'Needs Attention'}
                  </p>
                </CardContent>
              </Card>
              
              <MobileBalanceCard
                title="Monthly Burn"
                amount={burnRate}
                subtitle="Current month"
                variant="warning"
                icon={<CreditCard className="h-4 w-4" />}
              />
            </div>
          </div>

          {/* Mobile Quick Actions */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
            <MobileQuickActions layout="smart" />
          </div>

          {/* Mobile Charts */}
          <MobileChartCard
            charts={[
              {
                id: 'cash-flow',
                title: 'Cash Flow',
                description: 'Monthly revenue vs expenses',
                content: (
                  <div className="h-[280px]">
                    {cashFlowData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={cashFlowData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip content={<CashFlowTooltip />} />
                          <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                          <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                          <Line dataKey="netIncome" stroke="#3B82F6" strokeWidth={3} name="Net Income" type="monotone" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No financial data available</p>
                      </div>
                    )}
                  </div>
                )
              },
              {
                id: 'expenses',
                title: 'Expense Categories',
                description: 'Top spending categories',
                content: (
                  <div className="h-[280px]">
                    {expenseCategoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseCategoryData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="amount"
                            nameKey="name"
                            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {expenseCategoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No expense data available</p>
                      </div>
                    )}
                  </div>
                )
              },
              {
                id: 'invoice-status',
                title: 'Invoice Status',
                description: 'Current invoice distribution',
                content: (
                  <div className="h-[280px]">
                    {totalStatusInvoices ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={invoiceStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {invoiceStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No invoice data available</p>
                      </div>
                    )}
                  </div>
                )
              }
            ]}
          />

          {/* Mobile Recent Activity */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            
            {recentInvoices.length > 0 && (
              <Card className="mobile-card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Recent Invoices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentInvoices.slice(0, 3).map(invoice => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground truncate">{invoice.customer?.name || invoice.customerId}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="font-medium text-sm">{formatCurrency(invoice.total)}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'sent' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/invoices">View All Invoices</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center mt-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button className="bg-invoice-teal hover:bg-invoice-teal/90" asChild>
            <Link to="/invoices/new">Create Invoice</Link>
          </Button>
        </div>
      )}
      
      {/* Executive Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {formatCurrency(netIncome)}
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(netIncome)}
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenue: {formatCurrency(totalEarnings)} | Expenses: {formatCurrency(totalExpenses)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${getHealthColor(profitMargin)}`}>
                {profitMargin.toFixed(1)}%
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(profitMargin - 10)}
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {profitMargin >= 10 ? 'Healthy' : profitMargin >= 5 ? 'Fair' : 'Needs Attention'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Burn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-amber-600">
                {formatCurrency(burnRate)}
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current month expenses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Billable Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(billableExpenses)}
              </div>
              <div className="flex items-center gap-1">
                {billableExpenses > 0 && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {billableExpenses > 0 ? 'Ready to invoice' : 'All caught up'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Financial Health Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cash Flow Overview</CardTitle>
            <CardDescription>Monthly revenue vs expenses comparison</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="h-[350px]">
              {cashFlowData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={cashFlowData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip content={<CashFlowTooltip />} />
                    <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                    <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                    <Line dataKey="netIncome" stroke="#3B82F6" strokeWidth={3} name="Net Income" type="monotone" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No financial data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Breakdown</CardTitle>
            <CardDescription>Revenue vs expenses split</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {(totalEarnings > 0 || totalExpenses > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={financialOverviewData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {financialOverviewData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No financial data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Intelligence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Expense Categories</CardTitle>
            <CardDescription>Spending breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {expenseCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      nameKey="name"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {expenseCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No expense data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent High-Value Expenses</CardTitle>
            <CardDescription>Latest significant expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {recentHighExpenses.length > 0 ? (
              <div className="space-y-3">
                {recentHighExpenses.map(expense => (
                  <div key={expense.id} className="flex items-center justify-between p-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {expense.category?.name || 'Uncategorized'} • {new Date(expense.expenseDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="font-semibold text-red-600">{formatCurrency(expense.amount)}</p>
                      {expense.isBillable && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          Billable
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-3" asChild>
                  <Link to="/expenses">View All Expenses</Link>
                </Button>
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                <p>No recent high-value expenses</p>
                <Button className="mt-3" asChild>
                  <Link to="/expenses">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Invoice Status and Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
            <CardDescription>Current invoice distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              {totalStatusInvoices ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={invoiceStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {invoiceStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No invoice data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Latest created invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {recentInvoices.length > 0 ? (
              <div className="space-y-3 max-h-[240px] overflow-y-auto">
                {recentInvoices.map(invoice => (
                  <div key={invoice.id} className="flex items-center justify-between p-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground truncate">{invoice.customer?.name || invoice.customerId}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="font-medium text-sm">{formatCurrency(invoice.total)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'sent' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-2" asChild>
                  <Link to="/invoices">View All Invoices</Link>
                </Button>
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                <p>No recent invoices found</p>
                <Button className="mt-3" asChild>
                  <Link to="/invoices/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Invoice
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
            <CardDescription>Invoices awaiting payment</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingInvoices.length > 0 ? (
              <div className="space-y-3 max-h-[240px] overflow-y-auto">
                {pendingInvoices.map(invoice => (
                  <div key={invoice.id} className="flex items-center justify-between p-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="font-medium text-sm">{formatCurrency(invoice.total)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {invoice.status === 'overdue' ? 'Overdue' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-2" asChild>
                  <Link to="/invoices?filter=pending">View All Pending</Link>
                </Button>
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                <p>No pending invoices</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Fast access to common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-16 flex-col" asChild>
              <Link to="/invoices/new">
                <Plus className="h-5 w-5 mb-1" />
                New Invoice
              </Link>
            </Button>
            <Button variant="outline" className="h-16 flex-col" asChild>
              <Link to="/expenses">
                <Receipt className="h-5 w-5 mb-1" />
                Add Expense
              </Link>
            </Button>
            <Button variant="outline" className="h-16 flex-col" asChild>
              <Link to="/customers">
                <Users className="h-5 w-5 mb-1" />
                Manage Customers
              </Link>
            </Button>
            <Button variant="outline" className="h-16 flex-col" asChild>
              <Link to="/reports">
                <Calendar className="h-5 w-5 mb-1" />
                View Reports
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Business Intelligence Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Customer Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Customer Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Customers:</span>
                <span className="font-semibold">{totalCustomers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Avg. Invoice Value:</span>
                <span className="font-semibold">{formatCurrency(avgInvoiceValue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Collection Rate:</span>
                <span className="font-semibold">{collectionEfficiency}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payment Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Avg. Days to Payment:</span>
                <span className="font-semibold">
                  {avgDaysToPayment !== null ? `${avgDaysToPayment} days` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Overdue Amount:</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Customer */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length > 0 ? (
              <div className="space-y-1">
                <p className="font-semibold truncate" title={topCustomers[0][0]}>
                  {topCustomers[0][0]}
                </p>
                <p className="text-lg font-bold text-emerald-600">
                  {formatCurrency(typeof topCustomers[0][1] === 'number' ? topCustomers[0][1] : 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total paid</p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p className="text-sm">No paid invoices yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Health Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Financial Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getHealthColor(profitMargin)}`}>
                {profitMargin >= 15 ? 'A' : profitMargin >= 10 ? 'B' : profitMargin >= 5 ? 'C' : 'D'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {profitMargin >= 15 ? 'Excellent' : 
                 profitMargin >= 10 ? 'Good' : 
                 profitMargin >= 5 ? 'Fair' : 'Needs Improvement'}
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Profit Margin:</span>
                  <span className={getHealthColor(profitMargin)}>{profitMargin.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Expense Ratio:</span>
                  <span>{expenseRatio.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
