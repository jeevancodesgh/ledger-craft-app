import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Invoice } from '@/types/invoice';
import type { CreatePaymentRequest } from '@/types/payment';
import { PAYMENT_METHOD_OPTIONS } from '@/utils/statusUtils';

interface PaymentCaptureModalProps {
  visible: boolean;
  invoice: Invoice;
  onSubmit: (paymentData: CreatePaymentRequest) => Promise<void>;
  onClose: () => void;
}

export default function PaymentCaptureModal({
  visible,
  invoice,
  onSubmit,
  onClose,
}: PaymentCaptureModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  // Form state
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash' | 'cheque' | 'credit_card' | 'online'>('bank_transfer');
  const [amount, setAmount] = useState(invoice.total?.toString() || '0');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedMethod = PAYMENT_METHOD_OPTIONS.find((m) => m.value === paymentMethod);

  // Calculate balance
  const parsedAmount = parseFloat(amount) || 0;
  const isPartialPayment = parsedAmount < invoice.total;
  const isOverpayment = parsedAmount > invoice.total;
  const balanceAfterPayment = invoice.total - parsedAmount;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (selectedMethod?.requiresReference && !referenceNumber.trim()) {
      newErrors.referenceNumber = 'Reference number is recommended for this payment method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      if (Platform.OS === 'ios') {
        const { notificationAsync, NotificationFeedbackType } = require('expo-haptics');
        notificationAsync(NotificationFeedbackType.Error);
      }
      return;
    }

    // Show warning for partial payments
    if (isPartialPayment) {
      Alert.alert(
        'Partial Payment',
        `This is a partial payment. The remaining balance will be $${Math.abs(balanceAfterPayment).toFixed(2)}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => submitPayment() },
        ]
      );
      return;
    }

    // Show alert for overpayments
    if (isOverpayment) {
      Alert.alert(
        'Overpayment',
        `The payment amount exceeds the invoice total by $${Math.abs(balanceAfterPayment).toFixed(2)}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => submitPayment() },
        ]
      );
      return;
    }

    await submitPayment();
  };

  const submitPayment = async () => {
    try {
      setLoading(true);

      const paymentData: CreatePaymentRequest = {
        invoiceId: invoice.id,
        paymentMethod,
        amount: parseFloat(amount),
        paymentDate,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        generateReceipt: true,
      };

      await onSubmit(paymentData);

      // Success haptic
      if (Platform.OS === 'ios') {
        const { notificationAsync, NotificationFeedbackType } = require('expo-haptics');
        notificationAsync(NotificationFeedbackType.Success);
      }

      // Reset form
      setPaymentMethod('bank_transfer');
      setAmount(invoice.total?.toString() || '0');
      setReferenceNumber('');
      setNotes('');
      setErrors({});
    } catch (error) {
      console.error('Error recording payment:', error);
      Alert.alert('Error', 'Failed to record payment. Please try again.');

      if (Platform.OS === 'ios') {
        const { notificationAsync, NotificationFeedbackType } = require('expo-haptics');
        notificationAsync(NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top || 16 }]}>
          <TouchableOpacity onPress={onClose} disabled={loading}>
            <Text style={styles.headerButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Payment</Text>
          <View style={styles.headerButtonPlaceholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Invoice Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Invoice</Text>
            <Text style={styles.infoValue}>{invoice.invoiceNumber}</Text>
            <View style={styles.infoDivider} />
            <Text style={styles.infoLabel}>Amount Due</Text>
            <Text style={styles.infoValueLarge}>
              ${invoice.total?.toFixed(2) || '0.00'}
            </Text>
          </View>

          {/* Payment Method */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Payment Method *</Text>
            <View style={styles.methodGrid}>
              {PAYMENT_METHOD_OPTIONS.map((method) => (
                <TouchableOpacity
                  key={method.value}
                  style={[
                    styles.methodButton,
                    paymentMethod === method.value && styles.methodButtonActive,
                  ]}
                  onPress={() => setPaymentMethod(method.value)}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.methodButtonText,
                    paymentMethod === method.value && styles.methodButtonTextActive,
                  ]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedMethod && (
              <Text style={styles.fieldHelper}>{selectedMethod.description}</Text>
            )}
          </View>

          {/* Amount */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Amount *</Text>
            <View style={[styles.inputContainer, errors.amount && styles.inputError]}>
              <Text style={styles.inputPrefix}>$</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={(text) => {
                  setAmount(text);
                  if (errors.amount) setErrors({ ...errors, amount: '' });
                }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                editable={!loading}
              />
            </View>
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </View>

          {/* Payment Date */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Payment Date *</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>📅</Text>
              <TextInput
                style={styles.input}
                value={paymentDate}
                onChangeText={setPaymentDate}
                placeholder="YYYY-MM-DD"
                editable={!loading}
              />
            </View>
            <Text style={styles.fieldHelper}>Format: YYYY-MM-DD (e.g., 2025-11-02)</Text>
          </View>

          {/* Reference Number */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              Reference Number {selectedMethod?.requiresReference && '(Recommended)'}
            </Text>
            <View style={[styles.inputContainer, errors.referenceNumber && styles.inputError]}>
              <TextInput
                style={[styles.input, { paddingLeft: 16 }]}
                value={referenceNumber}
                onChangeText={(text) => {
                  setReferenceNumber(text);
                  if (errors.referenceNumber) setErrors({ ...errors, referenceNumber: '' });
                }}
                placeholder="Transaction ID, Check #, etc."
                editable={!loading}
              />
            </View>
            {errors.referenceNumber && <Text style={styles.warningText}>{errors.referenceNumber}</Text>}
          </View>

          {/* Notes */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.textArea}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional payment details..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Payment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount Paid:</Text>
              <Text style={styles.summaryValue}>${parsedAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Remaining Balance:</Text>
              <Text style={[
                styles.summaryValue,
                balanceAfterPayment <= 0 && styles.summaryValueSuccess,
              ]}>
                ${Math.max(0, balanceAfterPayment).toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={[
                styles.statusBadge,
                balanceAfterPayment <= 0 ? styles.statusBadgePaid : styles.statusBadgePartial,
              ]}>
                {balanceAfterPayment <= 0 ? '✓ Paid in Full' : '⏳ Partially Paid'}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom || 16 }]}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>Record Payment</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerButton: {
    fontSize: 28,
    color: '#64748b',
    fontWeight: '300',
    width: 44,
  },
  headerButtonPlaceholder: {
    width: 44,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '600',
    marginBottom: 16,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 16,
  },
  infoValueLarge: {
    fontSize: 32,
    color: '#0f172a',
    fontWeight: '700',
  },
  field: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  fieldHelper: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  methodButtonTextActive: {
    color: '#1e40af',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    height: 52,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
    minHeight: 100,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    marginTop: 6,
  },
  warningText: {
    fontSize: 13,
    color: '#f59e0b',
    marginTop: 6,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  summaryValueSuccess: {
    color: '#10b981',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadgePaid: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusBadgePartial: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  footer: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  submitButton: {
    backgroundColor: '#5B72EE',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#5B72EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
});

