import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BalanceCardProps {
  totalBalance: number;
  availableBalance?: number;
  pendingBalance?: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function BalanceCard({
  totalBalance,
  availableBalance,
  pendingBalance,
  trend
}: BalanceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <LinearGradient
      colors={['#1E2875', '#2E4CEE', '#4158D0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-3xl p-6 mb-6 shadow-lg"
    >
      <View className="mb-4">
        <Text className="text-white/70 text-sm font-medium mb-2">
          Total Balance
        </Text>
        <View className="flex-row items-baseline">
          <Text className="text-white text-5xl font-bold tracking-tight">
            {formatCurrency(totalBalance)}
          </Text>
          {trend && (
            <View className={`ml-3 px-3 py-1 rounded-full ${
              trend.isPositive ? 'bg-emerald-500/20' : 'bg-red-500/20'
            }`}>
              <Text className={`text-sm font-semibold ${
                trend.isPositive ? 'text-emerald-100' : 'text-red-100'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
      </View>

      {(availableBalance !== undefined || pendingBalance !== undefined) && (
        <View className="flex-row gap-6 pt-4 border-t border-white/10">
          {availableBalance !== undefined && (
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-emerald-400" />
              <View>
                <Text className="text-white/50 text-xs">Available</Text>
                <Text className="text-white text-sm font-semibold">
                  {formatCurrency(availableBalance)}
                </Text>
              </View>
            </View>
          )}
          {pendingBalance !== undefined && pendingBalance > 0 && (
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-amber-400" />
              <View>
                <Text className="text-white/50 text-xs">Pending</Text>
                <Text className="text-white text-sm font-semibold">
                  {formatCurrency(pendingBalance)}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </LinearGradient>
  );
}

