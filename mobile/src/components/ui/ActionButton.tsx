import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';

interface ActionButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ActionButton({ 
  title, 
  variant = 'primary', 
  loading = false, 
  size = 'md',
  disabled,
  ...props 
}: ActionButtonProps) {
  const variantStyles = {
    primary: 'bg-lime-700',
    secondary: 'bg-gray-200',
    danger: 'bg-red-600',
  };

  const textStyles = {
    primary: 'text-white',
    secondary: 'text-gray-900',
    danger: 'text-white',
  };

  const sizeStyles = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4',
  };

  const textSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <TouchableOpacity
      className={`${variantStyles[variant]} ${sizeStyles[size]} rounded-xl items-center justify-center ${
        disabled || loading ? 'opacity-50' : ''
      }`}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#111827' : '#FFFFFF'} />
      ) : (
        <Text className={`${textStyles[variant]} ${textSizeStyles[size]} font-semibold`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

