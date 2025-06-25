import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { OnboardingStep } from '../../types';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: OnboardingStep;
  title: string;
  subtitle?: string;
}

const steps = [
  { key: 'welcome', label: 'Business Info', description: 'Basic business details' },
  { key: 'invoice-setup', label: 'Invoice Setup', description: 'Configure invoicing' },
  { key: 'branding', label: 'Branding', description: 'Customize appearance' },
  { key: 'complete', label: 'Complete', description: 'Ready to go!' }
];

export default function OnboardingLayout({ children, currentStep, title, subtitle }: OnboardingLayoutProps) {
  const currentStepIndex = steps.findIndex(step => step.key === currentStep);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Ledger Craft</h1>
          <p className="text-muted-foreground">Let's set up your business profile to get you started</p>
        </div>

        {/* Progress Indicator */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isUpcoming = index > currentStepIndex;

              return (
                <div key={step.key} className="flex items-center flex-1">
                  {/* Step Circle */}
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      isCompleted 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : isCurrent 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'bg-background border-border text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div className={`text-sm font-medium ${
                        isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 max-w-24">
                        {step.description}
                      </div>
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-border'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-lg shadow-lg border p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-card-foreground mb-2">{title}</h2>
              {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
            </div>
            
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-muted-foreground text-sm">
          <p>You can always update these settings later in your business profile.</p>
        </div>
      </div>
    </div>
  );
}