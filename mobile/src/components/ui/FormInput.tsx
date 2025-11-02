import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

export function FormInput({ label, error, required, ...props }: FormInputProps) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      <TextInput
        className={`bg-white border ${error ? 'border-red-500' : 'border-gray-300'} rounded-xl px-4 py-3 text-base`}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && (
        <Text className="text-red-500 text-xs mt-1">{error}</Text>
      )}
    </View>
  );
}

