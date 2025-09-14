/**
 * HMR-Safe Auth Context following React best practices
 * - Stable exports for Fast Refresh compatibility
 * - Single responsibility (authentication only)
 * - Memory leak prevention
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { businessProfileService } from '../services/supabaseService';

// Stable interface
interface AuthContextValue {
  readonly user: User | null;
  readonly session: Session | null;
  readonly loading: boolean;
  readonly hasCompletedOnboarding: boolean;
  readonly onboardingChecked: boolean;
  readonly signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any; data?: any; needsEmailConfirmation?: boolean }>;
  readonly signIn: (email: string, password: string) => Promise<{ error: any }>;
  readonly signInWithGoogle: () => Promise<{ error: any }>;
  readonly signOut: () => Promise<void>;
  readonly refreshUser: () => Promise<void>;
  readonly retryOnboardingCheck: () => Promise<void>;
}

// Create context with stable default
const AuthContext = createContext<AuthContextValue | null>(null);
AuthContext.displayName = 'AuthContext';

// Onboarding check function - extracted for reusability
async function checkOnboardingStatus(
  userId: string,
  setHasCompletedOnboarding: (value: boolean) => void,
  setOnboardingChecked: (value: boolean) => void,
  setLastCheckedUserId: (value: string) => void,
  lastCheckedUserId: string | null,
  onboardingChecked: boolean,
  getCachedOnboardingStatus: (userId: string) => any,
  setCachedOnboardingStatus: (userId: string, status: boolean) => void
): Promise<void> {
  // Don't check again if already checked for this specific user
  if (onboardingChecked && lastCheckedUserId === userId) {
    console.log('AuthContext: Onboarding status already checked for this user, skipping...');
    return;
  }

  // Check cache first
  const cached = getCachedOnboardingStatus(userId);
  if (cached && cached.expires > Date.now()) {
    console.log('AuthContext: Using cached onboarding status:', cached.status);
    setHasCompletedOnboarding(cached.status);
    setOnboardingChecked(true);
    setLastCheckedUserId(userId);
    return;
  }
  
  // Prevent multiple simultaneous checks
  if ((checkOnboardingStatus as any).isChecking) {
    console.log('AuthContext: Onboarding check already in progress, skipping...');
    return;
  }
  
  try {
    (checkOnboardingStatus as any).isChecking = true;
    console.log('AuthContext: Starting onboarding check for user:', userId);
    
    // Shorter timeout to prevent hanging on tab focus
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Onboarding check timeout')), 5000);
    });
    
    const businessProfilePromise = businessProfileService.getBusinessProfile();
    
    const businessProfile = await Promise.race([businessProfilePromise, timeoutPromise]);
    console.log('AuthContext: Business profile found:', !!businessProfile);
    
    // Set onboarding status based on business profile
    const isOnboarded = !!businessProfile;
    setHasCompletedOnboarding(isOnboarded);
    setOnboardingChecked(true);
    setLastCheckedUserId(userId);
    
    // Cache the result
    setCachedOnboardingStatus(userId, isOnboarded);
    
    console.log('AuthContext: Onboarding status set to:', isOnboarded);
    
  } catch (error) {
    console.error('AuthContext: Error checking onboarding status:', error);
    // Don't change onboarding status on error - keep current state
    if (!onboardingChecked) {
      setOnboardingChecked(true);
    }
    console.log('AuthContext: Onboarding status check failed, keeping current status');
  } finally {
    (checkOnboardingStatus as any).isChecking = false;
  }
}

// Main provider component - must be a named function for HMR
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [lastCheckedUserId, setLastCheckedUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Add localStorage caching for onboarding status to prevent repeated checks
  const getOnboardingCacheKey = (userId: string) => `onboarding_status_${userId}`;
  const getCachedOnboardingStatus = (userId: string) => {
    try {
      const cached = localStorage.getItem(getOnboardingCacheKey(userId));
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };
  const setCachedOnboardingStatus = (userId: string, status: boolean) => {
    try {
      localStorage.setItem(getOnboardingCacheKey(userId), JSON.stringify({
        status,
        timestamp: Date.now(),
        expires: Date.now() + (5 * 60 * 1000) // Cache for 5 minutes
      }));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Auth functions
  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) {
      setLoading(false);
      return { error };
    }
    
    const needsEmailConfirmation = !data.session && data.user && !data.user.email_confirmed_at;
    setLoading(false);
    return { error: null, data, needsEmailConfirmation };
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshUser = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
    
    if (currentSession?.user?.id) {
      // Only reset onboarding check if it's a different user
      if (lastCheckedUserId !== currentSession.user.id) {
        setOnboardingChecked(false);
        setLastCheckedUserId(null);
      }
      await checkOnboardingStatus(
        currentSession.user.id,
        setHasCompletedOnboarding,
        setOnboardingChecked,
        setLastCheckedUserId,
        lastCheckedUserId,
        onboardingChecked,
        getCachedOnboardingStatus,
        setCachedOnboardingStatus
      );
    }
  };

  const retryOnboardingCheck = async () => {
    if (user?.id) {
      console.log('Retrying onboarding check...');
      setOnboardingChecked(false);
      setLastCheckedUserId(null);
      setHasCompletedOnboarding(false);
      await checkOnboardingStatus(
        user.id,
        setHasCompletedOnboarding,
        setOnboardingChecked,
        setLastCheckedUserId,
        lastCheckedUserId,
        onboardingChecked,
        getCachedOnboardingStatus,
        setCachedOnboardingStatus
      );
    }
  };

  // Single useEffect for auth management
  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;
        
        console.log('Auth state change:', event, !!currentSession?.user);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user?.id) {
          // Only handle specific auth events that require onboarding checks
          if (event === 'SIGNED_IN') {
            console.log('User signed in, checking onboarding status...');
            setOnboardingChecked(false);
            setHasCompletedOnboarding(false);
            await checkOnboardingStatus(
              currentSession.user.id,
              setHasCompletedOnboarding,
              setOnboardingChecked,
              setLastCheckedUserId,
              lastCheckedUserId,
              onboardingChecked,
              getCachedOnboardingStatus,
              setCachedOnboardingStatus
            );
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed - no onboarding check needed');
          } else {
            console.log(`Auth event ${event} - no onboarding check needed`);
          }
        } else {
          console.log('No user session, resetting onboarding status');
          setHasCompletedOnboarding(false);
          setOnboardingChecked(true);
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, redirecting to login');
          setHasCompletedOnboarding(false);
          setOnboardingChecked(false);
          setLastCheckedUserId(null);
          navigate('/login');
        }
      }
    );

    // Check for existing session
    const checkSession = async () => {
      if (!isMounted) return;
      
      try {
        console.log('AuthContext: Starting session check...');
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('AuthContext: Session retrieved:', !!currentSession?.user);
        
        if (!isMounted) return;
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user?.id) {
          console.log('AuthContext: User found, checking onboarding...');
          await checkOnboardingStatus(
            currentSession.user.id,
            setHasCompletedOnboarding,
            setOnboardingChecked,
            setLastCheckedUserId,
            lastCheckedUserId,
            onboardingChecked,
            getCachedOnboardingStatus,
            setCachedOnboardingStatus
          );
        } else {
          console.log('AuthContext: No user, setting defaults...');
          setOnboardingChecked(true);
          setHasCompletedOnboarding(false);
        }
      } catch (error) {
        console.error('AuthContext: Error checking session:', error);
        if (isMounted) {
          setOnboardingChecked(true);
          setHasCompletedOnboarding(false);
        }
      } finally {
        if (isMounted) {
          console.log('AuthContext: Setting loading to false');
          setLoading(false);
        }
      }
    };

    checkSession();

    // Cleanup
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty deps - only run once

  // Memoize context value
  const contextValue = useMemo<AuthContextValue>(() => ({
    user,
    session,
    loading,
    hasCompletedOnboarding,
    onboardingChecked,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshUser,
    retryOnboardingCheck,
  }), [
    user,
    session,
    loading,
    hasCompletedOnboarding,
    onboardingChecked,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Stable hook export
function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Named exports for HMR compatibility
export { AuthProvider, useAuth };
