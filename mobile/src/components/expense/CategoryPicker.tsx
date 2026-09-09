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
import { expenseCategoryService } from '@/services/expenseCategoryService';
import { Feather } from '@expo/vector-icons';
import type { ExpenseCategory } from '@/types/expense';


interface CategoryPickerProps {
  visible: boolean;
  onSelect: (category: ExpenseCategory | null) => void;
  onClose: () => void;
  selectedCategoryId?: string | null;
}

export function CategoryPicker({
  visible,
  onSelect,
  onClose,
  selectedCategoryId,
}: CategoryPickerProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible) {
      loadCategories();
      setSearchQuery('');
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCategories(
        categories.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.description?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, categories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await expenseCategoryService.fetchExpenseCategories();
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
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
            <Text className="text-xl font-bold">Select Category</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-lime-700 font-semibold">Done</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2">
            <Feather name="search" size={16} color="#94A3B8" />
            <TextInput
              placeholder="Search categories..."
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
                selectedCategoryId === null
                  ? 'border-2 border-lime-700'
                  : 'border border-gray-200'
              }`}
              activeOpacity={0.7}
            >
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">No Category</Text>
                <Text className="text-sm text-gray-500">Uncategorized expense</Text>
              </View>
              {selectedCategoryId === null && (
                <View className="bg-lime-700 w-6 h-6 rounded-full items-center justify-center">
                  <Feather name="check" size={12} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {loading ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#163300" />
              </View>
            ) : filteredCategories.length === 0 ? (
              <View className="py-12 items-center">
                <Text className="text-gray-500 text-center mb-2">
                  {searchQuery ? 'No categories found' : 'No categories yet'}
                </Text>
                {!searchQuery && (
                  <Text className="text-sm text-gray-400 text-center">
                    Categories will appear here once created
                  </Text>
                )}
              </View>
            ) : (
              <View className="gap-2">
                {filteredCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => {
                      onSelect(category);
                      onClose();
                    }}
                    className={`bg-white rounded-xl p-4 flex-row items-center ${
                      selectedCategoryId === category.id
                        ? 'border-2 border-lime-700'
                        : 'border border-gray-200'
                    }`}
                    activeOpacity={0.7}
                  >
                    {/* Color indicator */}
                    <View
                      className="w-4 h-4 rounded-full mr-3"
                      style={{
                        backgroundColor: category.color || '#94a3b8',
                      }}
                    />

                    {/* Info */}
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900 mb-0.5">
                        {category.name}
                      </Text>
                      {category.description && (
                        <Text className="text-sm text-gray-500">
                          {category.description}
                        </Text>
                      )}
                    </View>

                    {/* Check mark if selected */}
                    {selectedCategoryId === category.id && (
                      <View className="bg-lime-700 w-6 h-6 rounded-full items-center justify-center">
                        <Feather name="check" size={12} color="#FFFFFF" />
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

