/**
 * Modern Authentication Provider
 * Uses Zustand store for state management
 * Single responsibility: Initialize and manage auth state
 */

import React, { useEffect, ReactNode } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { initialize } = useStore((state) => ({
    initialize: state.initialize,
  }));

  useEffect(() => {
    // Initialize authentication on app startup
    initialize();
  }, [initialize]);

  return <>{children}</>;
};

export default AuthProvider;
