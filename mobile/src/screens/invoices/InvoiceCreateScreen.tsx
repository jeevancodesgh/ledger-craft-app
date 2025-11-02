import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTabParamList } from '@/navigation/types';
import { invoiceService } from '@/services/invoiceService';
import type { LineItem, Invoice, Customer } from '@/types/invoice';
import { ModernInput } from '@/components/ui/ModernInput';
import { ModernButton } from '@/components/ui/ModernButton';
import InvoicePreviewWithTemplates from '@/components/invoice/InvoicePreviewWithTemplates';
import { shareInvoicePDF } from '@/utils/pdfUtils';
import { CustomerPicker } from '@/components/customers/CustomerPicker';
import { Customer as CustomerType } from '@/services/customerService';
import { ItemPicker } from '@/components/items/ItemPicker';
import { Item } from '@/services/itemService';
import { businessProfileService } from '@/services/businessProfileService';
import type { InvoiceTemplateId } from '@/types/invoiceTemplates';

type InvoiceCreateNavigationProp = NativeStackNavigationProp<AppTabParamList, 'InvoiceCreate'>;
type InvoiceCreateRouteProp = RouteProp<AppTabParamList, 'InvoiceCreate'>;

export default function InvoiceCreateScreen() {
  const navigation = useNavigation<InvoiceCreateNavigationProp>();
  const route = useRoute<InvoiceCreateRouteProp>();

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [currency, setCurrency] = useState('NZD');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [templateName, setTemplateName] = useState<InvoiceTemplateId>('classic');
  
  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit: 'each', rate: 0, total: 0 },
  ]);

  // Calculations
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(15); // Default GST rate for NZ

  // Loading states
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [currentLineItemIndex, setCurrentLineItemIndex] = useState<number | null>(null);
  const [businessProfile, setBusinessProfile] = useState<Awaited<ReturnType<typeof businessProfileService.getBusinessProfile>>>(null);

  // Load invoice number and customers on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [number, customerList, profile] = await Promise.all([
        invoiceService.generateInvoiceNumber(),
        invoiceService.fetchCustomers(),
        businessProfileService.getBusinessProfile(),
      ]);
      
      setInvoiceNumber(number);
      setCustomers(customerList);
      setBusinessProfile(profile);
      
      // Load default payment terms and notes from business profile
      if (profile) {
        if (profile.defaultTerms) {
          setTerms(profile.defaultTerms);
        }
        if (profile.defaultNotes) {
          setNotes(profile.defaultNotes);
        }
        if (profile.defaultTaxRate) {
          setTaxRate(profile.defaultTaxRate);
        }
      }
      
      if (customerList.length > 0) {
        setCustomerId(customerList[0].id);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load initial data');
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Calculate totals whenever line items or tax changes
  useEffect(() => {
    const newSubtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    setSubtotal(newSubtotal);

    const newTaxAmount = taxEnabled ? (newSubtotal * taxRate) / 100 : 0;
    setTaxAmount(newTaxAmount);

    setTotal(newSubtotal + newTaxAmount);
  }, [lineItems, taxEnabled, taxRate]);

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'rate') {
      updated[index].total = updated[index].quantity * updated[index].rate;
    }

    setLineItems(updated);
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: String(lineItems.length + 1),
      description: '',
      quantity: 1,
      unit: 'each',
      rate: 0,
      total: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleSelectItem = (item: Item) => {
    if (currentLineItemIndex !== null) {
      const updated = [...lineItems];
      const currentItem = updated[currentLineItemIndex];
      
      // Update all fields at once
      updated[currentLineItemIndex] = {
        ...currentItem,
        description: item.name,
        rate: item.salePrice || 0,
        unit: item.unit || 'each',
        // Recalculate total
        total: currentItem.quantity * (item.salePrice || 0),
      };
      
      setLineItems(updated);
    }
  };

  const openItemPicker = (index: number) => {
    setCurrentLineItemIndex(index);
    setShowItemPicker(true);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const validateForm = (): boolean => {
    if (!invoiceNumber) {
      Alert.alert('Validation Error', 'Invoice number is required');
      return false;
    }

    if (!customerId) {
      Alert.alert('Validation Error', 'Please select a customer');
      return false;
    }

    const validItems = lineItems.filter(
      (item) => item.description && item.quantity > 0 && item.rate >= 0
    );

    if (validItems.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one line item');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const invoiceData: Partial<Invoice> = {
        invoiceNumber,
        customerId,
        date,
        dueDate,
        subtotal,
        taxAmount,
        total,
        status: 'draft',
        notes,
        terms,
        currency,
        templateName,
      };

      await invoiceService.createInvoice(invoiceData, lineItems);

      Alert.alert('Success', 'Invoice created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating invoice:', error);
      Alert.alert('Error', 'Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Discard Changes?', 'Are you sure you want to discard this invoice?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  const getPreviewInvoice = (): Invoice => {
    const customer = customers.find((c) => c.id === customerId);
    return {
      id: 'preview',
      invoiceNumber,
      customerId,
      customer,
      date,
      dueDate,
      items: lineItems,
      subtotal,
      taxAmount,
      total,
      status: 'draft',
      notes,
      terms,
      currency,
      templateName: 'classic',
    };
  };

  const handleSharePreviewPDF = async () => {
    try {
      setGeneratingPdf(true);
      const previewInvoice = getPreviewInvoice();
      await shareInvoicePDF(previewInvoice);
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert('Error', 'Failed to share PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loadingCustomers) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Invoice</Text>
        </View>

        {/* Invoice Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>

          <ModernInput
            label="Invoice Number"
            value={invoiceNumber}
            onChangeText={setInvoiceNumber}
            placeholder="INV-0001"
          />

          {/* Customer Picker Button */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Customer <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowCustomerPicker(true)}
              style={styles.customerButton}
              activeOpacity={0.7}
            >
              {selectedCustomer ? (
                <View style={styles.selectedCustomerContainer}>
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
                    <Text style={styles.customerName}>{selectedCustomer.name}</Text>
                    {selectedCustomer.email && (
                      <Text style={styles.customerEmail}>{selectedCustomer.email}</Text>
                    )}
                  </View>
                  <Text style={styles.changeText}>Change</Text>
                </View>
              ) : (
                <Text style={styles.placeholderText}>Tap to select customer</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <ModernInput
                label="Date"
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.halfWidth}>
              <ModernInput
                label="Due Date"
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>
        </View>

        {/* Line Items Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Line Items</Text>

          {lineItems.map((item, index) => (
            <View key={item.id} style={styles.lineItemCard}>
              {/* Item Selector Button */}
              <TouchableOpacity
                onPress={() => openItemPicker(index)}
                style={styles.itemSelectorButton}
                activeOpacity={0.7}
              >
                <Text style={styles.itemSelectorLabel}>
                  {item.description || '📦 Tap to select item'}
                </Text>
                <Text style={styles.itemSelectorIcon}>›</Text>
              </TouchableOpacity>

              <ModernInput
                label="Description (or add custom)"
                value={item.description}
                onChangeText={(text) => updateLineItem(index, 'description', text)}
                placeholder="Enter custom description"
              />

              <View style={styles.row}>
                <View style={styles.quarterWidth}>
                  <ModernInput
                    label="Qty"
                    value={String(item.quantity)}
                    onChangeText={(text) => updateLineItem(index, 'quantity', Number(text) || 0)}
                    keyboardType="numeric"
                    placeholder="1"
                  />
                </View>
                <View style={styles.quarterWidth}>
                  <ModernInput
                    label="Rate"
                    value={String(item.rate)}
                    onChangeText={(text) => updateLineItem(index, 'rate', Number(text) || 0)}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{formatCurrency(item.total)}</Text>
                  </View>
                </View>
              </View>

              {lineItems.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeLineItem(index)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <ModernButton onPress={addLineItem} variant="outline" fullWidth>
            + Add Line Item
          </ModernButton>
        </View>

        {/* Totals Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Summary</Text>

          <View style={styles.totalRow}>
            <Text style={styles.totalRowLabel}>Subtotal</Text>
            <Text style={styles.totalRowValue}>{formatCurrency(subtotal)}</Text>
          </View>

          {taxEnabled && (
            <View style={styles.totalRow}>
              <Text style={styles.totalRowLabel}>Tax ({taxRate}%)</Text>
              <Text style={styles.totalRowValue}>{formatCurrency(taxAmount)}</Text>
            </View>
          )}

          <View style={[styles.totalRow, styles.totalRowFinal]}>
            <Text style={styles.totalRowLabelFinal}>Total</Text>
            <Text style={styles.totalRowValueFinal}>{formatCurrency(total)}</Text>
          </View>

          <TouchableOpacity
            style={styles.taxToggle}
            onPress={() => setTaxEnabled(!taxEnabled)}
          >
            <Text style={styles.taxToggleText}>
              {taxEnabled ? '✓ Tax Enabled' : 'Enable Tax'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notes Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Additional Information</Text>

          <ModernInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes..."
            multiline
          />

          <ModernInput
            label="Terms"
            value={terms}
            onChangeText={setTerms}
            placeholder="Payment terms..."
            multiline
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed bottom buttons - Revolut style */}
      <View style={styles.bottomActionsContainer}>
        <View style={styles.bottomActions}>
          {/* Cancel - Secondary */}
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.cancelButton}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          {/* Preview - Outline */}
          <TouchableOpacity
            onPress={() => setShowPreview(true)}
            style={[
              styles.previewButton,
              (!invoiceNumber || !customerId || lineItems.every(item => !item.description)) && styles.buttonDisabled
            ]}
            activeOpacity={0.7}
            disabled={!invoiceNumber || !customerId || lineItems.every(item => !item.description)}
          >
            <Text style={[
              styles.previewButtonText,
              (!invoiceNumber || !customerId || lineItems.every(item => !item.description)) && styles.buttonTextDisabled
            ]}>
              👁️ Preview
            </Text>
          </TouchableOpacity>

          {/* Save - Primary with gradient */}
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, loading && styles.buttonDisabled]}
            activeOpacity={0.7}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>✓ Save Invoice</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Item Picker Modal */}
      <ItemPicker
        visible={showItemPicker}
        onSelect={handleSelectItem}
        onClose={() => {
          setShowItemPicker(false);
          setCurrentLineItemIndex(null);
        }}
      />

      {/* Customer Picker Modal */}
      <CustomerPicker
        visible={showCustomerPicker}
        onSelect={(customer) => {
          setSelectedCustomer(customer);
          setCustomerId(customer.id);
        }}
        onClose={() => setShowCustomerPicker(false)}
        selectedCustomerId={selectedCustomer?.id}
      />

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowPreview(false)}
      >
        <InvoicePreviewWithTemplates
          invoice={getPreviewInvoice()}
          businessProfile={businessProfile || undefined}
          initialTemplate={templateName}
          onClose={() => setShowPreview(false)}
        />
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  quarterWidth: {
    flex: 1,
  },
  lineItemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  totalContainer: {
    flex: 1,
    paddingTop: 24,
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  removeButton: {
    marginTop: 8,
    padding: 8,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalRowLabel: {
    fontSize: 16,
    color: '#64748b',
  },
  totalRowValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  totalRowFinal: {
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
    marginTop: 8,
    paddingTop: 16,
  },
  totalRowLabelFinal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalRowValueFinal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#33415C',
  },
  taxToggle: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  taxToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#33415C',
  },
  bottomActionsContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  previewButton: {
    flex: 1.2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#5B72EE',
  },
  previewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5B72EE',
  },
  saveButton: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#5B72EE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5B72EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextDisabled: {
    opacity: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalHeaderLeft: {
    flex: 1,
  },
  modalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  shareButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#33415C',
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 28,
    color: '#64748b',
    fontWeight: '300',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  customerButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 16,
    minHeight: 60,
    justifyContent: 'center',
  },
  selectedCustomerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 12,
    color: '#64748b',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B72EE',
  },
  placeholderText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  itemSelectorButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemSelectorLabel: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  itemSelectorIcon: {
    fontSize: 20,
    color: '#94a3b8',
    fontWeight: '300',
  },
});

