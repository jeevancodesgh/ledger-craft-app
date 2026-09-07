import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { InvoiceStackParamList } from '@/navigation/types';
import { NativeHeaderButton } from '@/components/ui/NativeHeaderButton';
import { invoiceService } from '@/services/invoiceService';
import { paymentService } from '@/services/paymentService';
import type { Invoice } from '@/types/invoice';
import type { CreatePaymentRequest } from '@/types/payment';
import { useFocusEffect } from '@react-navigation/native';
import SwipeableInvoiceCard from '@/components/invoice/SwipeableInvoiceCard';
import PaymentCaptureModal from '@/components/invoice/PaymentCaptureModal';
import { AnimatedFilterButton } from '@/components/ui/AnimatedFilterButton';
import { EmptyState } from '@/components/ui/EmptyState';

type InvoiceListNavigationProp = NativeStackNavigationProp<InvoiceStackParamList, 'InvoiceList'>;

export default function InvoiceListScreen() {
  const navigation = useNavigation<InvoiceListNavigationProp>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);

  const loadInvoices = async () => {
    try {
      const data = await invoiceService.fetchInvoices();
      setInvoices(data);
      applyFilters(data, searchQuery, filter);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadInvoices();
  };

  const applyFilters = (data: Invoice[], search: string, statusFilter: typeof filter) => {
    let filtered = data;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    // Apply search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(lowerSearch) ||
          inv.customer?.name.toLowerCase().includes(lowerSearch) ||
          inv.customer?.email.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredInvoices(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    applyFilters(invoices, text, filter);
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    applyFilters(invoices, searchQuery, newFilter);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        placeholder: 'Search invoices',
        hideWhenScrolling: true,
        onChangeText: (event) => handleSearch(event.nativeEvent.text),
      },
      headerRight: () => (
        <NativeHeaderButton
          label="New"
          primary
          onPress={() => navigation.navigate('InvoiceCreate')}
        />
      ),
    });
  }, [navigation, invoices, filter]);

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    // If changing to "paid", open payment capture modal
    if (newStatus === 'paid') {
      const invoice = invoices.find((i) => i.id === invoiceId);
      if (invoice) {
        setSelectedInvoiceForPayment(invoice);
        setPaymentModalVisible(true);
      }
      return;
    }

    // For other statuses, update directly
    setUpdatingStatus((prev) => ({ ...prev, [invoiceId]: true }));

    try {
      await invoiceService.updateInvoiceStatus(invoiceId, newStatus as any);
      
      // Refresh the list
      await loadInvoices();
      
      Alert.alert('Success', `Invoice status changed to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update invoice status. Please try again.');
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [invoiceId]: false }));
    }
  };

  const handlePaymentSubmit = async (paymentData: CreatePaymentRequest) => {
    try {
      await paymentService.createPayment(paymentData);
      
      // Refresh the invoice list
      await loadInvoices();
      
      // Close modal
      setPaymentModalVisible(false);
      setSelectedInvoiceForPayment(null);
      
      Alert.alert('Success', 'Payment recorded successfully');
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error; // Let the modal handle the error
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'NZD' ? '$' : currency;
    return `${symbol}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };


  const renderInvoiceCard = ({ item }: { item: Invoice }) => (
    <SwipeableInvoiceCard
      invoice={item}
      onPress={() => {
        // @ts-ignore - Navigation types will be properly typed
        navigation.navigate('InvoiceDetail', { invoiceId: item.id });
      }}
      onStatusChange={handleStatusChange}
      disabled={updatingStatus[item.id]}
      formatCurrency={formatCurrency}
      formatDate={formatDate}
    />
  );

  const renderFilterButtons = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
    >
      {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map((filterOption) => (
        <AnimatedFilterButton
          key={filterOption}
          label={filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          active={filter === filterOption}
          onPress={() => handleFilterChange(filterOption)}
          variant="light"
        />
      ))}
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading invoices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'android' && (
        <View style={styles.androidSearch}>
          <Feather name="search" size={18} color="#64748B" />
          <TextInput
            style={styles.androidSearchInput}
            placeholder="Search invoices"
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#94A3B8"
          />
        </View>
      )}
      {renderFilterButtons()}
      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        renderItem={renderInvoiceCard}
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B72EE" />
        }
        ListEmptyComponent={
          invoices.length === 0 ? (
            <EmptyState
              title="Create your first invoice"
              description="Send it, get paid, GST-ready."
              actionLabel="Create invoice"
              onAction={() => navigation.navigate('InvoiceCreate')}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No invoices match your filters</Text>
              <Text style={styles.emptySubtext}>Try a different search or status</Text>
            </View>
          )
        }
      />

      {/* Payment Capture Modal */}
      {selectedInvoiceForPayment && (
        <PaymentCaptureModal
          visible={paymentModalVisible}
          invoice={selectedInvoiceForPayment}
          onSubmit={handlePaymentSubmit}
          onClose={() => {
            setPaymentModalVisible(false);
            setSelectedInvoiceForPayment(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  androidSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  androidSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  listContent: {
    padding: 16,
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  customerName: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
  },
  amountContainer: {
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  datesContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  dateItem: {
    flex: 1,
  },
  dateDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
});
