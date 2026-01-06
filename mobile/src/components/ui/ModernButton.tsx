import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ModernButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function ModernButton({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
}: ModernButtonProps) {
  const isDisabled = disabled || loading;

  const padding = {
    sm: { paddingHorizontal: 12, paddingVertical: 8 },
    md: { paddingHorizontal: 16, paddingVertical: 12 },
    lg: { paddingHorizontal: 24, paddingVertical: 16 },
  };

  const buttonContent = (
    <View style={[
      styles.buttonContent,
      padding[size],
      fullWidth && styles.fullWidth,
    ]}>
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#ffffff' : '#33415C'}
          style={{ marginRight: 8 }}
        />
      )}
      {!loading && icon && iconPosition === 'left' && (
        <View style={{ marginRight: 8 }}>{icon}</View>
      )}
      <Text
        style={[
          styles.buttonText,
          variant === 'primary' && styles.primaryText,
          variant !== 'primary' && styles.secondaryText,
          size === 'lg' && { fontSize: 16 },
        ]}
      >
        {children}
      </Text>
      {!loading && icon && iconPosition === 'right' && (
        <View style={{ marginLeft: 8 }}>{icon}</View>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[
          styles.button,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
        ]}
      >
        <LinearGradient
          colors={['#5B72EE', '#4A5FD8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {buttonContent}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles = {
    secondary: styles.secondary,
    outline: styles.outline,
    ghost: styles.ghost,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        variantStyles[variant as keyof typeof variantStyles],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
      ]}
    >
      {buttonContent}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    shadowColor: '#5B72EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#0f172a',
  },
  gradient: {
    borderRadius: 12,
  },
  secondary: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});


