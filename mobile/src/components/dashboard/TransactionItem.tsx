import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface TransactionItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  amount: number;
  date?: string;
  onPress?: () => void;
}

export function TransactionItem({
  icon,
  title,
  subtitle,
  amount,
  date,
  onPress
}: TransactionItemProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(Math.abs(value));
  };

  const isPositive = amount > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-3 p-3 bg-white rounded-xl active:bg-gray-50"
      activeOpacity={0.7}
    >
      <View className="bg-revolut-blue-100 p-3 rounded-full">
        {icon}
      </View>

      <View className="flex-1">
        <Text className="font-semibold text-sm text-gray-900 mb-0.5">
          {title}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-gray-500" numberOfLines={1}>
            {subtitle}
          </Text>
          {date && (
            <>
              <Text className="text-xs text-gray-400">•</Text>
              <Text className="text-xs text-gray-500">{date}</Text>
            </>
          )}
        </View>
      </View>

      <Text className={`font-bold text-sm ${
        isPositive ? 'text-emerald-600' : 'text-gray-900'
      }`}>
        {isPositive && '+'}{formatCurrency(amount)}
      </Text>
    </TouchableOpacity>
  );
}

