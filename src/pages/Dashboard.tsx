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
  
  // Calculate simple stats from invoices and customers
  const isLoadingStats = isLoadingInvoices || isLoadingCustomers;
  const dashboardStats = {
    totalInvoices: invoices.length,
    totalCustomers: customers.length,
    // Add any other stats you need calculated from the available data
  };
  
  const isMobile = useIsMobile();
  
  if (isLoadingStats) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  }

  // Calculate month names for chart
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = (dashboardStats?.revenueByMonth || []).map(item => ({
    name: monthNames[item.month - 1],
    revenue: item.revenue
  }));

  // Calculate invoice status distribution for pie chart
  const totalInvoices = dashboardStats?.paidInvoices + dashboardStats?.unpaidInvoices + dashboardStats?.overdueInvoices;
  const invoiceStatusData = [
    { name: 'Paid', value: dashboardStats?.paidInvoices || 0, color: '#10B981' },
    { name: 'Unpaid', value: dashboardStats?.unpaidInvoices || 0, color: '#F59E0B' },
    { name: 'Overdue', value: dashboardStats?.overdueInvoices || 0, color: '#EF4444' },
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
  const currentYear = new Date().getFullYear();
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
                {formatCurrency(dashboardStats?.totalEarnings || 0)}
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
                {dashboardStats?.customerCount || customers?.length || 0}
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
              {totalInvoices ? (
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
    </div>
  );
};

export default Dashboard;
