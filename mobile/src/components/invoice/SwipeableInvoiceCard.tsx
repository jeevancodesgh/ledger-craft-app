/**
 * SwipeableInvoiceCard - Revolut-Style Swipeable Card with Press Feedback
 * 
 * Features:
 * - Swipe to reveal status actions
 * - Press scale animation (0.98) when touched
 * - Shadow depth animation on press
 * - Haptic feedback
 * - Spring physics for natural feel
 */

import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import type { Invoice } from '@/types/invoice';
import { STATUS_OPTIONS, getStatusColor, getStatusIcon } from '@/utils/statusUtils';
import { SPRING_CONFIG, SCALE } from '@/utils/animations';

interface SwipeableInvoiceCardProps {
  invoice: Invoice;
  onPress: () => void;
  onStatusChange: (invoiceId: string, status: string) => void;
  disabled?: boolean;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (dateString: string) => string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -100; // Negative for left swipe
const ACTION_BUTTON_WIDTH = 80;
const SWIPE_SPRING_CONFIG = {
  damping: 20,
  stiffness: 90,
};

export default function SwipeableInvoiceCard({
  invoice,
  onPress,
  onStatusChange,
  disabled = false,
  formatCurrency,
  formatDate,
}: SwipeableInvoiceCardProps) {
  const translateX = useSharedValue(0);
  const isSwipedRef = useRef(false);
  const cardPressed = useSharedValue(false);

  // Filter out current status from action buttons
  const availableStatuses = STATUS_OPTIONS.filter((opt) => opt.value !== invoice.status);

  // Trigger haptic feedback
  const triggerHaptic = useCallback((style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (error) {
        // Haptic feedback not available
      }
    }
  }, []);

  // Handle card press
  const handleCardPress = useCallback(() => {
    if (!disabled) {
      onPress();
    }
  }, [disabled, onPress]);

  const handleStatusPress = useCallback((status: string) => {
    // Trigger haptic feedback
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    // Animate back to original position
    translateX.value = withSpring(0, SWIPE_SPRING_CONFIG);
    isSwipedRef.current = false;

    // Call status change handler
    onStatusChange(invoice.id, status);
  }, [invoice.id, onStatusChange, triggerHaptic, translateX]);

  // Pan gesture for swipe
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (disabled) return;

      // Only allow left swipe
      const newTranslateX = event.translationX;
      if (newTranslateX < 0) {
        // Add resistance when swiping beyond actions
        const maxSwipe = -ACTION_BUTTON_WIDTH * availableStatuses.length;
        if (newTranslateX < maxSwipe) {
          translateX.value = maxSwipe + (newTranslateX - maxSwipe) * 0.1;
        } else {
          translateX.value = newTranslateX;
        }
      } else {
        // No right swipe
        translateX.value = 0;
      }
    })
    .onEnd((event) => {
      if (disabled) return;

      // Snap to position based on velocity and position
      if (translateX.value < SWIPE_THRESHOLD || event.velocityX < -500) {
        // Snap open
        translateX.value = withSpring(-ACTION_BUTTON_WIDTH * availableStatuses.length, SWIPE_SPRING_CONFIG);
        isSwipedRef.current = true;
      } else {
        // Snap closed
        translateX.value = withSpring(0, SWIPE_SPRING_CONFIG);
        isSwipedRef.current = false;
      }
    });

  // Tap gesture for card press
  const tapGesture = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      'worklet';
      cardPressed.value = true;
    })
    .onFinalize(() => {
      'worklet';
      cardPressed.value = false;
    })
    .onEnd(() => {
      'worklet';
      // Only trigger press if not swiped
      if (Math.abs(translateX.value) < 10) {
        runOnJS(triggerHaptic)(Haptics.ImpactFeedbackStyle.Light);
        runOnJS(handleCardPress)();
      }
    });

  // Combine gestures - pan takes priority
  const composedGesture = Gesture.Race(panGesture, tapGesture);

  // Animated style for card translation (swipe)
  const cardSwipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Animated style for press feedback
  const cardPressStyle = useAnimatedStyle(() => {
    'worklet';
    const scale = withSpring(
      cardPressed.value ? SCALE.cardPressed : 1,
      SPRING_CONFIG.gentle
    );

    const shadowOpacity = interpolate(
      cardPressed.value ? 1 : 0,
      [0, 1],
      [0.1, 0.05]
    );

    return {
      transform: [{ scale }],
      shadowOpacity,
    };
  });

  // Animated style for actions container
  const actionsAnimatedStyle = useAnimatedStyle(() => {
    const opacity = Math.min(Math.abs(translateX.value) / 100, 1);
    return {
      opacity,
    };
  });

  // Animated style for action buttons
  const getActionButtonStyle = (index: number) => {
    return useAnimatedStyle(() => {
      const progress = Math.min(Math.abs(translateX.value) / (ACTION_BUTTON_WIDTH * (index + 1)), 1);
      const scale = interpolate(progress, [0, 0.5, 1], [0.8, 0.95, 1]);
      
      return {
        transform: [{ scale }],
      };
    });
  };

  return (
    <View style={styles.container}>
      {/* Action Buttons (Behind) */}
      <Animated.View style={[styles.actionsContainer, actionsAnimatedStyle]}>
        {availableStatuses.map((status, index) => (
          <GestureDetector
            key={status.value}
            gesture={Gesture.Tap()
              .onEnd(() => {
                'worklet';
                runOnJS(handleStatusPress)(status.value);
              })}
          >
            <Animated.View
              style={[
                styles.actionButton,
                { backgroundColor: status.color },
                getActionButtonStyle(index),
              ]}
            >
              <Text style={styles.actionIcon}>{status.icon}</Text>
              <Text style={styles.actionLabel}>{status.label}</Text>
            </Animated.View>
          </GestureDetector>
        ))}
      </Animated.View>

      {/* Swipeable Card */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.card, cardSwipeStyle, cardPressStyle]}>
          <View style={styles.cardContent}>
            {/* Gradient Header */}
            <View
              style={[
                styles.cardHeader,
                { backgroundColor: getStatusColor(invoice.status) + '15' },
              ]}
            >
              <View style={styles.cardHeaderTop}>
                <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(invoice.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusIcon(invoice.status)} {invoice.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.customerName}>{invoice.customer?.name || 'Unknown'}</Text>
            </View>

            {/* Card Body */}
            <View style={styles.cardBody}>
              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>Amount</Text>
                <Text style={styles.amountValue}>
                  {formatCurrency(invoice.total || 0, invoice.currency || 'NZD')}
                </Text>
              </View>

              <View style={styles.datesContainer}>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>📅 Date</Text>
                  <Text style={styles.dateValue}>{formatDate(invoice.date)}</Text>
                </View>
                <View style={styles.dateDivider} />
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>⏰ Due</Text>
                  <Text style={styles.dateValue}>{formatDate(invoice.dueDate)}</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: ACTION_BUTTON_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  customerName: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  cardBody: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  amountContainer: {
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  datesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  dateDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
});
