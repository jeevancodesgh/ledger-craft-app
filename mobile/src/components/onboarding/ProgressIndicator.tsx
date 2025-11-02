import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OnboardingStep } from '@/types/onboarding';

interface ProgressIndicatorProps {
  currentStep: OnboardingStep;
}

const steps = [
  { key: 'welcome' as OnboardingStep, label: 'Business Info', number: 1 },
  { key: 'invoice-setup' as OnboardingStep, label: 'Invoice Setup', number: 2 },
  { key: 'branding' as OnboardingStep, label: 'Branding', number: 3 },
];

export default function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const currentStepIndex = steps.findIndex((step) => step.key === currentStep);

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.key}>
            {/* Step Circle */}
            <View style={styles.stepContainer}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isCurrent && styles.circleCurrent,
                ]}
              >
                {isCompleted ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      isCurrent && styles.stepNumberCurrent,
                    ]}
                  >
                    {step.number}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  (isCompleted || isCurrent) && styles.labelActive,
                ]}
              >
                {step.label}
              </Text>
            </View>

            {/* Connector Line */}
            {!isLast && (
              <View
                style={[
                  styles.connector,
                  isCompleted && styles.connectorCompleted,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  stepContainer: {
    alignItems: 'center',
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  circleCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  circleCurrent: {
    backgroundColor: '#5B72EE',
    borderColor: '#5B72EE',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  stepNumberCurrent: {
    color: '#FFFFFF',
  },
  checkmark: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 80,
  },
  labelActive: {
    color: '#1E293B',
    fontWeight: '600',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
    marginBottom: 32,
  },
  connectorCompleted: {
    backgroundColor: '#10B981',
  },
});

