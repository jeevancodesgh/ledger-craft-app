import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  variant?: 'default' | 'primary';
}

export function QuickActionButton({
  icon,
  label,
  onPress,
  variant = 'default'
}: QuickActionButtonProps) {
  const bgClass = variant === 'primary' 
    ? 'bg-revolut-blue-600' 
    : 'bg-white/10';
  
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${bgClass} rounded-2xl p-4 items-center justify-center min-w-[80px] active:opacity-70`}
      activeOpacity={0.7}
    >
      <View className={`p-3 rounded-full ${variant === 'primary' ? 'bg-white/20' : 'bg-white/10'} mb-2`}>
        {icon}
      </View>
      <Text className="text-white text-xs font-medium text-center">
        {label}
      </Text>
    </TouchableOpacity>
  );
}

