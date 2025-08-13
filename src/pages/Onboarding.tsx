import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { OnboardingStep, OnboardingData, DEFAULT_BUSINESS_THEME } from '../types';
import { useAuth } from '../context/AuthContext';
import { businessProfileService } from '../services/supabaseService';
import { supabase } from '@/integrations/supabase/client';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import WelcomeStep from '../components/onboarding/WelcomeStep';
import InvoiceSetupStep from '../components/onboarding/InvoiceSetupStep';
import BrandingStep from '../components/onboarding/BrandingStep';

const stepTitles: Record<OnboardingStep, { title: string; subtitle?: string }> = {
  welcome: {
    title: 'Tell us about your business',
    subtitle: 'We need some basic information to get you started'
  },
  'invoice-setup': {
    title: 'Configure your invoices',
    subtitle: 'Set up professional invoice defaults'
  },
  branding: {
    title: 'Make it yours',
    subtitle: 'Add your logo and choose your brand colors'
  },
  complete: {
    title: 'All set!',
    subtitle: 'Welcome to EasyBizInvoice'
  }
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    businessName: '',
    businessEmail: user?.email || '',
    country: 'New Zealand',
    theme: DEFAULT_BUSINESS_THEME
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...updates }));
  };

  const uploadLogo = async (logoFile: File): Promise<string | null> => {
    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `business-logo-${Date.now()}.${fileExt}`;
      const filePath = `business-logos/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business-assets')
        .upload(filePath, logoFile);

      if (uploadError) {
        throw new Error(uploadError.message || "Failed to upload logo");
      }

      if (uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('business-assets')
          .getPublicUrl(filePath);
          
        return publicUrlData.publicUrl;
      }
      
      return null;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Logo Upload Failed',
        description: 'Failed to upload logo. Please try again.',
        variant: 'destructive'
      });
      return null;
    }
  };

  const completeOnboarding = async () => {
    if (!user?.id) {
      toast({
        title: 'Authentication Error',
        description: 'Please try logging in again.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Upload logo if provided
      let logoUrl: string | null = null;
      if (onboardingData.logoFile) {
        logoUrl = await uploadLogo(onboardingData.logoFile);
      }

      // Create business profile
      const businessProfileData = {
        name: onboardingData.businessName,
        email: onboardingData.businessEmail,
        country: onboardingData.country,
        address: onboardingData.address || null,
        city: onboardingData.city || null,
        state: onboardingData.state || null,
        zip: onboardingData.zip || null,
        defaultTaxRate: onboardingData.defaultTaxRate || null,
        invoiceNumberFormat: onboardingData.invoiceNumberFormat || 'INV-{YYYY}-{SEQ}',
        invoiceNumberSequence: 1,
        theme: onboardingData.theme || DEFAULT_BUSINESS_THEME,
        logoUrl,
        userId: user.id
      };

      await businessProfileService.createOrUpdateBusinessProfile(businessProfileData);
      
      // Refresh user data to update onboarding status
      await refreshUser();
      
      toast({
        title: 'Welcome to EasyBizInvoice!',
        description: 'Your business profile has been set up successfully.'
      });
      
      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Setup Failed',
        description: 'Failed to complete setup. Please try again.',
        variant: 'destructive'
      });
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
      isLoading
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

  return (
    <OnboardingLayout
      currentStep={currentStep}
      title={stepTitles[currentStep].title}
      subtitle={stepTitles[currentStep].subtitle}
    >
      {renderStep()}
    </OnboardingLayout>
  );
}