import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
  StyleSheet,
} from 'react-native';

interface ModernInputProps extends Omit<TextInputProps, 'onChange'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export function ModernInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  autoCapitalize = 'none',
  keyboardType = 'default',
  showPasswordToggle = false,
  ...props
}: ModernInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPasswordToggle ? !showPassword : !secureTextEntry;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        {/* Label */}
        <Text
          style={[
            styles.label,
            (isFocused || value) ? styles.labelFocused : styles.labelUnfocused,
            error && styles.labelError,
          ]}
        >
          {label}
        </Text>

        {/* Input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={isFocused ? placeholder : ''}
          placeholderTextColor="#94a3b8"
          secureTextEntry={!inputType}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={styles.input}
          {...props}
        />

        {/* Password Toggle */}
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.passwordToggle}
          >
            <Text style={{ fontSize: 20 }}>
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 12,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  inputFocused: {
    borderColor: '#33415C',
    shadowColor: '#33415C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  label: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 2,
  },
  labelFocused: {
    top: 8,
    fontSize: 12,
    color: '#33415C',
  },
  labelUnfocused: {
    top: 16,
    fontSize: 14,
    color: '#64748b',
  },
  labelError: {
    color: '#ef4444',
  },
  input: {
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 8,
    fontSize: 16,
    color: '#0f172a',
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 24,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
