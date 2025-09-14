import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from "@/context/StableAuthContext";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import ModernAuthLayout from '../components/auth/modern/ModernAuthLayout';
import { ModernButton } from '../components/auth/modern/ModernButton';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_confirmed'>('loading');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      if (type === 'signup' && token) {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          });

          if (error) {
            console.error('Email confirmation error:', error);
            setStatus('error');
            toast({
              title: 'Confirmation Failed',
              description: 'The confirmation link is invalid or has expired.',
              variant: 'destructive'
            });
          } else {
            setStatus('success');
            toast({
              title: 'Email Confirmed!',
              description: 'Your account has been confirmed. Redirecting to setup...'
            });
            
            // Redirect to onboarding after a short delay
            setTimeout(() => {
              navigate('/onboarding', { replace: true });
            }, 2000);
          }
        } catch (error) {
          console.error('Unexpected error during email confirmation:', error);
          setStatus('error');
        }
      } else if (user?.email_confirmed_at) {
        // User is already confirmed
        setStatus('already_confirmed');
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      } else {
        // No token provided or invalid type
        setStatus('error');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate, toast, user]);

  const handleResendConfirmation = async () => {
    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'No email address found. Please try signing up again.',
        variant: 'destructive'
      });
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      });

      if (error) {
        toast({
          title: 'Failed to Resend',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Email Sent',
          description: 'A new confirmation email has been sent to your address.'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend confirmation email. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Confirming your email...</h2>
              <p className="text-muted-foreground">Please wait while we verify your account.</p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Email Confirmed!</h2>
              <p className="text-muted-foreground">
                Your account has been successfully confirmed. You'll be redirected to set up your business profile shortly.
              </p>
            </div>
          </div>
        );

      case 'already_confirmed':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Already Confirmed</h2>
              <p className="text-muted-foreground">
                Your email is already confirmed. Redirecting to your dashboard...
              </p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Confirmation Failed</h2>
                <p className="text-muted-foreground">
                  The confirmation link is invalid or has expired. You can request a new confirmation email or try signing in.
                </p>
              </div>
              
              <div className="space-y-3">
                {user?.email && (
                  <ModernButton
                    onClick={handleResendConfirmation}
                    loading={isResending}
                    variant="primary"
                    icon={Mail}
                  >
                    Resend Confirmation Email
                  </ModernButton>
                )}
                
                <ModernButton
                  onClick={() => navigate('/login')}
                  variant="outline"
                >
                  Back to Sign In
                </ModernButton>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ModernAuthLayout
      title="Email Confirmation"
      subtitle="Verifying your account"
      showFeatures={false}
    >
      {renderContent()}
    </ModernAuthLayout>
  );
};

export default EmailConfirmation;