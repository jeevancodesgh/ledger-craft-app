import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  TextInput,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTabParamList } from '@/navigation/types';
import { invoiceService } from '@/services/invoiceService';
import type { Invoice } from '@/types/invoice';
import { useFocusEffect } from '@react-navigation/native';

type InvoiceListNavigationProp = NativeStackNavigationProp<any, 'InvoiceList'>;

export default function InvoiceListScreen() {
  const navigation = useNavigation<InvoiceListNavigationProp>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#10b981'; // green
      case 'sent':
        return '#3b82f6'; // blue
      case 'draft':
        return '#6b7280'; // gray
      case 'overdue':
        return '#ef4444'; // red
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return '✓';
      case 'sent':
        return '📤';
      case 'draft':
        return '📝';
      case 'overdue':
        return '⚠️';
      default:
        return '•';
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
    <TouchableOpacity
      style={styles.invoiceCard}
      onPress={() => {
        // @ts-ignore - Navigation types will be properly typed
        navigation.navigate('InvoiceDetail', { invoiceId: item.id });
      }}
      activeOpacity={0.7}
    >
      {/* Gradient Header */}
      <View style={[styles.cardHeader, { backgroundColor: getStatusColor(item.status) + '15' }]}>
        <View style={styles.cardHeaderTop}>
          <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusIcon(item.status)} {item.status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.customerName}>{item.customer?.name || 'Unknown'}</Text>
      </View>
      
      {/* Card Body */}
      <View style={styles.cardBody}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>{formatCurrency(item.total, item.currency)}</Text>
        </View>
        
        <View style={styles.datesContainer}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>📅 Date</Text>
            <Text style={styles.dateValue}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.dateDivider} />
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>⏰ Due</Text>
            <Text style={styles.dateValue}>{formatDate(item.dueDate)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map((filterOption) => (
        <TouchableOpacity
          key={filterOption}
          style={[
            styles.filterButton,
            filter === filterOption && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterChange(filterOption)}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === filterOption && styles.filterButtonTextActive,
            ]}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
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
      {/* Revolut-style Header with Gradient */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <Text style={styles.title}>Invoices</Text>
          <TouchableOpacity
            style={styles.newButton}
            onPress={() => {
              // @ts-ignore - Navigation types will be properly typed
              navigation.navigate('InvoiceCreate');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.newButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {/* Search with Icon */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search invoices..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Filters */}
        {renderFilterButtons()}
      </View>

      {/* Invoice List */}
      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        renderItem={renderInvoiceCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B72EE" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyText}>No invoices found</Text>
            <Text style={styles.emptySubtext}>Create your first invoice to get started</Text>
          </View>
        }
      />
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
  headerGradient: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  newButton: {
    backgroundColor: '#5B72EE',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#5B72EE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
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
