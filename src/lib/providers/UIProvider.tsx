/**
 * UI State Provider
 * Initializes UI preferences and theme
 */

import React, { useEffect, ReactNode } from 'react';
import { useStore } from '../store';

interface UIProviderProps {
  children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const { loadPreferences } = useStore((state) => ({
    loadPreferences: state.loadPreferences,
  }));

  useEffect(() => {
    // Load UI preferences on app startup
    loadPreferences();
  }, [loadPreferences]);

  return <>{children}</>;
};

export default UIProvider;
