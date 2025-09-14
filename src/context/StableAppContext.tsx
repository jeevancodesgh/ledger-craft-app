/**
 * HMR-Safe App Context following React best practices
 * - Stable exports for Fast Refresh compatibility
 * - Minimal responsibility (only initialization)
 * - No complex state management
 */

import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useAuth } from "@/context/StableAuthContext";
import { solidDataManager } from "@/services/DataManagerSOLID";
import { conversationManager } from "@/services/conversationManager";

// Simple, stable interface
interface AppContextValue {
  readonly initialized: boolean;
}

// Create context with stable default value
const AppContext = createContext<AppContextValue>({
  initialized: false
});

// Stable display name for debugging
AppContext.displayName = 'AppContext';

// Main provider component - must be a named function for HMR
function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Single useEffect with minimal dependencies
  useEffect(() => {
    if (!loading && user) {
      // Initialize managers for this user
      solidDataManager.initialize(user.id);
      conversationManager.initialize(user.id);
    } else if (!loading && !user) {
      // Reset managers when user logs out
      solidDataManager.reset();
      conversationManager.reset();
    }
  }, [user, loading]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AppContextValue>(() => ({
    initialized: !loading
  }), [loading]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Stable hook export - must be a named function for HMR
function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}

// Named exports for HMR compatibility
export { AppProvider, useAppContext };
