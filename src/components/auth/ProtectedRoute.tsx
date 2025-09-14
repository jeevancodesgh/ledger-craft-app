
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/StableAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireOnboarding = true }) => {
  const { user, loading, hasCompletedOnboarding, onboardingChecked, retryOnboardingCheck } = useAuth();
  const location = useLocation();

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('ProtectedRoute:', { 
      user: !!user, 
      userId: user?.id,
      loading, 
      hasCompletedOnboarding, 
      onboardingChecked, 
      requireOnboarding, 
      path: location.pathname,
      willShowLoading: loading || (user && !onboardingChecked)
    });
  }

  // If still loading authentication state or onboarding status, show a loading indicator
  if (loading || (user && !onboardingChecked)) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Loading your workspace</h2>
            <p className="text-muted-foreground">Please wait while we prepare everything for you...</p>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login page
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but onboarding is required and not completed, redirect to onboarding
  if (requireOnboarding && !hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // If accessing onboarding page but already completed, redirect to dashboard
  if (!requireOnboarding && hasCompletedOnboarding && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  // If authenticated and onboarding requirements met, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
