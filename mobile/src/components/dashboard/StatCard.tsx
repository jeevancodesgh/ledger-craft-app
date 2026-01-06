/**
 * StatCard - Revolut-Style Animated Stat Card
 * 
 * Features:
 * - Press scale animation (0.98)
 * - Animated icon container on press
 * - Shadow depth animation
 * - Haptic feedback
 * - Optional onPress handler
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { SPRING_CONFIG, SCALE, SHADOWS } from '@/utils/animations';

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
  onPress?: () => void;
}

export function StatCard({
  icon,
  title,
  value,
  subtitle,
  trend,
  variant = 'default',
  onPress,
}: StatCardProps) {
  // Animation shared values
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
    if (onPress) {
      onPress();
    }
  }, [onPress]);

  // Tap gesture
  const tapGesture = Gesture.Tap()
    .enabled(!!onPress)
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

  // Animated card style
  const animatedCardStyle = useAnimatedStyle(() => {
    'worklet';
    const scale = withSpring(
      pressed.value ? SCALE.cardPressed : 1,
      SPRING_CONFIG.gentle
    );

    const shadowOpacity = interpolate(
      pressed.value ? 1 : 0,
      [0, 1],
      [0.08, 0.04]
    );

    return {
      transform: [{ scale }],
      shadowOpacity,
    };
  });

  // Animated icon container style
  const animatedIconStyle = useAnimatedStyle(() => {
    'worklet';
    const scale = withSpring(
      pressed.value ? 0.9 : 1,
      SPRING_CONFIG.snappy
    );

    return {
      transform: [{ scale }],
    };
  });

  const iconBgColors = {
    default: '#EEF2FF',
    success: '#D1FAE5',
    warning: '#FEF3C7',
    danger: '#FEE2E2',
  };

  const valueColors = {
    default: '#0F172A',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
  };

  const trendColor = trend?.isPositive !== false ? '#059669' : '#DC2626';
  const trendBgColor = trend?.isPositive !== false ? '#ECFDF5' : '#FEF2F2';

  const content = (
    <>
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.iconContainer,
            { backgroundColor: iconBgColors[variant] },
            animatedIconStyle,
          ]}
        >
          {icon}
        </Animated.View>

        {trend && (
          <View style={[styles.trendBadge, { backgroundColor: trendBgColor }]}>
            <Text style={[styles.trendText, { color: trendColor }]}>
              {trend.value > 0 ? '+' : ''}
              {trend.value.toFixed(1)}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, { color: valueColors[variant] }]}>
          {value}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </>
  );

  // If no onPress, render without gesture detector
  if (!onPress) {
    return <View style={styles.card}>{content}</View>;
  }

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View style={[styles.card, animatedCardStyle]}>
        {content}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 12,
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {},
  title: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
});

export default StatCard;
