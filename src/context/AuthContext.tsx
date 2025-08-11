
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { businessProfileService } from '../services/supabaseService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any; data?: any; needsEmailConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  hasCompletedOnboarding: boolean;
  onboardingChecked: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const navigate = useNavigate();

  const checkOnboardingStatus = async (userId: string) => {
    // Don't check again if already checked
    if (onboardingChecked) {
      console.log('Onboarding status already checked, skipping...');
      return;
    }
    
    try {
      console.log('Checking onboarding status for user:', userId);
      const businessProfile = await businessProfileService.getBusinessProfile();
      console.log('Business profile found:', !!businessProfile);
      setHasCompletedOnboarding(!!businessProfile);
      setOnboardingChecked(true);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setHasCompletedOnboarding(false);
      setOnboardingChecked(true);
    }
  };

  const refreshUser = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
    
    if (currentSession?.user?.id) {
      // Reset onboarding check to force a fresh check
      setOnboardingChecked(false);
      await checkOnboardingStatus(currentSession.user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Check onboarding status - wait for completion to avoid race conditions
        if (currentSession?.user?.id) {
          await checkOnboardingStatus(currentSession.user.id);
        } else {
          setHasCompletedOnboarding(false);
          setOnboardingChecked(true);
        }
        
        if (event === 'SIGNED_IN') {
          // Don't navigate immediately - let ProtectedRoute handle onboarding check
        } else if (event === 'SIGNED_OUT') {
          setHasCompletedOnboarding(false);
          setOnboardingChecked(false);
          navigate('/login');
        }
      }
    );

    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Check onboarding status asynchronously without blocking loading
        if (currentSession?.user?.id) {
          checkOnboardingStatus(currentSession.user.id).catch(console.error);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    setLoading(false);
    
    // Return additional info about the sign-up result
    return { 
      error, 
      data,
      needsEmailConfirmation: !error && !data.session && data.user && !data.user.email_confirmed_at
    };
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setLoading(false);
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading,
    hasCompletedOnboarding,
    onboardingChecked,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
