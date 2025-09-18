/**
 * Authentication Guard Hook
 * Provides clean interface for route protection
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store';

interface UseAuthGuardOptions {
  requireAuth?: boolean;
  requireOnboarding?: boolean;
  redirectTo?: string;
}

export const useAuthGuard = (options: UseAuthGuardOptions = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    user, 
    loading, 
    hasCompletedOnboarding, 
    onboardingChecked 
  } = useAuth();

  const {
    requireAuth = true,
    requireOnboarding = true,
    redirectTo
  } = options;

  useEffect(() => {
    // Don't do anything while still loading
    if (loading || (user && !onboardingChecked)) {
      return;
    }

    // Check authentication requirement
    if (requireAuth && !user) {
      navigate('/login', { 
        state: { from: location }, 
        replace: true 
      });
      return;
    }

    // Check onboarding requirement
    if (requireAuth && user && requireOnboarding && !hasCompletedOnboarding) {
      navigate('/onboarding', { replace: true });
      return;
    }

    // Handle redirect after successful auth
    if (redirectTo && user && (!requireOnboarding || hasCompletedOnboarding)) {
      navigate(redirectTo, { replace: true });
      return;
    }

    // Prevent access to onboarding if already completed
    if (user && hasCompletedOnboarding && location.pathname === '/onboarding') {
      navigate('/', { replace: true });
      return;
    }

  }, [
    user, 
    loading, 
    hasCompletedOnboarding, 
    onboardingChecked,
    requireAuth, 
    requireOnboarding, 
    redirectTo,
    navigate, 
    location
  ]);

  return {
    isAuthenticated: !!user,
    isOnboarded: hasCompletedOnboarding,
    isLoading: loading || (user && !onboardingChecked),
    canAccess: !loading && (!requireAuth || user) && (!requireOnboarding || hasCompletedOnboarding),
  };
};
