import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          toast({
            title: 'Authentication Failed',
            description: error.message,
            variant: 'destructive'
          });
          navigate('/login');
          return;
        }

        if (data.session) {
          // Check if this is a new user by looking at metadata
          const user = data.session.user;
          const isNewUser = user.user_metadata?.iss && 
                           new Date(user.created_at).getTime() > (Date.now() - 60000); // Created in last minute
          
          // Refresh the auth context
          await refreshUser();
          
          if (isNewUser) {
            toast({
              title: 'Welcome to EasyBizInvoice!',
              description: 'Your account has been created. Let\'s set up your business profile.'
            });
            navigate('/onboarding', { replace: true });
          } else {
            toast({
              title: 'Welcome back!',
              description: 'You have been successfully logged in with Google.'
            });
            
            // Navigate to dashboard or intended destination
            const urlParams = new URLSearchParams(window.location.search);
            const next = urlParams.get('next') || '/';
            navigate(next, { replace: true });
          }
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        toast({
          title: 'Authentication Error',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'destructive'
        });
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate, toast, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <h2 className="text-xl font-semibold text-foreground">
          Completing your sign in...
        </h2>
        <p className="text-muted-foreground">
          Please wait while we redirect you.
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
