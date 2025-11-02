import React from 'react';
import { View, Text, Switch } from 'react-native';

interface FormSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  description?: string;
}

export function FormSwitch({ label, value, onValueChange, description }: FormSwitchProps) {
  return (
    <View className="flex-row items-center justify-between py-3 mb-2">
      <View className="flex-1 pr-4">
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
        {description && (
          <Text className="text-xs text-gray-500 mt-0.5">{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D1D5DB', true: '#5B72EE' }}
        thumbColor={value ? '#FFFFFF' : '#F3F4F6'}
      />
    </View>
  );
}

