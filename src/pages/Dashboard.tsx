import React, { useState } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { formatCurrency } from '@/utils/invoiceUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { 
  Calendar, DollarSign, Users, Plus, Receipt, 
  FileText, Settings, TrendingUp, Target, CreditCard,
  AlertTriangle, ArrowUpRight, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { RevolutBalanceCard } from '@/components/dashboard/RevolutBalanceCard';
import { RevolutQuickActionButton } from '@/components/dashboard/RevolutQuickActionButton';
import { RevolutTransactionItem } from '@/components/dashboard/RevolutTransactionItem';
import { RevolutStatCard } from '@/components/dashboard/RevolutStatCard';
import { RevolutChartCard, RevolutChartTooltip, revolutChartConfig, RevolutChartGradients } from '@/components/dashboard/RevolutChartCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const navigate = useNavigate();
  const { 
    invoices, 
    isLoadingInvoices, 
    customers, 
    isLoadingCustomers, 
    expenses,
    isLoadingExpenses,
  } = useAppData();
  
  const isLoadingStats = isLoadingInvoices || isLoadingCustomers || isLoadingExpenses;
  const isMobile = useIsMobile();
  const [accountType, setAccountType] = useState<'personal' | 'business' | 'all'>('all');
  
  // Calculate invoice stats
  const totalEarnings = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const paidEarnings = paidInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

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
  const netIncome = paidEarnings - totalExpenses;
  const profitMargin = paidEarnings > 0 ? ((netIncome / paidEarnings) * 100) : 0;
  const burnRate = currentMonthExpenses;

  // Billable expenses
  const billableExpenses = expenses
    .filter(expense => expense.isBillable && expense.customerId)
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Calculate monthly data
  const currentYear = new Date().getFullYear();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({ 
    name: monthNames[i],
    revenue: 0, 
    expenses: 0,
    netIncome: 0 
  }));

  invoices.forEach(invoice => {
    const date = new Date(invoice.date);
    if (date.getFullYear() === currentYear && invoice.status === 'paid') {
      monthlyData[date.getMonth()].revenue += invoice.total;
    }
  });

  expenses.forEach(expense => {
    const date = new Date(expense.expenseDate);
    if (date.getFullYear() === currentYear) {
      monthlyData[date.getMonth()].expenses += expense.amount;
    }
  });

  monthlyData.forEach(month => {
    month.netIncome = month.revenue - month.expenses;
  });

  // Expense categories
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const categoryName = expense.category?.name || 'Uncategorized';
    acc[categoryName] = (acc[categoryName] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const expenseCategoryData = Object.entries(expensesByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const categoryColors = ['#5B72EE', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

  // Recent invoices
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Recent expenses
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
    .slice(0, 5);

  // Pending invoices
  const pendingInvoices = invoices
    .filter(invoice => invoice.status === 'sent' || invoice.status === 'overdue')
    .slice(0, 5);

  // Top customers
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

  // Get user initials for avatar
  const userInitials = 'JW'; // You can get this from auth context later

  // Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoadingStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-revolut-blue-950 via-revolut-blue-900 to-revolut-blue-800 flex items-center justify-center">
        <div className="text-white text-lg">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-revolut-blue-950 via-revolut-blue-900 to-revolut-blue-800 pb-12">
      {/* Header Section */}
      <div className="bg-transparent px-4 md:px-6 py-6 animate-fade-in">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              {getGreeting()}
            </h1>
            <p className="text-white/70 text-sm">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-white/20 cursor-pointer hover:border-white/40 transition-colors">
            <AvatarFallback className="bg-revolut-blue-600 text-white font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-6 space-y-6 max-w-7xl mx-auto">
        {/* Balance Overview Card */}
        <RevolutBalanceCard
          totalBalance={netIncome}
          availableBalance={paidEarnings}
          pendingBalance={totalEarnings - paidEarnings}
          accountType={accountType}
          onAccountTypeChange={setAccountType}
          trend={{
            value: profitMargin,
            isPositive: netIncome >= 0,
            label: `${profitMargin.toFixed(1)}% profit margin`
          }}
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-4 md:grid-cols-5 gap-3 md:gap-4 animate-slide-up">
          <RevolutQuickActionButton
            icon={Plus}
            label="New Invoice"
            variant="primary"
            onClick={() => navigate('/invoices/new')}
          />
          <RevolutQuickActionButton
            icon={Receipt}
            label="Add Expense"
            onClick={() => navigate('/expenses')}
          />
          <RevolutQuickActionButton
            icon={BarChart3}
            label="Reports"
            onClick={() => navigate('/reports')}
          />
          <RevolutQuickActionButton
            icon={Users}
            label="Customers"
            onClick={() => navigate('/customers')}
          />
          {!isMobile && (
            <RevolutQuickActionButton
              icon={Settings}
              label="Settings"
              onClick={() => navigate('/settings')}
            />
          )}
        </div>

        {/* Switch to white background for remaining content */}
        <div className="space-y-6 bg-gradient-to-b from-transparent to-background pt-6">
          {/* Financial Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            <RevolutStatCard
              icon={DollarSign}
              title="Net Income"
              value={netIncome}
              isCurrency
              variant={netIncome >= 0 ? 'success' : 'danger'}
              subtitle={`Revenue: ${formatCurrency(paidEarnings)}`}
              trend={{
                value: profitMargin
              }}
            />
            <RevolutStatCard
              icon={Target}
              title="Profit Margin"
              value={profitMargin}
              suffix="%"
              variant={profitMargin >= 10 ? 'success' : profitMargin >= 5 ? 'warning' : 'danger'}
              subtitle={profitMargin >= 10 ? 'Healthy' : profitMargin >= 5 ? 'Fair' : 'Needs Attention'}
            />
            <RevolutStatCard
              icon={CreditCard}
              title="Monthly Burn"
              value={burnRate}
              isCurrency
              variant="warning"
              subtitle="Current month expenses"
            />
            <RevolutStatCard
              icon={AlertTriangle}
              title="Billable"
              value={billableExpenses}
              isCurrency
              variant={billableExpenses > 0 ? 'info' : 'default'}
              subtitle={billableExpenses > 0 ? 'Ready to invoice' : 'All caught up'}
            />
          </div>

          {/* Recent Activity Section */}
          <Card className="animate-fade-in border-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="invoices" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                  <TabsTrigger value="invoices">Recent Invoices</TabsTrigger>
                  <TabsTrigger value="expenses">Recent Expenses</TabsTrigger>
                  <TabsTrigger value="pending">
                    Pending
                    {pendingInvoices.length > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                        {pendingInvoices.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="invoices" className="space-y-1 mt-4">
                  {recentInvoices.length > 0 ? (
                    <>
                      {recentInvoices.map(invoice => (
                        <RevolutTransactionItem
                          key={invoice.id}
                          icon={FileText}
                          title={invoice.invoiceNumber}
                          subtitle={invoice.customer?.name || invoice.customerId}
                          amount={invoice.total}
                          date={new Date(invoice.date).toLocaleDateString()}
                          status={invoice.status === 'paid' ? 'completed' : invoice.status === 'overdue' ? 'failed' : 'pending'}
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                          iconColor="text-blue-600"
                          iconBgColor="bg-blue-100"
                        />
                      ))}
                      <div className="pt-3">
                        <Link to="/invoices" className="text-sm text-revolut-blue-600 hover:text-revolut-blue-700 font-medium flex items-center gap-1">
                          View all invoices
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No recent invoices</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="expenses" className="space-y-1 mt-4">
                  {recentExpenses.length > 0 ? (
                    <>
                      {recentExpenses.map(expense => (
                        <RevolutTransactionItem
                          key={expense.id}
                          icon={Receipt}
                          title={expense.description}
                          subtitle={expense.category?.name || 'Uncategorized'}
                          amount={-expense.amount}
                          date={new Date(expense.expenseDate).toLocaleDateString()}
                          status="completed"
                          onClick={() => navigate(`/expenses`)}
                          iconColor="text-red-600"
                          iconBgColor="bg-red-100"
                        />
                      ))}
                      <div className="pt-3">
                        <Link to="/expenses" className="text-sm text-revolut-blue-600 hover:text-revolut-blue-700 font-medium flex items-center gap-1">
                          View all expenses
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No recent expenses</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pending" className="space-y-1 mt-4">
                  {pendingInvoices.length > 0 ? (
                    <>
                      {pendingInvoices.map(invoice => (
                        <RevolutTransactionItem
                          key={invoice.id}
                          icon={AlertTriangle}
                          title={invoice.invoiceNumber}
                          subtitle={`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`}
                          amount={invoice.total}
                          status={invoice.status === 'overdue' ? 'failed' : 'pending'}
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                          iconColor="text-amber-600"
                          iconBgColor="bg-amber-100"
                        />
                      ))}
                      <div className="pt-3">
                        <Link to="/invoices?filter=pending" className="text-sm text-revolut-blue-600 hover:text-revolut-blue-700 font-medium flex items-center gap-1">
                          View all pending
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No pending invoices</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevolutChartCard
              title="Cash Flow Overview"
              description="Monthly revenue vs expenses"
            >
              <div className="h-[300px] md:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyData}>
                    <RevolutChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<RevolutChartTooltip />} />
                    <Bar 
                      dataKey="revenue" 
                      fill={revolutChartConfig.colors.success} 
                      radius={[8, 8, 0, 0]}
                      name="Revenue"
                    />
                    <Bar 
                      dataKey="expenses" 
                      fill={revolutChartConfig.colors.danger} 
                      radius={[8, 8, 0, 0]}
                      name="Expenses"
                    />
                    <Line 
                      dataKey="netIncome" 
                      stroke={revolutChartConfig.colors.primary} 
                      strokeWidth={3}
                      name="Net Income"
                      type="monotone"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </RevolutChartCard>

            <RevolutChartCard
              title="Expense Breakdown"
              description="Top spending categories"
            >
              <div className="h-[300px] md:h-[350px]">
                {expenseCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No expense data available</p>
                  </div>
                )}
              </div>
            </RevolutChartCard>
          </div>

          {/* Quick Insights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Customers */}
            <Card className="animate-fade-in border-muted/50">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-revolut-blue-600" />
                  Top Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topCustomers.length > 0 ? (
                  <div className="space-y-3">
                    {topCustomers.map(([name, amount], index) => (
                      <div key={name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-revolut-blue-100 flex items-center justify-center text-sm font-semibold text-revolut-blue-700">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium truncate max-w-[150px]">{name}</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-600">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No customer data yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Financial Health */}
            <Card className="animate-fade-in border-muted/50">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-revolut-blue-600" />
                  Financial Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-3">
                  <div className={`text-5xl font-bold ${
                    profitMargin >= 15 ? 'text-emerald-600' :
                    profitMargin >= 10 ? 'text-blue-600' :
                    profitMargin >= 5 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {profitMargin >= 15 ? 'A' : profitMargin >= 10 ? 'B' : profitMargin >= 5 ? 'C' : 'D'}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {profitMargin >= 15 ? 'Excellent' : 
                     profitMargin >= 10 ? 'Good' : 
                     profitMargin >= 5 ? 'Fair' : 'Needs Improvement'}
                  </p>
                  <div className="pt-3 space-y-2 text-xs border-t">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit Margin:</span>
                      <span className="font-semibold">{profitMargin.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Net Income:</span>
                      <span className="font-semibold">{formatCurrency(netIncome)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="animate-fade-in border-muted/50">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-revolut-blue-600" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Invoices</span>
                  <span className="text-sm font-bold">{invoices.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Customers</span>
                  <span className="text-sm font-bold">{customers.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Expenses</span>
                  <span className="text-sm font-bold">{expenses.length}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-sm text-muted-foreground">Paid Invoices</span>
                  <span className="text-sm font-bold text-emerald-600">{paidInvoices.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="text-sm font-bold text-amber-600">{pendingInvoices.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
