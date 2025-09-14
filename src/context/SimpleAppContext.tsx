/**
 * Simplified AppContext - Only handles user initialization
 * No data fetching, no complex state management
 */

import React, { createContext, useContext, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { dataManager } from "@/services/dataManager";
import { conversationManager } from "@/services/conversationManager";

interface SimpleAppContextType {
  // This context only provides initialization
  // All data access should use useAppData hook
  initialized: boolean;
}

const SimpleAppContext = createContext<SimpleAppContextType | undefined>(undefined);

export const SimpleAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // Initialize both data and conversation managers for this user
      dataManager.initialize(user.id);
      conversationManager.initialize(user.id);
    } else if (!loading && !user) {
      // Reset both managers when user logs out
      dataManager.reset();
      conversationManager.reset();
    }
  }, [user, loading]);

  return (
    <SimpleAppContext.Provider value={{ initialized: !loading }}>
      {children}
    </SimpleAppContext.Provider>
  );
};

export const useSimpleAppContext = () => {
  const context = useContext(SimpleAppContext);
  if (context === undefined) {
    throw new Error("useSimpleAppContext must be used within a SimpleAppProvider");
  }
  return context;
};
