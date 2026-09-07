import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { ExpenseStackParamList } from '@/navigation/types';
import { NativeHeaderButton } from '@/components/ui/NativeHeaderButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { expenseService } from '@/services/expenseService';
import type { Expense } from '@/types/expense';
import SwipeableExpenseCard from '@/components/expense/SwipeableExpenseCard';

type ExpenseListNavigationProp = NativeStackNavigationProp<ExpenseStackParamList, 'ExpenseList'>;

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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        placeholder: 'Search expenses',
        hideWhenScrolling: true,
        onChangeText: (event) => handleSearch(event.nativeEvent.text),
      },
      headerRight: () => (
        <NativeHeaderButton
          label="New"
          primary
          onPress={() => navigation.navigate('ExpenseCreate')}
        />
      ),
    });
  }, [navigation, expenses, filter]);

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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
    >
      {(['all', 'pending', 'approved', 'rejected'] as const).map((filterOption) => (
        <Pressable
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
        </Pressable>
      ))}
    </ScrollView>
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
      {Platform.OS === 'android' && (
        <View style={styles.androidSearch}>
          <Feather name="search" size={18} color="#64748B" />
          <TextInput
            style={styles.androidSearchInput}
            placeholder="Search expenses"
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#94A3B8"
          />
        </View>
      )}
      {renderFilterButtons()}
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpenseCard}
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B72EE" />
        }
        ListEmptyComponent={
          expenses.length === 0 ? (
            <EmptyState
              title="No expenses yet"
              description="Log a receipt or add one by hand."
              actionLabel="Add expense"
              onAction={() => navigation.navigate('ExpenseCreate')}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No expenses match</Text>
              <Text style={styles.emptySubtext}>Try a different search or status</Text>
            </View>
          )
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
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterButtonActive: {
    backgroundColor: '#5B72EE',
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

