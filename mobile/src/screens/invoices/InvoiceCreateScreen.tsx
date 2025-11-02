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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTabParamList } from '@/navigation/types';
import { invoiceService } from '@/services/invoiceService';
import type { LineItem, Invoice, Customer } from '@/types/invoice';
import { ModernInput } from '@/components/ui/ModernInput';
import { ModernButton } from '@/components/ui/ModernButton';
import InvoicePreview from '@/components/invoice/InvoicePreview';
import { shareInvoicePDF } from '@/utils/pdfUtils';

type InvoiceCreateNavigationProp = NativeStackNavigationProp<AppTabParamList, 'InvoiceCreate'>;
type InvoiceCreateRouteProp = RouteProp<AppTabParamList, 'InvoiceCreate'>;

export default function InvoiceCreateScreen() {
  const navigation = useNavigation<InvoiceCreateNavigationProp>();
  const route = useRoute<InvoiceCreateRouteProp>();

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [currency, setCurrency] = useState('NZD');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  
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

  // Load invoice number and customers on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [number, customerList] = await Promise.all([
        invoiceService.generateInvoiceNumber(),
        invoiceService.fetchCustomers(),
      ]);
      
      setInvoiceNumber(number);
      setCustomers(customerList);
      
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
        templateName: 'classic',
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

          <ModernInput
            label="Customer"
            value={customers.find((c) => c.id === customerId)?.name || ''}
            onChangeText={() => {}}
            placeholder="Select customer"
            editable={false}
          />

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
              <ModernInput
                label="Description"
                value={item.description}
                onChangeText={(text) => updateLineItem(index, 'description', text)}
                placeholder="Item description"
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

      {/* Fixed bottom buttons */}
      <View style={styles.bottomActions}>
        <ModernButton onPress={handleCancel} variant="outline" fullWidth>
          Cancel
        </ModernButton>
        <View style={{ width: 12 }} />
        <ModernButton 
          onPress={() => setShowPreview(true)} 
          variant="outline" 
          fullWidth
          disabled={!invoiceNumber || !customerId || lineItems.every(item => !item.description)}
        >
          Preview
        </ModernButton>
        <View style={{ width: 12 }} />
        <ModernButton onPress={handleSave} variant="primary" fullWidth loading={loading}>
          {loading ? 'Saving...' : 'Save Invoice'}
        </ModernButton>
      </View>

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <Text style={styles.modalTitle}>Invoice Preview</Text>
            </View>
            <View style={styles.modalHeaderRight}>
              <TouchableOpacity 
                onPress={handleSharePreviewPDF}
                disabled={generatingPdf}
                style={styles.shareButton}
              >
                <Text style={styles.shareButtonText}>
                  {generatingPdf ? 'Generating...' : 'Share PDF'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPreview(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
          <InvoicePreview invoice={getPreviewInvoice()} />
        </View>
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
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
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
});

