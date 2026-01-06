/**
 * ModernInput - Revolut-Style Animated Input Component
 * 
 * Features:
 * - Animated border color on focus (gray -> blue)
 * - Subtle scale animation on focus
 * - Floating label animation
 * - Smooth shadow transitions
 * - Haptic feedback on focus
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TIMING_CONFIG, SPRING_CONFIG, SCALE, COLORS, EASING } from '@/utils/animations';

interface ModernInputProps extends Omit<TextInputProps, 'onChange'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

// Create animated components
const AnimatedView = Animated.View;
const AnimatedText = Animated.Text;

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

  // Animation shared values
  const focusProgress = useSharedValue(0);
  const labelPosition = useSharedValue(value ? 1 : 0);
  const containerScale = useSharedValue(1);
  const errorShake = useSharedValue(0);

  // Trigger haptic feedback
  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        // Haptic feedback not available
      }
    }
  }, []);

  // Update animations when focus changes
  useEffect(() => {
    focusProgress.value = withTiming(isFocused ? 1 : 0, {
      duration: TIMING_CONFIG.normal,
      easing: EASING.easeOut,
    });

    if (isFocused) {
      // Subtle scale pulse on focus
      containerScale.value = withSpring(SCALE.focus, SPRING_CONFIG.gentle);
      setTimeout(() => {
        containerScale.value = withSpring(1, SPRING_CONFIG.gentle);
      }, 150);
    }
  }, [isFocused]);

  // Update label position when value changes
  useEffect(() => {
    const shouldFloat = isFocused || value.length > 0;
    labelPosition.value = withTiming(shouldFloat ? 1 : 0, {
      duration: TIMING_CONFIG.fast,
      easing: EASING.easeOut,
    });
  }, [isFocused, value]);

  // Shake animation on error
  useEffect(() => {
    if (error) {
      errorShake.value = withTiming(1, { duration: 50 }, () => {
        errorShake.value = withTiming(-1, { duration: 50 }, () => {
          errorShake.value = withTiming(0.5, { duration: 50 }, () => {
            errorShake.value = withTiming(-0.5, { duration: 50 }, () => {
              errorShake.value = withTiming(0, { duration: 50 });
            });
          });
        });
      });
    }
  }, [error]);

  // Animated container style (border color, shadow, scale)
  const animatedContainerStyle = useAnimatedStyle(() => {
    'worklet';
    const borderColor = error
      ? COLORS.danger
      : interpolateColor(
          focusProgress.value,
          [0, 1],
          [COLORS.border, COLORS.primary]
        );

    const shadowOpacity = interpolate(
      focusProgress.value,
      [0, 1],
      [0, 0.15]
    );

    const translateX = errorShake.value * 4;

    return {
      borderColor,
      transform: [
        { scale: containerScale.value },
        { translateX },
      ],
      shadowColor: error ? COLORS.danger : COLORS.primary,
      shadowOpacity,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
    };
  });

  // Animated label style (position, size, color)
  const animatedLabelStyle = useAnimatedStyle(() => {
    'worklet';
    const top = interpolate(labelPosition.value, [0, 1], [16, 8]);
    const fontSize = interpolate(labelPosition.value, [0, 1], [14, 12]);
    const color = error
      ? COLORS.danger
      : interpolateColor(
          focusProgress.value,
          [0, 1],
          [COLORS.textSecondary, COLORS.primary]
        );

    return {
      top,
      fontSize,
      color,
    };
  });

  const handleFocus = () => {
    setIsFocused(true);
    triggerHaptic();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    triggerHaptic();
  };

  return (
    <View style={styles.container}>
      <AnimatedView
        style={[
          styles.inputContainer,
          animatedContainerStyle,
        ]}
      >
        {/* Animated Label */}
        <AnimatedText
          style={[
            styles.label,
            animatedLabelStyle,
          ]}
        >
          {label}
        </AnimatedText>

        {/* Input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={isFocused ? placeholder : ''}
          placeholderTextColor="#94a3b8"
          secureTextEntry={!inputType}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={styles.input}
          {...props}
        />

        {/* Password Toggle */}
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.passwordToggle}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 }}>
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </Text>
          </TouchableOpacity>
        )}
      </AnimatedView>

      {/* Error Message with fade-in */}
      {error && (
        <Animated.Text
          style={styles.errorText}
        >
          {error}
        </Animated.Text>
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
    borderWidth: 1.5,
    borderRadius: 12,
    borderColor: '#e2e8f0',
    overflow: 'visible',
  },
  label: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    fontWeight: '500',
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
    top: 20,
    padding: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default ModernInput;
