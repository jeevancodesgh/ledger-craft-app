import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/context/StableAuthContext";
import { ModernButton } from '@/components/auth/modern/ModernButton';
import { ArrowRight, Home, User } from 'lucide-react';

const AuthSuccess = () => {
  const { user, hasCompletedOnboarding } = useAuth();
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!hasCompletedOnboarding) {
      navigate('/onboarding');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="max-w-md w-full mx-auto p-8 space-y-6 bg-card rounded-xl shadow-lg border">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground">
            Welcome{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}!
          </h1>
          
          <p className="text-muted-foreground">
            You have successfully authenticated with Google. 
            {!hasCompletedOnboarding 
              ? " Let's set up your business profile to get started."
              : " You can now access your dashboard."
            }
          </p>
        </div>

        <div className="space-y-3">
          <ModernButton
            onClick={handleContinue}
            variant="primary"
            size="lg"
            fullWidth
            icon={!hasCompletedOnboarding ? User : Home}
            iconPosition="right"
          >
            {!hasCompletedOnboarding ? 'Complete Setup' : 'Go to Dashboard'}
          </ModernButton>

          <ModernButton
            onClick={() => navigate('/login')}
            variant="outline"
            size="md"
            fullWidth
          >
            Back to Login
          </ModernButton>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Having trouble? Contact support or try signing in again.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthSuccess;
