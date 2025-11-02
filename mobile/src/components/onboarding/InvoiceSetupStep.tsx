import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { OnboardingStepProps, INVOICE_FORMATS } from '@/types/onboarding';

export default function InvoiceSetupStep({
  data,
  onDataChange,
  onNext,
  onBack,
  isLoading,
}: OnboardingStepProps) {
  const [showAddressFields, setShowAddressFields] = useState(
    !!(data.address || data.city || data.state || data.zip)
  );

  const handleNext = () => {
    onNext();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>📋</Text>
      </View>

      {/* Header */}
      <Text style={styles.headerText}>
        Set up your invoice preferences to ensure professional, consistent
        billing.
      </Text>

      {/* Invoice Number Format */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invoice Number Format</Text>
        <Text style={styles.sectionSubtitle}>
          Choose how you want your invoice numbers to be formatted
        </Text>

        {INVOICE_FORMATS.map((format) => (
          <TouchableOpacity
            key={format.value}
            style={[
              styles.formatCard,
              data.invoiceNumberFormat === format.value &&
                styles.formatCardSelected,
            ]}
            onPress={() => onDataChange({ invoiceNumberFormat: format.value })}
            activeOpacity={0.7}
          >
            <View style={styles.radioOuter}>
              {data.invoiceNumberFormat === format.value && (
                <View style={styles.radioInner} />
              )}
            </View>
            <View style={styles.formatInfo}>
              <Text style={styles.formatLabel}>{format.label}</Text>
              <Text style={styles.formatDescription}>
                {format.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Default Tax Rate */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Tax Rate (%)</Text>
        <Text style={styles.sectionSubtitle}>
          This will be pre-filled for new invoices (optional)
        </Text>
        <View style={styles.taxInputContainer}>
          <Text style={styles.percentIcon}>%</Text>
          <TextInput
            style={styles.taxInput}
            placeholder="15.0"
            value={data.defaultTaxRate?.toString() || ''}
            onChangeText={(text) => {
              const value = parseFloat(text);
              onDataChange({
                defaultTaxRate: isNaN(value) ? undefined : value,
              });
            }}
            keyboardType="decimal-pad"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      {/* Business Address */}
      <View style={styles.section}>
        <View style={styles.addressHeader}>
          <View>
            <Text style={styles.sectionTitle}>Business Address</Text>
            <Text style={styles.sectionSubtitle}>
              Adds professionalism to your invoices (optional)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowAddressFields(!showAddressFields)}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleButtonText}>
              {showAddressFields ? 'Hide' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>

        {showAddressFields && (
          <View style={styles.addressFields}>
            {/* Street Address */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Street Address</Text>
              <TextInput
                style={styles.input}
                placeholder="123 Business Street"
                value={data.address || ''}
                onChangeText={(text) => onDataChange({ address: text })}
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* City & State */}
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.flex1]}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Wellington"
                  value={data.city || ''}
                  onChangeText={(text) => onDataChange({ city: text })}
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.spacer} />
              <View style={[styles.inputContainer, styles.flex1]}>
                <Text style={styles.label}>State/Region</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Wellington"
                  value={data.state || ''}
                  onChangeText={(text) => onDataChange({ state: text })}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* ZIP/Postal Code */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>ZIP/Postal Code</Text>
              <TextInput
                style={styles.input}
                placeholder="6011"
                value={data.zip || ''}
                onChangeText={(text) => onDataChange({ zip: text })}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        )}
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>💡</Text>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Pro Tip</Text>
          <Text style={styles.infoText}>
            Consistent invoice numbering helps with organization and tracking.
            You can always update these settings later.
          </Text>
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleNext}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {isLoading ? 'Loading...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 64,
  },
  headerText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  formatCardSelected: {
    borderColor: '#5B72EE',
    backgroundColor: '#EEF2FF',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5B72EE',
  },
  formatInfo: {
    flex: 1,
  },
  formatLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  formatDescription: {
    fontSize: 13,
    color: '#64748B',
  },
  taxInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  percentIcon: {
    fontSize: 18,
    color: '#64748B',
    marginRight: 8,
  },
  taxInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  toggleButton: {
    backgroundColor: '#5B72EE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addressFields: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  spacer: {
    width: 12,
  },
  infoBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 32,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  continueButton: {
    flex: 2,
    backgroundColor: '#5B72EE',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5B72EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

