import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-12 px-6">
      {icon && <View className="mb-4">{icon}</View>}
      <Text className="text-lg font-semibold text-gray-900 text-center mb-2">
        {title}
      </Text>
      {description && (
        <Text className="text-sm text-gray-500 text-center mb-6">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="bg-revolut-blue-600 px-6 py-3 rounded-xl"
          activeOpacity={0.7}
        >
          <Text className="text-white font-semibold">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

