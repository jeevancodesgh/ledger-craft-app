import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';

interface SmartDatePickerProps {
  label: string;
  value: string; // ISO date string
  onChangeDate: (date: string) => void;
  minimumDate?: Date;
}

type DatePreset = {
  label: string;
  days: number;
  icon: string;
};

const DATE_PRESETS: DatePreset[] = [
  { label: 'Due on Receipt', days: 0, icon: '⚡' },
  { label: 'Net 7', days: 7, icon: '📅' },
  { label: 'Net 15', days: 15, icon: '📆' },
  { label: 'Net 30', days: 30, icon: '🗓️' },
];

export function SmartDatePicker({
  label,
  value,
  onChangeDate,
  minimumDate,
}: SmartDatePickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date(value));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handlePresetSelect = (days: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    const isoString = newDate.toISOString().split('T')[0];
    onChangeDate(isoString);
    setShowModal(false);
  };

  const handleCustomDate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'ios') {
      // iOS shows inline picker
      setShowDatePicker(true);
    } else {
      // Android shows native modal
      setShowModal(false);
      setTimeout(() => setShowDatePicker(true), 100);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS === 'android') {
        // Android: apply immediately
        const isoString = selectedDate.toISOString().split('T')[0];
        onChangeDate(isoString);
      }
    }
  };

  const handleIOSConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const isoString = tempDate.toISOString().split('T')[0];
    onChangeDate(isoString);
    setShowDatePicker(false);
    setShowModal(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowModal(true);
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonIcon}>📅</Text>
        <Text style={styles.buttonText}>{formatDate(value)}</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* Presets Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Due Date</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.presetsContainer}>
              {DATE_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  style={styles.presetButton}
                  onPress={() => handlePresetSelect(preset.days)}
                  activeOpacity={0.7}
                >
                  <View style={styles.presetLeft}>
                    <Text style={styles.presetIcon}>{preset.icon}</Text>
                    <View>
                      <Text style={styles.presetLabel}>{preset.label}</Text>
                      <Text style={styles.presetSubtext}>
                        {preset.days === 0 ? 'Today' : `${preset.days} days from now`}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.presetChevron}>›</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.presetButton, styles.customButton]}
                onPress={handleCustomDate}
                activeOpacity={0.7}
              >
                <View style={styles.presetLeft}>
                  <Text style={styles.presetIcon}>🗓️</Text>
                  <View>
                    <Text style={styles.presetLabel}>Custom Date</Text>
                    <Text style={styles.presetSubtext}>Pick a specific date</Text>
                  </View>
                </View>
                <Text style={styles.presetChevron}>›</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* iOS inline date picker */}
            {showDatePicker && Platform.OS === 'ios' && (
              <View style={styles.iosPickerContainer}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={minimumDate}
                  style={styles.iosPicker}
                />
                <TouchableOpacity style={styles.iosConfirmButton} onPress={handleIOSConfirm}>
                  <Text style={styles.iosConfirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Android native date picker */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  buttonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
  },
  chevron: {
    fontSize: 20,
    color: '#94a3b8',
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeButton: {
    fontSize: 24,
    color: '#64748b',
    fontWeight: '300',
  },
  presetsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  customButton: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    marginTop: 8,
  },
  presetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  presetIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  presetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  presetSubtext: {
    fontSize: 13,
    color: '#64748b',
  },
  presetChevron: {
    fontSize: 20,
    color: '#94a3b8',
    fontWeight: '300',
  },
  iosPickerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  iosPicker: {
    height: 200,
  },
  iosConfirmButton: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 14,
    backgroundColor: '#5B72EE',
    borderRadius: 12,
    alignItems: 'center',
  },
  iosConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});


