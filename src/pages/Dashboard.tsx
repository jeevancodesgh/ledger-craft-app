import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/utils/invoiceUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar, DollarSign, Users, TrendingUp, TrendingDown, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const Dashboard = () => {
  const { invoices, isLoadingInvoices, customers, isLoadingCustomers } = useAppContext();
  
  const isLoadingStats = isLoadingInvoices || isLoadingCustomers;
  const isMobile = useIsMobile();
  
  // Calculate stats from invoices
  const totalInvoices = invoices.length;
  const totalCustomers = customers.length;
  const customerCount = customers.length;
  const totalEarnings = invoices.reduce((sum, invoice) => sum + invoice.total, 0);

  // Calculate revenue by month for current year
  const currentYear = new Date().getFullYear();
  const revenueByMonth = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, revenue: 0 }));
  invoices.forEach(invoice => {
    const date = new Date(invoice.date);
    if (date.getFullYear() === currentYear && invoice.status === 'paid') {
      revenueByMonth[date.getMonth()].revenue += invoice.total;
    }
  });

  // Calculate invoice status counts
  let paidInvoices = 0, unpaidInvoices = 0, overdueInvoices = 0;
  invoices.forEach(invoice => {
    if (invoice.status === 'paid') paidInvoices++;
    else if (invoice.status === 'sent') unpaidInvoices++;
    else if (invoice.status === 'overdue') overdueInvoices++;
  });

  if (isLoadingStats) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  }

  // Calculate month names for chart
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = revenueByMonth.map(item => ({
    name: monthNames[item.month - 1],
    revenue: item.revenue
  }));

  // Calculate invoice status distribution for pie chart
  const totalStatusInvoices = paidInvoices + unpaidInvoices + overdueInvoices;
  const invoiceStatusData = [
    { name: 'Paid', value: paidInvoices, color: '#10B981' },
    { name: 'Unpaid', value: unpaidInvoices, color: '#F59E0B' },
    { name: 'Overdue', value: overdueInvoices, color: '#EF4444' },
  ];

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
  const customerPaidMap = {};
  invoices.forEach(i => {
    if (i.status === 'paid') {
      const key = i.customer?.name || i.customerId;
      customerPaidMap[key] = (customerPaidMap[key] || 0) + i.total;
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
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button className="w-full bg-invoice-teal hover:bg-invoice-teal/90 py-6 text-base flex items-center justify-center gap-2" asChild>
            <Link to="/invoices/new">
              <Plus size={20} />
              Create Invoice
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button className="bg-invoice-teal hover:bg-invoice-teal/90" asChild>
            <Link to="/invoices/new">Create Invoice</Link>
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {formatCurrency(totalEarnings)}
              </div>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">YTD Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(ytdRevenue)}
              </div>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Collection Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-500">
                {collectionEfficiency}%
              </div>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {customerCount}
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue for the current year</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="h-[300px]">
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No revenue data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
            <CardDescription>Distribution of invoice statuses</CardDescription>
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
                    <Legend />
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
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Latest created invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {recentInvoices.length > 0 ? (
              <div className="space-y-4">
                {recentInvoices.map(invoice => (
                  <div key={invoice.id} className="flex items-center justify-between p-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">{invoice.customer?.name || invoice.customerId}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(invoice.total)}</p>
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
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                No recent invoices found
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
              <div className="space-y-4">
                {pendingInvoices.map(invoice => (
                  <div key={invoice.id} className="flex items-center justify-between p-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(invoice.total)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {invoice.status === 'overdue' ? 'Overdue' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                No pending invoices
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* --- New Analytics Row --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Invoice Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {statusBreakdown.map(s => (
                <span key={s.label} className={`px-3 py-1 rounded-full text-xs font-semibold ${s.color}`}>
                  {s.label}: {s.value}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Average Days to Payment */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Days to Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgDaysToPayment !== null ? `${avgDaysToPayment} days` : <span className="text-muted-foreground">N/A</span>}
            </div>
          </CardContent>
        </Card>
        {/* Top Customers by Paid Amount */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Customers (Paid)</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length > 0 ? (
              <ul className="space-y-1">
                {topCustomers.map(([name, amt]) => (
                  <li key={name} className="flex justify-between">
                    <span className="truncate max-w-[120px]" title={name}>{name}</span>
                    <span className="font-mono">{formatCurrency(typeof amt === 'number' ? amt : 0)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-muted-foreground">No paid invoices</span>
            )}
          </CardContent>
        </Card>
        {/* Most Overdue Invoices */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Most Overdue Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {mostOverdueInvoices.length > 0 ? (
              <ul className="space-y-1">
                {mostOverdueInvoices.map(i => (
                  <li key={i.id} className="flex justify-between">
                    <span className="truncate max-w-[100px]" title={i.invoiceNumber}>{i.invoiceNumber}</span>
                    <span className="text-red-700 font-semibold">{i.overdueDays} days</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-muted-foreground">No overdue invoices</span>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
