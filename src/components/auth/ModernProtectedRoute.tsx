/**
 * Modern Protected Route Component
 * Uses new architecture with clean separation of concerns
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthGuard } from '@/lib/hooks/useAuthGuard';
import { LoadingScreen } from '@/components/common/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireOnboarding = true 
}) => {
  const location = useLocation();
  const { isAuthenticated, isOnboarded, isLoading, canAccess } = useAuthGuard({
    requireAuth: true,
    requireOnboarding,
  });

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen message="Loading your workspace..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to onboarding if required and not completed
  if (requireOnboarding && !isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect away from onboarding if already completed
  if (!requireOnboarding && isOnboarded && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  // Render protected content
  if (canAccess) {
    return <>{children}</>;
  }

  // Fallback loading state
  return <LoadingScreen />;
};

export default ProtectedRoute;
