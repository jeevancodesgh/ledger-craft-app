import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTabParamList } from '@/navigation/types';
import { invoiceService } from '@/services/invoiceService';
import type { Invoice } from '@/types/invoice';
import { ModernButton } from '@/components/ui/ModernButton';
import InvoicePreviewWithTemplates from '@/components/invoice/InvoicePreviewWithTemplates';
import { shareInvoicePDF, downloadInvoicePDF } from '@/utils/pdfUtils';
import { businessProfileService } from '@/services/businessProfileService';
import type { BusinessProfile } from '@/types/invoice';

type InvoiceDetailNavigationProp = NativeStackNavigationProp<any, 'InvoiceDetail'>;
type InvoiceDetailRouteProp = RouteProp<AppTabParamList, 'InvoiceDetail'>;

export default function InvoiceDetailScreen() {
  const navigation = useNavigation<InvoiceDetailNavigationProp>();
  const route = useRoute<InvoiceDetailRouteProp>();
  const { invoiceId } = route.params;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    loadData();
  }, [invoiceId]);

  const loadData = async () => {
    try {
      const [invoiceData, profileData] = await Promise.all([
        invoiceService.fetchInvoiceById(invoiceId),
        businessProfileService.getBusinessProfile(),
      ]);
      setInvoice(invoiceData);
      setBusinessProfile(profileData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load invoice', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoice = async () => {
    try {
      const data = await invoiceService.fetchInvoiceById(invoiceId);
      setInvoice(data);
    } catch (error) {
      console.error('Error loading invoice:', error);
      Alert.alert('Error', 'Failed to load invoice', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#10b981';
      case 'sent':
        return '#3b82f6';
      case 'draft':
        return '#6b7280';
      case 'overdue':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'NZD' ? '$' : currency;
    return `${symbol}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleEdit = () => {
    // @ts-ignore
    navigation.navigate('InvoiceEdit', { invoiceId });
  };

  const handleMarkAsPaid = async () => {
    Alert.alert(
      'Mark as Paid',
      'Are you sure you want to mark this invoice as paid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Paid',
          onPress: async () => {
            try {
              if (!invoice) return;
              await invoiceService.updateInvoice(
                invoiceId,
                { ...invoice, status: 'paid' },
                invoice.items
              );
              Alert.alert('Success', 'Invoice marked as paid');
              loadInvoice();
            } catch (error) {
              console.error('Error updating invoice:', error);
              Alert.alert('Error', 'Failed to update invoice');
            }
          },
        },
      ]
    );
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    try {
      setGeneratingPdf(true);
      await downloadInvoicePDF(invoice);
      Alert.alert('Success', 'PDF saved to your device');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSharePDF = async () => {
    if (!invoice) return;

    try {
      setGeneratingPdf(true);
      await shareInvoicePDF(invoice);
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert('Error', 'Failed to share PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#33415C" />
        <Text style={styles.loadingText}>Loading invoice...</Text>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Invoice not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.invoiceNumber}>{invoice.invoiceNumber || 'N/A'}</Text>
              <Text style={styles.customerName}>{invoice.customer?.name || 'No customer'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
              <Text style={styles.statusText}>{(invoice.status || 'draft').toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>{formatCurrency(invoice.total || 0, invoice.currency || 'NZD')}</Text>
          </View>
        </View>

        {/* Customer Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{invoice.customer?.name || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{invoice.customer?.email || 'N/A'}</Text>
          </View>
          {invoice.customer?.phone && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{invoice.customer.phone}</Text>
            </View>
          )}
          {invoice.customer?.address && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>
                {[
                  invoice.customer.address,
                  invoice.customer.city,
                  invoice.customer.state,
                  invoice.customer.zip,
                  invoice.customer.country,
                ]
                  .filter(Boolean)
                  .join(', ') || 'N/A'}
              </Text>
            </View>
          )}
        </View>

        {/* Invoice Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{invoice.date ? formatDate(invoice.date) : 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Due Date:</Text>
            <Text style={styles.detailValue}>{invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Currency:</Text>
            <Text style={styles.detailValue}>{invoice.currency || 'NZD'}</Text>
          </View>
        </View>

        {/* Line Items Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Line Items</Text>
          {invoice.items.map((item, index) => (
            <View key={item.id || index} style={styles.lineItem}>
              <View style={styles.lineItemHeader}>
                <Text style={styles.lineItemDescription}>{item.description || 'Item'}</Text>
                <Text style={styles.lineItemTotal}>{formatCurrency(item.total || 0, invoice.currency || 'NZD')}</Text>
              </View>
              <Text style={styles.lineItemDetails}>
                {item.quantity || 0} {item.unit || 'unit'} × {formatCurrency(item.rate || 0, invoice.currency || 'NZD')}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(invoice.subtotal || 0, invoice.currency)}</Text>
          </View>
          {(invoice.taxAmount || 0) > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(invoice.taxAmount || 0, invoice.currency)}</Text>
            </View>
          )}
          {(invoice.discount || 0) > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount:</Text>
              <Text style={styles.summaryValue}>-{formatCurrency(invoice.discount || 0, invoice.currency)}</Text>
            </View>
          )}
          {(invoice.additionalCharges || 0) > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Additional Charges:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(invoice.additionalCharges || 0, invoice.currency)}
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.total || 0, invoice.currency)}</Text>
          </View>
        </View>

        {/* Notes Card */}
        {(invoice.notes || invoice.terms) && (
          <View style={styles.card}>
            {invoice.notes && (
              <>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.notesText}>{invoice.notes}</Text>
              </>
            )}
            {invoice.terms && (
              <>
                <Text style={[styles.sectionTitle, invoice.notes && { marginTop: 16 }]}>Terms</Text>
                <Text style={styles.notesText}>{invoice.terms}</Text>
              </>
            )}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed bottom actions */}
      <View style={styles.bottomActions}>
        <View style={styles.buttonRow}>
          <ModernButton 
            onPress={() => setShowPreview(true)} 
            variant="outline" 
            size="sm"
          >
            Preview
          </ModernButton>
          <View style={{ width: 8 }} />
          <ModernButton 
            onPress={handleSharePDF} 
            variant="outline" 
            size="sm"
            loading={generatingPdf}
            disabled={generatingPdf}
          >
            {generatingPdf ? 'Generating...' : 'Share PDF'}
          </ModernButton>
        </View>
        <View style={{ height: 8 }} />
        <View style={styles.buttonRow}>
          <ModernButton onPress={handleEdit} variant="outline" fullWidth>
            Edit
          </ModernButton>
          <View style={{ width: 12 }} />
          {invoice.status !== 'paid' && (
            <ModernButton onPress={handleMarkAsPaid} variant="primary" fullWidth>
              Mark Paid
            </ModernButton>
          )}
        </View>
      </View>

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowPreview(false)}
      >
        {invoice && (
          <InvoicePreviewWithTemplates
            invoice={invoice}
            businessProfile={businessProfile || undefined}
            initialTemplate={(invoice.templateName as any) || 'classic'}
            onClose={() => setShowPreview(false)}
          />
        )}
      </Modal>
    </View>
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
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  invoiceNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  amountContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#33415C',
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
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  lineItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  lineItemDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  lineItemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#33415C',
  },
  lineItemDetails: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#33415C',
  },
  notesText: {
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 20,
  },
  bottomActions: {
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
  buttonRow: {
    flexDirection: 'row',
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeButton: {
    fontSize: 28,
    color: '#64748b',
    fontWeight: '300',
  },
});

