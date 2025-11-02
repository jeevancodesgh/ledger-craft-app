import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  OnboardingStep,
  OnboardingData,
  DEFAULT_THEME,
} from '@/types/onboarding';
import { businessProfileService } from '@/services/businessProfileService';
import { useAuth } from '@/store';
import ProgressIndicator from '@/components/onboarding/ProgressIndicator';
import WelcomeStep from '@/components/onboarding/WelcomeStep';
import InvoiceSetupStep from '@/components/onboarding/InvoiceSetupStep';
import BrandingStep from '@/components/onboarding/BrandingStep';

export default function OnboardingScreen() {
  const { checkOnboardingStatus } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    businessName: '',
    businessEmail: '',
    country: '',
    invoiceNumberFormat: 'INV-{YYYY}-{SEQ}',
    defaultTaxRate: undefined,
    address: '',
    city: '',
    state: '',
    zip: '',
    theme: DEFAULT_THEME,
    logoUri: undefined,
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setOnboardingData((prev) => ({ ...prev, ...updates }));
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      // Save business profile to Supabase
      await businessProfileService.createBusinessProfile(onboardingData);

      // Update auth state - this will trigger automatic navigation
      await checkOnboardingStatus();

      // Show success message
      Alert.alert(
        'Setup Complete! 🎉',
        'Your business profile has been created successfully.',
        [{ text: 'Get Started' }]
      );
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert(
        'Error',
        'Failed to complete setup. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 'welcome') {
      setCurrentStep('invoice-setup');
    } else if (currentStep === 'invoice-setup') {
      setCurrentStep('branding');
    } else if (currentStep === 'branding') {
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep === 'invoice-setup') {
      setCurrentStep('welcome');
    } else if (currentStep === 'branding') {
      setCurrentStep('invoice-setup');
    }
  };

  const renderStep = () => {
    const stepProps = {
      data: onboardingData,
      onDataChange: updateData,
      onNext: handleNext,
      onBack: currentStep !== 'welcome' ? handleBack : undefined,
      isLoading,
    };

    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep {...stepProps} />;
      case 'invoice-setup':
        return <InvoiceSetupStep {...stepProps} />;
      case 'branding':
        return <BrandingStep {...stepProps} />;
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'welcome':
        return 'Tell us about your business';
      case 'invoice-setup':
        return 'Configure your invoices';
      case 'branding':
        return 'Make it yours';
      default:
        return '';
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 'welcome':
        return 'We need some basic information to get you started';
      case 'invoice-setup':
        return 'Set up professional invoice defaults';
      case 'branding':
        return 'Add your logo and choose your brand colors';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>Welcome to LedgerCraft</Text>
          <Text style={styles.appSubtitle}>
            Let's set up your business profile
          </Text>
        </View>

        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} />

        {/* Step Content Card */}
        <View style={styles.contentCard}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>{getStepTitle()}</Text>
            <Text style={styles.stepSubtitle}>{getStepSubtitle()}</Text>
          </View>

          <View style={styles.stepContent}>{renderStep()}</View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            You can always update these settings later in your profile
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  stepHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  footer: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
