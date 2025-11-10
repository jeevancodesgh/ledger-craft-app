import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTabParamList } from '@/navigation/types';
import { expenseService } from '@/services/expenseService';
import type { Expense } from '@/types/expense';
import { useFocusEffect } from '@react-navigation/native';
import SwipeableExpenseCard from '@/components/expense/SwipeableExpenseCard';

type ExpenseListNavigationProp = NativeStackNavigationProp<AppTabParamList, 'ExpenseList'>;

export default function ExpenseListScreen() {
  const navigation = useNavigation<ExpenseListNavigationProp>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const loadExpenses = async () => {
    try {
      const data = await expenseService.fetchExpenses();
      setExpenses(data);
      applyFilters(data, searchQuery, filter);
    } catch (error) {
      console.error('Error loading expenses:', error);
      Alert.alert('Error', 'Failed to load expenses. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadExpenses();
  };

  const applyFilters = (data: Expense[], search: string, statusFilter: typeof filter) => {
    let filtered = data;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((exp) => exp.status === statusFilter);
    }

    // Apply search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (exp) =>
          exp.description.toLowerCase().includes(lowerSearch) ||
          exp.vendorName?.toLowerCase().includes(lowerSearch) ||
          exp.category?.name.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredExpenses(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    applyFilters(expenses, text, filter);
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    applyFilters(expenses, searchQuery, newFilter);
  };

  const handleEdit = (expenseId: string) => {
    navigation.navigate('ExpenseEdit', { expenseId });
  };

  const handleDelete = async (expenseId: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await expenseService.deleteExpense(expenseId);
              await loadExpenses();
              Alert.alert('Success', 'Expense deleted successfully');
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert('Error', 'Failed to delete expense. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'NZD' ? '$' : currency === 'USD' ? '$' : currency;
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

  const renderExpenseCard = ({ item }: { item: Expense }) => (
    <SwipeableExpenseCard
      expense={item}
      onPress={() => {
        handleEdit(item.id);
      }}
      onEdit={handleEdit}
      onDelete={handleDelete}
      formatCurrency={formatCurrency}
      formatDate={formatDate}
    />
  );

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {(['all', 'pending', 'approved', 'rejected'] as const).map((filterOption) => (
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
        <ActivityIndicator size="large" color="#5B72EE" />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E2875" />
      {/* Header with Dark Blue Background */}
      <View style={styles.headerGradient}>
        {/* Title, Date and New Button */}
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Expenses</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.newButton}
            onPress={() => {
              // @ts-ignore - Navigation types will be properly typed
              navigation.navigate('ExpenseCreate');
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
            placeholder="Search expenses..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Filters */}
        {renderFilterButtons()}
      </View>

      {/* Expense List */}
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpenseCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B72EE" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyText}>No expenses found</Text>
            <Text style={styles.emptySubtext}>
              Create your first expense to get started
            </Text>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  headerGradient: {
    backgroundColor: '#1E2875',
    paddingTop: 48,
    paddingBottom: 20,
    marginTop: 0,
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
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  newButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  newButtonText: {
    color: '#1E2875',
    fontSize: 15,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#1E2875',
  },
  listContent: {
    padding: 16,
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

