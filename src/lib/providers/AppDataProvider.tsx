/**
 * Application Data Provider
 * Manages data initialization based on auth state
 */

import React, { useEffect, ReactNode } from 'react';
import { useStore } from '../store';

interface AppDataProviderProps {
  children: ReactNode;
}

export const AppDataProvider: React.FC<AppDataProviderProps> = ({ children }) => {
  const { user, loading, initializeData, resetData } = useStore((state) => ({
    user: state.user,
    loading: state.loading,
    initializeData: state.initializeData,
    resetData: state.resetData,
  }));

  useEffect(() => {
    if (!loading && user?.id) {
      // User is authenticated, initialize their data
      initializeData(user.id);
    } else if (!loading && !user) {
      // User is not authenticated, reset data
      resetData();
    }
  }, [user, loading, initializeData, resetData]);

  return <>{children}</>;
};

export default AppDataProvider;
