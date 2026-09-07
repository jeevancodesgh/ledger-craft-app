import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTabParamList } from '@/navigation/types';
import { expenseService } from '@/services/expenseService';
import type { ExpenseCategory, Account, PaymentMethod } from '@/types/expense';
import { ModernInput } from '@/components/ui/ModernInput';
import { ModernButton } from '@/components/ui/ModernButton';
import { CategoryPicker } from '@/components/expense/CategoryPicker';
import { AccountPicker } from '@/components/expense/AccountPicker';
import { CustomerPicker } from '@/components/customers/CustomerPicker';
import { ReceiptScanner } from '@/components/expense/ReceiptScanner';
import { Customer } from '@/services/customerService';
import { ReceiptScanResult } from '@/types/receipt';

type ExpenseCreateNavigationProp = NativeStackNavigationProp<AppTabParamList, 'ExpenseCreate'>;

const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Check', value: 'check' },
  { label: 'Other', value: 'other' },
];

export default function ExpenseCreateScreen() {
  const navigation = useNavigation<ExpenseCreateNavigationProp>();
  
  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [vendorName, setVendorName] = useState('');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('NZD');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isBillable, setIsBillable] = useState(false);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(15); // Default GST rate for NZ
  
  // Selected items
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Picker visibility
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showPaymentMethodPicker, setShowPaymentMethodPicker] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  
  // Receipt state
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  
  // Loading state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Calculated tax
  const amountNum = parseFloat(amount) || 0;
  const taxAmount = taxEnabled ? (amountNum * taxRate) / 100 : 0;
  const totalAmount = amountNum + taxAmount;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!expenseDate) {
      newErrors.expenseDate = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);
      
      const expenseData = {
        description: description.trim(),
        amount: parseFloat(amount),
        expenseDate,
        categoryId: selectedCategory?.id || null,
        accountId: selectedAccount?.id || null,
        vendorName: vendorName.trim() || null,
        receiptUrl,
        status: 'pending' as const,
        isBillable,
        customerId: isBillable && selectedCustomer ? selectedCustomer.id : null,
        taxAmount,
        currency,
        paymentMethod,
        notes: notes.trim() || null,
      };

      await expenseService.createExpense(expenseData);
      
      Alert.alert('Success', 'Expense created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating expense:', error);
      Alert.alert('Error', 'Failed to create expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryDisplay = () => {
    if (selectedCategory) {
      return (
        <View style={styles.selectedItemContainer}>
          <View
            style={[
              styles.colorIndicator,
              { backgroundColor: selectedCategory.color || '#94a3b8' },
            ]}
          />
          <Text style={styles.selectedItemText}>{selectedCategory.name}</Text>
        </View>
      );
    }
    return <Text style={styles.placeholderText}>Tap to select category</Text>;
  };

  const getAccountDisplay = () => {
    if (selectedAccount) {
      const typeIcon = selectedAccount.type === 'bank' ? '🏦' : 
                      selectedAccount.type === 'cash' ? '💵' : 
                      selectedAccount.type === 'credit_card' ? '💳' : '💼';
      return (
        <View style={styles.selectedItemContainer}>
          <Text style={styles.iconText}>{typeIcon}</Text>
          <Text style={styles.selectedItemText}>{selectedAccount.name}</Text>
        </View>
      );
    }
    return <Text style={styles.placeholderText}>Tap to select account</Text>;
  };

  const getCustomerDisplay = () => {
    if (selectedCustomer) {
      return (
        <View style={styles.selectedItemContainer}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerAvatarText}>
              {selectedCustomer.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.selectedItemText}>{selectedCustomer.name}</Text>
            {selectedCustomer.email && (
              <Text style={styles.customerEmail}>{selectedCustomer.email}</Text>
            )}
          </View>
        </View>
      );
    }
    return <Text style={styles.placeholderText}>Tap to select customer</Text>;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Expense Details</Text>

          <ModernInput
            label="Description"
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (errors.description) setErrors({ ...errors, description: '' });
            }}
            placeholder="Enter expense description"
            error={errors.description}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <ModernInput
                label="Amount"
                value={amount}
                onChangeText={(text) => {
                  setAmount(text);
                  if (errors.amount) setErrors({ ...errors, amount: '' });
                }}
                placeholder="0.00"
                keyboardType="decimal-pad"
                error={errors.amount}
              />
            </View>
            <View style={styles.halfWidth}>
              <ModernInput
                label="Currency"
                value={currency}
                onChangeText={setCurrency}
                placeholder="NZD"
              />
            </View>
          </View>

          <ModernInput
            label="Date"
            value={expenseDate}
            onChangeText={(text) => {
              setExpenseDate(text);
              if (errors.expenseDate) setErrors({ ...errors, expenseDate: '' });
            }}
            placeholder="YYYY-MM-DD"
            error={errors.expenseDate}
          />

          <ModernInput
            label="Vendor"
            value={vendorName}
            onChangeText={setVendorName}
            placeholder="Vendor name (optional)"
          />
        </View>

        {/* Category & Account Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Categorization</Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowCategoryPicker(true)}
              style={styles.pickerButton}
              activeOpacity={0.7}
            >
              {getCategoryDisplay()}
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Account</Text>
            <TouchableOpacity
              onPress={() => setShowAccountPicker(true)}
              style={styles.pickerButton}
              activeOpacity={0.7}
            >
              {getAccountDisplay()}
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment & Tax Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment & Tax</Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Payment Method</Text>
            <TouchableOpacity
              onPress={() => setShowPaymentMethodPicker(true)}
              style={styles.pickerButton}
              activeOpacity={0.7}
            >
              {paymentMethod ? (
                <Text style={styles.selectedItemText}>
                  {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label}
                </Text>
              ) : (
                <Text style={styles.placeholderText}>Select payment method</Text>
              )}
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.switchLabel}>Include Tax (GST)</Text>
              <Text style={styles.switchSubtext}>{taxRate}%</Text>
            </View>
            <Switch
              value={taxEnabled}
              onValueChange={setTaxEnabled}
              trackColor={{ false: '#e2e8f0', true: '#5B72EE' }}
              thumbColor="#ffffff"
            />
          </View>

          {taxEnabled && (
            <View style={styles.taxInfo}>
              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>Subtotal:</Text>
                <Text style={styles.taxValue}>${amountNum.toFixed(2)}</Text>
              </View>
              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>Tax ({taxRate}%):</Text>
                <Text style={styles.taxValue}>${taxAmount.toFixed(2)}</Text>
              </View>
              <View style={[styles.taxRow, styles.taxTotal]}>
                <Text style={styles.taxTotalLabel}>Total:</Text>
                <Text style={styles.taxTotalValue}>${totalAmount.toFixed(2)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Billable Expense Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Billable</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.switchLabel}>Mark as Billable</Text>
              <Text style={styles.switchSubtext}>Charge to a customer</Text>
            </View>
            <Switch
              value={isBillable}
              onValueChange={setIsBillable}
              trackColor={{ false: '#e2e8f0', true: '#5B72EE' }}
              thumbColor="#ffffff"
            />
          </View>

          {isBillable && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Customer <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                onPress={() => setShowCustomerPicker(true)}
                style={styles.pickerButton}
                activeOpacity={0.7}
              >
                {getCustomerDisplay()}
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Receipt Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Receipt</Text>
          {receiptUrl ? (
            <View style={styles.receiptContainer}>
              <View style={styles.receiptInfo}>
                <Text style={styles.receiptIcon}>📄</Text>
                <Text style={styles.receiptText}>Receipt attached</Text>
              </View>
              <TouchableOpacity
                onPress={() => setReceiptUrl(null)}
                style={styles.removeReceiptButton}
              >
                <Text style={styles.removeReceiptText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ModernButton
              onPress={() => setShowReceiptScanner(true)}
              variant="outline"
              fullWidth
              icon={<Text style={styles.scanIcon}>📷</Text>}
            >
              Scan Receipt with AI
            </ModernButton>
          )}
        </View>

        {/* Notes Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Additional Information</Text>
          <ModernInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes (optional)"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Submit Button */}
        <ModernButton
          onPress={handleSubmit}
          loading={loading}
          fullWidth
          size="lg"
          style={styles.submitButton}
        >
          Create Expense
        </ModernButton>
      </ScrollView>

      {/* Category Picker */}
      <CategoryPicker
        visible={showCategoryPicker}
        onSelect={(category) => {
          setSelectedCategory(category);
          setShowCategoryPicker(false);
        }}
        onClose={() => setShowCategoryPicker(false)}
        selectedCategoryId={selectedCategory?.id || null}
      />

      {/* Account Picker */}
      <AccountPicker
        visible={showAccountPicker}
        onSelect={(account) => {
          setSelectedAccount(account);
          setShowAccountPicker(false);
        }}
        onClose={() => setShowAccountPicker(false)}
        selectedAccountId={selectedAccount?.id || null}
      />

      {/* Customer Picker */}
      <CustomerPicker
        visible={showCustomerPicker}
        onSelect={(customer) => {
          setSelectedCustomer(customer);
          setShowCustomerPicker(false);
        }}
        onClose={() => setShowCustomerPicker(false)}
        selectedCustomerId={selectedCustomer?.id}
      />

      {/* Payment Method Picker Modal */}
      <Modal
        visible={showPaymentMethodPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaymentMethodPicker(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            <TouchableOpacity
              onPress={() => setShowPaymentMethodPicker(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            <TouchableOpacity
              onPress={() => {
                setPaymentMethod(null);
                setShowPaymentMethodPicker(false);
              }}
              style={[
                styles.methodOption,
                paymentMethod === null && styles.methodOptionSelected,
              ]}
            >
              <Text style={styles.methodOptionText}>None</Text>
              {paymentMethod === null && (
                <Text style={styles.methodOptionCheck}>✓</Text>
              )}
            </TouchableOpacity>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.value}
                onPress={() => {
                  setPaymentMethod(method.value);
                  setShowPaymentMethodPicker(false);
                }}
                style={[
                  styles.methodOption,
                  paymentMethod === method.value && styles.methodOptionSelected,
                ]}
              >
                <Text style={styles.methodOptionText}>{method.label}</Text>
                {paymentMethod === method.value && (
                  <Text style={styles.methodOptionCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Receipt Scanner */}
      <ReceiptScanner
        visible={showReceiptScanner}
        onScanComplete={(result: ReceiptScanResult, receiptUrl?: string) => {
          // Auto-fill form with scanned data
          if (result.merchantName && !vendorName) {
            setVendorName(result.merchantName);
          }
          if (result.total !== null && !amount) {
            setAmount(result.total.toString());
          }
          if (result.date && !expenseDate) {
            setExpenseDate(result.date);
          }
          if (result.tax !== null && result.tax > 0 && !taxEnabled) {
            setTaxEnabled(true);
          }
          if (result.paymentMethod) {
            // Map receipt payment method to form payment method
            const paymentMap: Record<string, PaymentMethod> = {
              'cash': 'cash',
              'card': 'card',
              'other': 'other',
            };
            const mappedMethod = paymentMap[result.paymentMethod];
            if (mappedMethod) {
              setPaymentMethod(mappedMethod);
            }
          }
          if (result.notes && !notes) {
            setNotes(result.notes);
          }
          if (receiptUrl) {
            setReceiptUrl(receiptUrl);
          }
          setShowReceiptScanner(false);
          Alert.alert(
            'Receipt Scanned',
            'Form fields have been auto-filled with the scanned receipt data. Please review and adjust as needed.',
            [{ text: 'OK' }]
          );
        }}
        onClose={() => setShowReceiptScanner(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: '#1E2875',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
    marginRight: 12,
  },
  selectedItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  placeholderText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  changeText: {
    fontSize: 14,
    color: '#5B72EE',
    fontWeight: '600',
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5B72EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  customerInfo: {
    flex: 1,
  },
  customerEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabelContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 4,
  },
  switchSubtext: {
    fontSize: 12,
    color: '#64748B',
  },
  taxInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  taxLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  taxValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  taxTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginTop: 8,
    marginBottom: 0,
  },
  taxTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  taxTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5B72EE',
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B72EE',
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  methodOptionSelected: {
    backgroundColor: '#F8FAFC',
  },
  methodOptionText: {
    fontSize: 16,
    color: '#1E293B',
  },
  methodOptionCheck: {
    fontSize: 16,
    color: '#5B72EE',
    fontWeight: '700',
  },
  receiptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  receiptInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  receiptIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  receiptText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  removeReceiptButton: {
    padding: 8,
  },
  removeReceiptText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  scanIcon: {
    fontSize: 18,
    marginRight: 8,
  },
});

