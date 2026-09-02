import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/store';
import { invoiceService } from '@/services/invoiceService';
import type { Invoice } from '@/types/invoice';
import { EmptyState } from '@/components/ui/EmptyState';

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await invoiceService.fetchInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Calculate stats
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const totalEarnings = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const pendingInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);
  
  const totalExpenses = 0;
  const netIncome = totalEarnings - totalExpenses;
  const profitMargin = totalEarnings > 0 ? ((netIncome / totalEarnings) * 100) : 0;

  // Recent invoices
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <View className="flex-1 bg-revolut-blue-900 items-center justify-center">
        <ActivityIndicator size="large" color="#5B72EE" />
        <Text className="text-gray-600 mt-4">Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Gradient Background */}
        <View className="bg-revolut-blue-900 px-6 pt-12 pb-8">
          <Text className="text-white text-3xl font-bold mb-2">
            {getGreeting()}
          </Text>
          <Text className="text-white/70 text-sm">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* Balance Card */}
        <View className="px-6 -mt-6">
          <View className="bg-revolut-blue-700 rounded-3xl p-6 shadow-lg">
            <Text className="text-white/70 text-sm font-medium mb-2">
              Total Balance
            </Text>
            <View className="flex-row items-baseline mb-4">
              <Text className="text-white text-5xl font-bold">
                {formatCurrency(netIncome)}
              </Text>
              {profitMargin > 0 && (
                <View className="ml-3 px-3 py-1 rounded-full bg-emerald-500/20">
                  <Text className="text-emerald-100 text-sm font-semibold">
                    +{profitMargin.toFixed(1)}%
                  </Text>
                </View>
              )}
            </View>
            
            <View className="flex-row gap-6 pt-4 border-t border-white/10">
              <View className="flex-row items-center gap-2">
                <View className="h-2 w-2 rounded-full bg-emerald-400" />
                <View>
                  <Text className="text-white/50 text-xs">Available</Text>
                  <Text className="text-white text-sm font-semibold">
                    {formatCurrency(totalEarnings)}
                  </Text>
                </View>
              </View>
              {pendingAmount > 0 && (
                <View className="flex-row items-center gap-2">
                  <View className="h-2 w-2 rounded-full bg-amber-400" />
                  <View>
                    <Text className="text-white/50 text-xs">Pending</Text>
                    <Text className="text-white text-sm font-semibold">
                      {formatCurrency(pendingAmount)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View className="px-6 py-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Financial Overview
          </Text>
          
          <View className="gap-4">
            {/* Row 1 */}
            <View className="flex-row gap-4">
              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                <View className="bg-emerald-100 p-3 rounded-xl w-12 h-12 mb-3" />
                <Text className="text-gray-500 text-xs font-medium uppercase mb-1">
                  Net Income
                </Text>
                <Text className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(netIncome)}
                </Text>
              </View>
              
              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                <View className="bg-blue-100 p-3 rounded-xl w-12 h-12 mb-3" />
                <Text className="text-gray-500 text-xs font-medium uppercase mb-1">
                  Profit Margin
                </Text>
                <Text className="text-2xl font-bold text-blue-600">
                  {profitMargin.toFixed(1)}%
                </Text>
              </View>
            </View>

            {/* Row 2 */}
            <View className="flex-row gap-4">
              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                <View className="bg-amber-100 p-3 rounded-xl w-12 h-12 mb-3" />
                <Text className="text-gray-500 text-xs font-medium uppercase mb-1">
                  Total Invoices
                </Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {invoices.length}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  {paidInvoices.length} paid
                </Text>
              </View>
              
              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                <View className="bg-red-100 p-3 rounded-xl w-12 h-12 mb-3" />
                <Text className="text-gray-500 text-xs font-medium uppercase mb-1">
                  Pending
                </Text>
                <Text className="text-2xl font-bold text-red-600">
                  {pendingInvoices.length}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  {formatCurrency(pendingAmount)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-6 pb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-900">
              Recent Invoices
            </Text>
          </View>

          <View className="bg-white rounded-2xl p-3">
            {recentInvoices.length > 0 ? (
              recentInvoices.map((invoice, index) => (
                <View 
                  key={invoice.id}
                  className={`flex-row items-center gap-3 p-3 ${
                    index !== recentInvoices.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <View className="bg-blue-100 p-3 rounded-full">
                    <View className="w-5 h-5 bg-blue-600 rounded" />
                  </View>

                  <View className="flex-1">
                    <Text className="font-semibold text-sm text-gray-900 mb-0.5">
                      {invoice.invoiceNumber}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {invoice.customer?.name || 'Customer'} • {formatDate(invoice.date)}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="font-bold text-sm text-emerald-600">
                      {formatCurrency(invoice.total)}
                    </Text>
                    <View className={`px-2 py-1 rounded-full mt-1 ${
                      invoice.status === 'paid' ? 'bg-emerald-100' :
                      invoice.status === 'sent' ? 'bg-amber-100' :
                      'bg-red-100'
                    }`}>
                      <Text className={`text-xs font-medium ${
                        invoice.status === 'paid' ? 'text-emerald-800' :
                        invoice.status === 'sent' ? 'text-amber-800' :
                        'text-red-800'
                      }`}>
                        {invoice.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <EmptyState
                title="Create your first invoice"
                description="Send it, get paid, GST-ready."
                actionLabel="Create invoice"
                onAction={() =>
                  navigation.navigate(
                    'Invoices' as never,
                    { screen: 'InvoiceCreate' } as never
                  )
                }
              />
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <View className="px-6 pb-12">
          <View className="bg-white rounded-2xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Quick Stats
            </Text>
            <View className="gap-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600 text-sm">Total Revenue</Text>
                <Text className="font-bold text-gray-900">{formatCurrency(totalEarnings)}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600 text-sm">Paid Invoices</Text>
                <Text className="font-bold text-emerald-600">{paidInvoices.length}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600 text-sm">Pending Invoices</Text>
                <Text className="font-bold text-amber-600">{pendingInvoices.length}</Text>
              </View>
              <View className="h-px bg-gray-200 my-1" />
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600 text-sm font-semibold">Net Income</Text>
                <Text className="font-bold text-lg text-emerald-600">{formatCurrency(netIncome)}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
