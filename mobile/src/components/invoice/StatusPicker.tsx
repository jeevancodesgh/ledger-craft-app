import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { STATUS_OPTIONS } from '@/utils/statusUtils';

interface StatusPickerProps {
  visible: boolean;
  currentStatus: string;
  onSelect: (status: string) => void;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function StatusPicker({
  visible,
  currentStatus,
  onSelect,
  onClose,
}: StatusPickerProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up and fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSelect = (status: string) => {
    // Trigger haptic feedback
    if (Platform.OS === 'ios') {
      const { impactAsync, ImpactFeedbackStyle } = require('expo-haptics');
      impactAsync(ImpactFeedbackStyle.Light);
    }

    onSelect(status);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Overlay */}
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              paddingBottom: insets.bottom || 16,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Title */}
          <View style={styles.header}>
            <Text style={styles.title}>Change Invoice Status</Text>
            <Text style={styles.subtitle}>Select a new status for this invoice</Text>
          </View>

          {/* Status Options */}
          <View style={styles.optionsContainer}>
            {STATUS_OPTIONS.map((status) => {
              const isSelected = status.value === currentStatus;

              return (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected,
                  ]}
                  onPress={() => handleSelect(status.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionLeft}>
                    <Feather name={status.icon} size={20} color={status.color} />
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                        {status.label}
                      </Text>
                      <Text style={styles.optionDescription}>{status.description}</Text>
                    </View>
                  </View>
                  <View style={styles.optionRight}>
                    <View style={[styles.colorDot, { backgroundColor: status.color }]} />
                    {isSelected && <Feather name="check" size={18} color="#5B72EE" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  optionsContainer: {
    paddingHorizontal: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    minHeight: 72,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: '#1e40af',
  },
  optionDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  checkmark: {
    fontSize: 20,
    color: '#3b82f6',
    fontWeight: '700',
  },
  cancelButton: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#64748b',
  },
});

