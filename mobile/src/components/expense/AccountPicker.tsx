import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { accountService } from '@/services/accountService';
import { Feather } from '@expo/vector-icons';
import type { Account } from '@/types/expense';

interface AccountPickerProps {
  visible: boolean;
  onSelect: (account: Account | null) => void;
  onClose: () => void;
  selectedAccountId?: string | null;
}

const getAccountTypeIcon = (type: string): keyof typeof Feather.glyphMap => {
  switch (type) {
    case 'bank':
      return 'home';
    case 'cash':
      return 'dollar-sign';
    case 'credit_card':
      return 'credit-card';
    case 'loan':
      return 'file-text';
    default:
      return 'briefcase';
  }
};

export function AccountPicker({
  visible,
  onSelect,
  onClose,
  selectedAccountId,
}: AccountPickerProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible) {
      loadAccounts();
      setSearchQuery('');
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAccounts(accounts);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredAccounts(
        accounts.filter(
          (a) =>
            a.name.toLowerCase().includes(query) ||
            a.type.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, accounts]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountService.fetchAccounts();
      setAccounts(data);
      setFilteredAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xl font-bold">Select Account</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-lime-700 font-semibold">Done</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2">
            <Feather name="search" size={16} color="#94A3B8" />
            <TextInput
              placeholder="Search accounts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-base"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1">
          <View className="p-4">
            {/* None option */}
            <TouchableOpacity
              onPress={() => {
                onSelect(null);
                onClose();
              }}
              className={`bg-white rounded-xl p-4 mb-2 flex-row items-center ${
                selectedAccountId === null
                  ? 'border-2 border-lime-700'
                  : 'border border-gray-200'
              }`}
              activeOpacity={0.7}
            >
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">No Account</Text>
                <Text className="text-sm text-gray-500">No account assigned</Text>
              </View>
              {selectedAccountId === null && (
                <View className="bg-lime-700 w-6 h-6 rounded-full items-center justify-center">
                  <Feather name="check" size={12} color="#163300" />
                </View>
              )}
            </TouchableOpacity>

            {loading ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#163300" />
              </View>
            ) : filteredAccounts.length === 0 ? (
              <View className="py-12 items-center">
                <Text className="text-gray-500 text-center mb-2">
                  {searchQuery ? 'No accounts found' : 'No accounts yet'}
                </Text>
                {!searchQuery && (
                  <Text className="text-sm text-gray-400 text-center">
                    Accounts will appear here once created
                  </Text>
                )}
              </View>
            ) : (
              <View className="gap-2">
                {filteredAccounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    onPress={() => {
                      onSelect(account);
                      onClose();
                    }}
                    className={`bg-white rounded-xl p-4 flex-row items-center ${
                      selectedAccountId === account.id
                        ? 'border-2 border-lime-700'
                        : 'border border-gray-200'
                    }`}
                    activeOpacity={0.7}
                  >
                    {/* Icon */}
                    <Feather
                      name={getAccountTypeIcon(account.type)}
                      size={20}
                      color="#163300"
                      style={{ marginRight: 12 }}
                    />

                    {/* Info */}
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900 mb-0.5">
                        {account.name}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        {account.type.replace('_', ' ').toUpperCase()} • {account.currency}
                      </Text>
                    </View>

                    {/* Check mark if selected */}
                    {selectedAccountId === account.id && (
                      <View className="bg-lime-500 w-6 h-6 rounded-full items-center justify-center">
                        <Feather name="check" size={12} color="#163300" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

