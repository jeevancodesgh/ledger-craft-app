import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ModernInput } from '@/components/ui/ModernInput';

interface TaxConfigCardProps {
  taxEnabled: boolean;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  onTaxEnabledChange: (enabled: boolean) => void;
  onTaxRateChange: (rate: number) => void;
  formatCurrency: (amount: number) => string;
}

type TaxOption = 'none' | 'gst' | 'custom';

export function TaxConfigCard({
  taxEnabled,
  taxRate,
  subtotal,
  taxAmount,
  total,
  onTaxEnabledChange,
  onTaxRateChange,
  formatCurrency,
}: TaxConfigCardProps) {
  const [taxOption, setTaxOption] = useState<TaxOption>(
    !taxEnabled ? 'none' : taxRate === 15 ? 'gst' : 'custom'
  );
  const [customRate, setCustomRate] = useState(String(taxRate));

  const handleOptionSelect = (option: TaxOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTaxOption(option);

    switch (option) {
      case 'none':
        onTaxEnabledChange(false);
        break;
      case 'gst':
        onTaxEnabledChange(true);
        onTaxRateChange(15);
        break;
      case 'custom':
        onTaxEnabledChange(true);
        const rate = parseFloat(customRate) || 0;
        onTaxRateChange(rate);
        break;
    }
  };

  const handleCustomRateChange = (text: string) => {
    setCustomRate(text);
    const rate = parseFloat(text) || 0;
    if (taxOption === 'custom') {
      onTaxRateChange(rate);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Tax Settings</Text>

      {/* Tax Options */}
      <View style={styles.optionsContainer}>
        {/* No Tax */}
        <TouchableOpacity
          style={[styles.option, taxOption === 'none' && styles.optionSelected]}
          onPress={() => handleOptionSelect('none')}
          activeOpacity={0.7}
        >
          <View style={styles.optionLeft}>
            <View style={[styles.radio, taxOption === 'none' && styles.radioSelected]}>
              {taxOption === 'none' && <View style={styles.radioDot} />}
            </View>
            <Text style={[styles.optionText, taxOption === 'none' && styles.optionTextSelected]}>
              No Tax
            </Text>
          </View>
        </TouchableOpacity>

        {/* GST 15% */}
        <TouchableOpacity
          style={[styles.option, taxOption === 'gst' && styles.optionSelected]}
          onPress={() => handleOptionSelect('gst')}
          activeOpacity={0.7}
        >
          <View style={styles.optionLeft}>
            <View style={[styles.radio, taxOption === 'gst' && styles.radioSelected]}>
              {taxOption === 'gst' && <View style={styles.radioDot} />}
            </View>
            <View>
              <Text style={[styles.optionText, taxOption === 'gst' && styles.optionTextSelected]}>
                GST (15%)
              </Text>
              <Text style={styles.optionSubtext}>New Zealand Goods & Services Tax</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Custom Rate */}
        <TouchableOpacity
          style={[styles.option, taxOption === 'custom' && styles.optionSelected]}
          onPress={() => handleOptionSelect('custom')}
          activeOpacity={0.7}
        >
          <View style={styles.optionLeft}>
            <View style={[styles.radio, taxOption === 'custom' && styles.radioSelected]}>
              {taxOption === 'custom' && <View style={styles.radioDot} />}
            </View>
            <Text style={[styles.optionText, taxOption === 'custom' && styles.optionTextSelected]}>
              Custom Rate
            </Text>
          </View>
          {taxOption === 'custom' && (
            <View style={styles.customRateInput}>
              <ModernInput
                label=""
                value={customRate}
                onChangeText={handleCustomRateChange}
                keyboardType="decimal-pad"
                placeholder="0"
                style={styles.input}
              />
              <Text style={styles.percentSymbol}>%</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
        </View>

        {taxEnabled && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {taxOption === 'gst' ? 'GST' : 'Tax'} ({taxRate}%)
            </Text>
            <Text style={styles.summaryValue}>{formatCurrency(taxAmount)}</Text>
          </View>
        )}

        <View style={[styles.summaryRow, styles.summaryRowTotal]}>
          <Text style={styles.summaryLabelTotal}>Total</Text>
          <Text style={styles.summaryValueTotal}>{formatCurrency(total)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  optionSelected: {
    borderColor: '#5B72EE',
    backgroundColor: '#EEF2FF',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#5B72EE',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5B72EE',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  optionTextSelected: {
    color: '#5B72EE',
  },
  optionSubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  customRateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  input: {
    marginBottom: 0,
  },
  percentSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 4,
  },
  summary: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  summaryRowTotal: {
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
    marginTop: 8,
    paddingTop: 12,
  },
  summaryLabelTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryValueTotal: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5B72EE',
  },
});


