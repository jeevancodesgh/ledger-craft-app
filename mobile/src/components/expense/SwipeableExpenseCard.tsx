import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { Expense } from '@/types/expense';

interface SwipeableExpenseCardProps {
  expense: Expense;
  onPress: () => void;
  onEdit: (expenseId: string) => void;
  onDelete: (expenseId: string) => void;
  disabled?: boolean;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (dateString: string) => string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -100; // Negative for left swipe
const ACTION_BUTTON_WIDTH = 80;
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 90,
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return '#10b981'; // green
    case 'rejected':
      return '#ef4444'; // red
    case 'pending':
    default:
      return '#6b7280'; // gray
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
      return '✓';
    case 'rejected':
      return '✗';
    case 'pending':
      return '⏳';
    default:
      return '•';
  }
};

export default function SwipeableExpenseCard({
  expense,
  onPress,
  onEdit,
  onDelete,
  disabled = false,
  formatCurrency,
  formatDate,
}: SwipeableExpenseCardProps) {
  const translateX = useSharedValue(0);
  const isSwipedRef = useRef(false);

  const actions = [
    { label: 'Edit', icon: '✏️', color: '#3b82f6', action: () => onEdit(expense.id) },
    { label: 'Delete', icon: '🗑️', color: '#ef4444', action: () => onDelete(expense.id) },
  ];

  const triggerHaptic = () => {
    if (Platform.OS === 'ios') {
      try {
        const { impactAsync, ImpactFeedbackStyle } = require('expo-haptics');
        impactAsync(ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.log('Haptic feedback not available');
      }
    }
  };

  const handleActionPress = (action: () => void) => {
    // Trigger haptic feedback
    triggerHaptic();

    // Animate back to original position
    translateX.value = withSpring(0, SPRING_CONFIG);
    isSwipedRef.current = false;

    // Call action handler
    action();
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (disabled) return;

      // Only allow left swipe
      const newTranslateX = event.translationX;
      if (newTranslateX < 0) {
        // Add resistance when swiping beyond actions
        const maxSwipe = -ACTION_BUTTON_WIDTH * actions.length;
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
        translateX.value = withSpring(-ACTION_BUTTON_WIDTH * actions.length, SPRING_CONFIG);
        isSwipedRef.current = true;
      } else {
        // Snap closed
        translateX.value = withSpring(0, SPRING_CONFIG);
        isSwipedRef.current = false;
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const actionsAnimatedStyle = useAnimatedStyle(() => {
    const opacity = Math.min(Math.abs(translateX.value) / 100, 1);
    return {
      opacity,
    };
  });

  return (
    <View style={styles.container}>
      {/* Action Buttons (Behind) */}
      <Animated.View style={[styles.actionsContainer, actionsAnimatedStyle]}>
        {actions.map((actionItem, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.actionButton,
              { backgroundColor: actionItem.color },
            ]}
            onPress={() => handleActionPress(actionItem.action)}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <Text style={styles.actionIcon}>{actionItem.icon}</Text>
            <Text style={styles.actionLabel}>{actionItem.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Swipeable Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, cardAnimatedStyle]}>
          <TouchableOpacity
            style={styles.cardContent}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={disabled}
          >
            {/* Gradient Header */}
            <View
              style={[
                styles.cardHeader,
                { backgroundColor: getStatusColor(expense.status) + '15' },
              ]}
            >
              <View style={styles.cardHeaderTop}>
                <Text style={styles.expenseDescription} numberOfLines={1}>
                  {expense.description}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(expense.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusIcon(expense.status)} {expense.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.headerBottom}>
                {expense.vendorName && (
                  <Text style={styles.vendorName}>{expense.vendorName}</Text>
                )}
                {expense.category && (
                  <View
                    style={[
                      styles.categoryBadge,
                      expense.category.color && {
                        backgroundColor: expense.category.color + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        expense.category.color && { color: expense.category.color },
                      ]}
                    >
                      {expense.category.name}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Card Body */}
            <View style={styles.cardBody}>
              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>Amount</Text>
                <Text style={styles.amountValue}>
                  {formatCurrency(expense.amount || 0, expense.currency || 'USD')}
                </Text>
              </View>

              <View style={styles.datesContainer}>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>📅 Date</Text>
                  <Text style={styles.dateValue}>{formatDate(expense.expenseDate)}</Text>
                </View>
                {expense.receiptUrl && (
                  <>
                    <View style={styles.dateDivider} />
                    <View style={styles.dateItem}>
                      <Text style={styles.dateLabel}>🧾 Receipt</Text>
                      <Text style={styles.dateValue}>Available</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>
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
  expenseDescription: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginRight: 8,
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
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vendorName: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
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

