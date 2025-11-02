/**
 * Authentication Slice - Mobile adapted version
 * Reuses same logic from web app but with mobile-specific storage
 */

import { StateCreator } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabaseClient';
import * as Linking from 'expo-linking';

// Module-level flag to ensure listener is only set up once
let authListenerInitialized = false;

export interface AuthSlice {
  // State
  user: User | null;
  session: Session | null;
  loading: boolean;
  hasCompletedOnboarding: boolean;
  onboardingChecked: boolean;
  error: string | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any; data?: any; needsEmailConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkOnboardingStatus: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Internal state updaters
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboardingStatus: (completed: boolean, checked: boolean) => void;
  setError: (error: string | null) => void;
  
  // Auth event handlers
  handleAuthStateChange: (event: string, session: Session | null) => void;
  initialize: () => Promise<void>;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  // Initial state
  user: null,
  session: null,
  loading: true,
  hasCompletedOnboarding: false,
  onboardingChecked: false,
  error: null,

  // Actions
  signIn: async (email: string, password: string) => {
    set({
      loading: true,
      error: null,
    });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({
        loading: false,
        error: error.message,
      });
    }

    return { error };
  },

  signUp: async (email: string, password: string, fullName?: string) => {
    set({
      loading: true,
      error: null,
    });

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
      set({
        loading: false,
        error: error.message,
      });
      return { error };
    }

    const needsEmailConfirmation = !data.session && data.user && !data.user.email_confirmed_at;

    if (!needsEmailConfirmation) {
      set({ loading: false });
    }

    return { error: null, data, needsEmailConfirmation };
  },

  signInWithGoogle: async () => {
    set({
      loading: true,
      error: null,
    });

    const redirectUrl = Linking.createURL('/auth/callback');
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      set({
        loading: false,
        error: error.message,
      });
    }

    return { error };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      session: null,
      hasCompletedOnboarding: false,
      onboardingChecked: false,
      error: null,
    });
  },

  checkOnboardingStatus: async () => {
    const { user } = get();
    if (!user) return;

    try {
      // Check if business profile exists (indicates onboarding is complete)
      const { data: businessProfile, error } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const hasCompleted = !error && !!businessProfile;
      
      set({
        hasCompletedOnboarding: hasCompleted,
        onboardingChecked: true,
        loading: false,
      });
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      set({
        hasCompletedOnboarding: false,
        onboardingChecked: true,
        loading: false,
      });
    }
  },

  refreshUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    set({ user: user || null });
  },

  // Internal state updaters
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setOnboardingStatus: (completed, checked) => set({ hasCompletedOnboarding: completed, onboardingChecked: checked }),
  setError: (error) => set({ error }),

  // Auth event handlers
  handleAuthStateChange: async (event: string, session: Session | null) => {
    console.log('[AuthSlice] state change', event, {
      hasSession: !!session,
      token: session?.access_token?.slice?.(0, 6),
    });
    
    const currentState = get();
    
    // Prevent duplicate updates
    if (event === 'INITIAL_SESSION' && currentState.session?.access_token === session?.access_token) {
      return;
    }
    
    set({
      session,
      user: session?.user ?? null,
    });

    if (event === 'SIGNED_IN' && session?.user) {
      set({
        loading: false,
        onboardingChecked: false,
        hasCompletedOnboarding: false,
      });
      await get().checkOnboardingStatus();
    } else if (event === 'SIGNED_OUT') {
      set({
        user: null,
        session: null,
        hasCompletedOnboarding: false,
        onboardingChecked: false,
        loading: false,
        error: null,
      });
    } else if (event === 'TOKEN_REFRESHED') {
      set({ loading: false });
    } else if (event === 'INITIAL_SESSION' && session?.user) {
      // Handle initial session - check onboarding without resetting state
      set({ loading: false });
      await get().checkOnboardingStatus();
    } else if (event === 'INITIAL_SESSION' && !session) {
      // No session on init
      set({
        loading: false,
        onboardingChecked: true,
      });
    }
  },

  // Initialize auth listener
  initialize: async () => {
    // Set up auth state listener (only once across all instances)
    if (!authListenerInitialized) {
      authListenerInitialized = true;
      console.log('[AuthSlice] registering auth listener');
      supabase.auth.onAuthStateChange(async (event, session) => {
        // Skip INITIAL_SESSION events from listener (we handle it manually)
        if (event !== 'INITIAL_SESSION') {
          console.log('[AuthSlice] listener event', event);
          await get().handleAuthStateChange(event, session);
        }
      });
    }

    // Check current session
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[AuthSlice] getSession result', !!session);
      if (session) {
        await get().handleAuthStateChange('INITIAL_SESSION', session);
      } else {
        set({
          loading: false,
          onboardingChecked: true,
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({
        loading: false,
        error: 'Failed to initialize authentication',
      });
    }
  },
});

