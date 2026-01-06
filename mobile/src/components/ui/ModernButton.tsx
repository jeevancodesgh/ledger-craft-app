/**
 * ModernButton - Revolut-Style Animated Button Component
 * 
 * Features:
 * - Scale animation on press (0.97)
 * - Shadow depth animation
 * - Haptic feedback
 * - Multiple variants: primary, secondary, outline, ghost
 * - Loading state with smooth transition
 */

import React, { useCallback } from 'react';
import {
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { SPRING_CONFIG, SCALE, OPACITY, SHADOWS } from '@/utils/animations';

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

// Create animated LinearGradient
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

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
  const pressed = useSharedValue(false);

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

  // Handle press
  const handlePress = useCallback(() => {
    if (!isDisabled) {
      onPress();
    }
  }, [isDisabled, onPress]);

  // Tap gesture
  const tapGesture = Gesture.Tap()
    .enabled(!isDisabled)
    .onBegin(() => {
      'worklet';
      pressed.value = true;
    })
    .onFinalize(() => {
      'worklet';
      pressed.value = false;
    })
    .onEnd(() => {
      'worklet';
      runOnJS(triggerHaptic)();
      runOnJS(handlePress)();
    });

  // Animated scale style
  const animatedScaleStyle = useAnimatedStyle(() => {
    'worklet';
    const scale = withSpring(
      pressed.value ? SCALE.pressed : 1,
      SPRING_CONFIG.snappy
    );
    return {
      transform: [{ scale }],
    };
  });

  // Animated shadow style for primary button
  const animatedShadowStyle = useAnimatedStyle(() => {
    'worklet';
    const shadowOpacity = interpolate(
      pressed.value ? 1 : 0,
      [0, 1],
      [SHADOWS.button.shadowOpacity, SHADOWS.buttonPressed.shadowOpacity]
    );
    const shadowRadius = interpolate(
      pressed.value ? 1 : 0,
      [0, 1],
      [SHADOWS.button.shadowRadius, SHADOWS.buttonPressed.shadowRadius]
    );
    const elevation = interpolate(
      pressed.value ? 1 : 0,
      [0, 1],
      [SHADOWS.button.elevation, SHADOWS.buttonPressed.elevation]
    );

    return {
      shadowOpacity,
      shadowRadius,
      elevation,
    };
  });

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
      <GestureDetector gesture={tapGesture}>
        <Animated.View
          style={[
            styles.button,
            styles.primaryShadow,
            fullWidth && styles.fullWidth,
            isDisabled && styles.disabled,
            animatedScaleStyle,
            animatedShadowStyle,
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
        </Animated.View>
      </GestureDetector>
    );
  }

  const variantStyles = {
    secondary: styles.secondary,
    outline: styles.outline,
    ghost: styles.ghost,
  };

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View
        style={[
          styles.button,
          variantStyles[variant as keyof typeof variantStyles],
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          animatedScaleStyle,
        ]}
      >
        {buttonContent}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryShadow: {
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
    opacity: OPACITY.disabled,
  },
});

export default ModernButton;
