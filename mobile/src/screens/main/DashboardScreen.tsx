import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  StyleSheet,
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
import { QuickAction } from '@/components/ui/QuickAction';
import { NativeHeaderButton } from '@/components/ui/NativeHeaderButton';
import { getStatusColor, getStatusLabel } from '@/utils/statusUtils';
import type { HomeStackParamList, MainTabParamList } from '@/navigation/types';
import { palette, radius, space } from '@/theme/tokens';

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

  const openExpense = useCallback(() => {
    navigation.navigate('Expenses', { screen: 'ExpenseCreate' });
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <NativeHeaderButton label="Invoice" onPress={openCreate} primary />
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

  const firstName = user?.user_metadata?.full_name?.split(' ')[0];
  const greetingLine =
    firstName && firstName.length > 1 ? `${greeting}, ${firstName}` : greeting;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.accent} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.greeting}>{greetingLine}</Text>

          <BalanceCard
            totalBalance={pendingAmount > 0 ? pendingAmount : totalEarnings}
            availableBalance={totalEarnings}
            pendingBalance={pendingAmount}
            label={pendingAmount > 0 ? 'You are owed' : 'Paid this period'}
          />

          <View style={styles.actions}>
            <QuickAction
              label="Invoice"
              primary
              onPress={openCreate}
              icon={<Feather name="plus" size={22} color={palette.surface} />}
            />
            <QuickAction
              label="Expense"
              onPress={openExpense}
              icon={<Feather name="credit-card" size={22} color={palette.accent} />}
            />
            <QuickAction
              label="Invoices"
              onPress={() => navigation.navigate('Invoices', { screen: 'InvoiceList' })}
              icon={<Feather name="file-text" size={22} color={palette.accent} />}
            />
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Needs action</Text>
            <Pressable
              onPress={() => navigation.navigate('Invoices', { screen: 'InvoiceList' })}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="See all invoices"
            >
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>

          {workItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <EmptyState
                title="You're clear"
                description="Create an invoice when you're ready to get paid."
                actionLabel="Create invoice"
                onAction={openCreate}
              />
            </View>
          ) : (
            <View style={styles.group}>
              {workItems.map((invoice, index) => (
                <Pressable
                  key={invoice.id}
                  onPress={() =>
                    navigation.navigate('Invoices', {
                      screen: 'InvoiceDetail',
                      params: { invoiceId: invoice.id },
                    })
                  }
                  style={({ pressed }) => [
                    styles.row,
                    index !== workItems.length - 1 && styles.rowBorder,
                    pressed && styles.rowPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Invoice ${invoice.invoiceNumber}`}
                >
                  <View
                    style={[styles.statusDot, { backgroundColor: getStatusColor(invoice.status) }]}
                  />
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{invoice.invoiceNumber}</Text>
                    <Text style={styles.rowMeta}>
                      {invoice.customer?.name || 'No customer'} · {formatDate(invoice.date)}
                    </Text>
                  </View>
                  <View style={styles.rowAmount}>
                    <Text style={styles.amount}>
                      {formatMoney(invoice.total, invoice.currency || 'NZD')}
                    </Text>
                    <Text style={[styles.status, { color: getStatusColor(invoice.status) }]}>
                      {getStatusLabel(invoice.status)}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={palette.textTertiary} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  center: {
    flex: 1,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: space.screen,
    paddingTop: 8,
    paddingBottom: 40,
  },
  greeting: {
    fontSize: 15,
    color: palette.textSecondary,
    marginBottom: space.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 28,
    marginBottom: 28,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.textSecondary,
    letterSpacing: -0.08,
    textTransform: 'uppercase',
  },
  seeAll: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.accent,
  },
  emptyCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.group,
  },
  group: {
    backgroundColor: palette.surface,
    borderRadius: radius.group,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.separator,
  },
  rowPressed: {
    backgroundColor: palette.fillMuted,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: palette.text,
  },
  rowMeta: {
    fontSize: 13,
    color: palette.textSecondary,
    marginTop: 2,
  },
  rowAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 17,
    fontWeight: '600',
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
