/**
 * Simple React hook for accessing stable conversation data
 * This hook is HMR-safe and performance-optimized
 */

import { useState, useEffect } from 'react';
import { conversationManager } from '@/services/conversationManager';
import { ConversationSession, ConversationAction } from '@/types';

interface ConversationState {
  currentConversation: ConversationSession | null;
  recentConversations: ConversationSession[];
  isLoading: boolean;
  isProcessing: boolean;
  isChatOpen: boolean;
  pendingActions: Map<string, ConversationAction>;
}

export const useConversations = () => {
  const [state, setState] = useState<ConversationState>(() => conversationManager.getState());

  useEffect(() => {
    // Subscribe to conversation manager updates
    const unsubscribe = conversationManager.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []); // Empty dependency - this is safe because conversationManager is a singleton

  return {
    // State
    currentConversation: state.currentConversation,
    recentConversations: state.recentConversations,
    isLoading: state.isLoading,
    isProcessing: state.isProcessing,
    isChatOpen: state.isChatOpen,
    pendingActions: state.pendingActions,
    
    // Actions
    setChatOpen: (open: boolean) => conversationManager.setChatOpen(open),
    createNewConversation: () => conversationManager.createNewConversation(),
    loadConversation: (conversationId: string) => conversationManager.loadConversation(conversationId),
    getRecentConversations: () => conversationManager.loadRecentConversations(),
    sendMessage: (message: string) => conversationManager.sendMessage(message),
    confirmAction: (actionId: string) => conversationManager.confirmAction(actionId),
    rejectAction: (actionId: string) => conversationManager.rejectAction(actionId),
    endConversation: () => conversationManager.endConversation(),
    deleteConversation: (conversationId: string) => conversationManager.deleteConversation(conversationId),
  };
};
