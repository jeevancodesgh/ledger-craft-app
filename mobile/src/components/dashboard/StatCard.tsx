import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function StatCard({
  icon,
  title,
  value,
  subtitle,
  trend,
  variant = 'default'
}: StatCardProps) {
  const iconBgColors = {
    default: 'bg-revolut-blue-100',
    success: 'bg-emerald-100',
    warning: 'bg-amber-100',
    danger: 'bg-red-100'
  };

  const valueColors = {
    default: 'text-foreground',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-red-600'
  };

  const trendColor = trend?.isPositive !== false ? 'text-emerald-600' : 'text-red-600';
  const trendBg = trend?.isPositive !== false ? 'bg-emerald-50' : 'bg-red-50';

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <View className="flex-row items-start justify-between mb-3">
        <View className={`${iconBgColors[variant]} p-3 rounded-xl`}>
          {icon}
        </View>
        
        {trend && (
          <View className={`${trendBg} px-2 py-1 rounded-full`}>
            <Text className={`${trendColor} text-xs font-semibold`}>
              {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
            </Text>
          </View>
        )}
      </View>

      <View>
        <Text className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
          {title}
        </Text>
        <Text className={`text-2xl font-bold ${valueColors[variant]}`}>
          {value}
        </Text>
        {subtitle && (
          <Text className="text-gray-500 text-xs mt-1">
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

