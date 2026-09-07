import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NativeBottomTabNavigationProp } from '@bottom-tabs/react-navigation';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/store';
import { invoiceService } from '@/services/invoiceService';
import type { Invoice } from '@/types/invoice';
import { EmptyState } from '@/components/ui/EmptyState';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { NativeHeaderButton } from '@/components/ui/NativeHeaderButton';
import { getStatusColor, getStatusLabel } from '@/utils/statusUtils';
import type { HomeStackParamList, MainTabParamList } from '@/navigation/types';

type DashboardNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'DashboardHome'>,
  NativeBottomTabNavigationProp<MainTabParamList>
>;

function formatMoney(amount: number, currency = 'NZD') {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
  });
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<DashboardNavigation>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const openCreate = useCallback(() => {
    navigation.navigate('Invoices', { screen: 'InvoiceCreate' });
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <NativeHeaderButton label="New" onPress={openCreate} primary />
      ),
    });
  }, [navigation, openCreate]);

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

  const paidInvoices = invoices.filter((i) => i.status === 'paid');
  const totalEarnings = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const pendingInvoices = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue');
  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);

  const workItems = [...invoices]
    .filter((inv) => inv.status === 'overdue' || inv.status === 'draft' || inv.status === 'sent')
    .sort((a, b) => {
      const rank = { overdue: 0, draft: 1, sent: 2 } as Record<string, number>;
      return (rank[a.status] ?? 9) - (rank[b.status] ?? 9);
    })
    .slice(0, 6);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#5B72EE" />
        <Text className="text-slate-500 mt-4">Loading home</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B72EE" />
        }
      >
        <View className="px-5 pt-2 pb-8">
          <Text className="text-slate-500 text-base mb-4">
            {greeting}
            {user?.email ? `. ${user.email.split('@')[0]}` : ''}
          </Text>

          <BalanceCard
            totalBalance={totalEarnings}
            availableBalance={totalEarnings}
            pendingBalance={pendingAmount}
          />

          <View className="flex-row items-center justify-between mb-3 mt-2">
            <Text className="text-lg font-semibold text-slate-800">Needs action</Text>
            <Pressable
              onPress={() =>
                navigation.navigate('Invoices', { screen: 'InvoiceList' })
              }
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="See all invoices"
            >
              <Text className="text-[#5B72EE] font-semibold">See all</Text>
            </Pressable>
          </View>

          {workItems.length === 0 ? (
            <View className="bg-white rounded-2xl">
              <EmptyState
                title="You're clear"
                description="Create an invoice when you're ready to get paid."
                actionLabel="Create invoice"
                onAction={openCreate}
              />
            </View>
          ) : (
            <View className="bg-white rounded-2xl overflow-hidden">
              {workItems.map((invoice, index) => (
                <Pressable
                  key={invoice.id}
                  onPress={() =>
                    navigation.navigate('Invoices', {
                      screen: 'InvoiceDetail',
                      params: { invoiceId: invoice.id },
                    })
                  }
                  className={`flex-row items-center px-4 py-3.5 ${
                    index !== workItems.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel={`Invoice ${invoice.invoiceNumber}`}
                >
                  <View
                    className="w-2.5 h-2.5 rounded-full mr-3"
                    style={{ backgroundColor: getStatusColor(invoice.status) }}
                  />
                  <View className="flex-1">
                    <Text className="font-semibold text-slate-800">
                      {invoice.invoiceNumber}
                    </Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      {invoice.customer?.name || 'No customer'} · {formatDate(invoice.date)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="font-bold text-slate-800">
                      {formatMoney(invoice.total, invoice.currency || 'NZD')}
                    </Text>
                    <Text
                      className="text-xs font-semibold mt-0.5"
                      style={{ color: getStatusColor(invoice.status) }}
                    >
                      {getStatusLabel(invoice.status)}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="#94A3B8" style={{ marginLeft: 6 }} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
