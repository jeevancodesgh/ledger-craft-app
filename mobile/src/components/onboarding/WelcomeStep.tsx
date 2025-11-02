import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { OnboardingStepProps } from '@/types/onboarding';
import CountryPicker from './CountryPicker';

export default function WelcomeStep({
  data,
  onDataChange,
  onNext,
  isLoading,
}: OnboardingStepProps) {
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [errors, setErrors] = useState<{
    businessName?: string;
    businessEmail?: string;
    country?: string;
  }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!data.businessName || data.businessName.trim().length < 2) {
      newErrors.businessName = 'Business name must be at least 2 characters';
    }

    if (!data.businessEmail || !validateEmail(data.businessEmail)) {
      newErrors.businessEmail = 'Please enter a valid email address';
    }

    if (!data.country) {
      newErrors.country = 'Please select a country';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const isValid =
    data.businessName.trim().length >= 2 &&
    validateEmail(data.businessEmail) &&
    data.country !== '';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🏢</Text>
      </View>

      {/* Header */}
      <Text style={styles.headerText}>
        Tell us about your business so we can customize your invoice templates
        and settings.
      </Text>

      {/* Form */}
      <View style={styles.form}>
        {/* Business Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Business Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.businessName && styles.inputError]}
            placeholder="Enter your business name"
            value={data.businessName}
            onChangeText={(text) => {
              onDataChange({ businessName: text });
              if (errors.businessName) {
                setErrors({ ...errors, businessName: undefined });
              }
            }}
            placeholderTextColor="#94A3B8"
          />
          {errors.businessName && (
            <Text style={styles.errorText}>{errors.businessName}</Text>
          )}
        </View>

        {/* Business Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Business Email <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.businessEmail && styles.inputError]}
            placeholder="business@example.com"
            value={data.businessEmail}
            onChangeText={(text) => {
              onDataChange({ businessEmail: text });
              if (errors.businessEmail) {
                setErrors({ ...errors, businessEmail: undefined });
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#94A3B8"
          />
          {errors.businessEmail && (
            <Text style={styles.errorText}>{errors.businessEmail}</Text>
          )}
        </View>

        {/* Country */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Country <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.pickerButton, errors.country && styles.inputError]}
            onPress={() => setShowCountryPicker(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.pickerButtonText,
                !data.country && styles.placeholderText,
              ]}
            >
              {data.country || 'Select your country'}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          {errors.country && (
            <Text style={styles.errorText}>{errors.country}</Text>
          )}
        </View>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>💡</Text>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Why we need this information</Text>
          <Text style={styles.infoText}>
            We'll use these details to customize your invoices and ensure
            compliance with local regulations.
          </Text>
        </View>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={[styles.continueButton, !isValid && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!isValid || isLoading}
        activeOpacity={0.8}
      >
        <Text style={styles.continueButtonText}>
          {isLoading ? 'Loading...' : 'Continue'}
        </Text>
      </TouchableOpacity>

      {/* Country Picker Modal */}
      <CountryPicker
        visible={showCountryPicker}
        onSelect={(country) => {
          onDataChange({ country });
          if (errors.country) {
            setErrors({ ...errors, country: undefined });
          }
        }}
        onClose={() => setShowCountryPicker(false)}
        selectedCountry={data.country}
      />
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
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
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
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  pickerButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1E293B',
  },
  placeholderText: {
    color: '#94A3B8',
  },
  chevron: {
    fontSize: 24,
    color: '#64748B',
    fontWeight: '300',
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
  continueButton: {
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
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

