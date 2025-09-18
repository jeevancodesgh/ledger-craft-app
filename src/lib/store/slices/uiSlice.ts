/**
 * UI State Slice - User interface state management
 * Single responsibility: Managing UI state and preferences
 */

import { StateCreator } from 'zustand';

export interface Notification {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  createdAt: number;
}

export interface UISlice {
  // State
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  notifications: Notification[];
  isLoading: boolean;
  loadingMessage: string;
  
  // Modal/Dialog states
  modals: {
    [key: string]: boolean;
  };
  
  // Form states
  formDirty: {
    [key: string]: boolean;
  };
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Loading states
  setLoading: (loading: boolean, message?: string) => void;
  
  // Modal management
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
  isModalOpen: (modalId: string) => boolean;
  
  // Form state management
  setFormDirty: (formId: string, dirty: boolean) => void;
  isFormDirty: (formId: string) => boolean;
  resetAllForms: () => void;
  
  // UI preferences
  savePreferences: () => void;
  loadPreferences: () => void;
}

export const createUISlice: StateCreator<
  UISlice,
  [["zustand/immer", never], ["zustand/devtools", never], ["zustand/subscribeWithSelector", never]],
  [],
  UISlice
> = (set, get) => ({
  // Initial state
  theme: 'system',
  sidebarOpen: true,
  notifications: [],
  isLoading: false,
  loadingMessage: '',
  modals: {},
  formDirty: {},

  // Theme actions
  setTheme: (theme) => {
    set((state) => { 
      state.theme = theme; 
    });
    get().savePreferences();
  },

  // Sidebar actions
  setSidebarOpen: (open) => {
    set((state) => { 
      state.sidebarOpen = open; 
    });
    get().savePreferences();
  },

  toggleSidebar: () => {
    set((state) => { 
      state.sidebarOpen = !state.sidebarOpen; 
    });
    get().savePreferences();
  },

  // Notification actions
  addNotification: (notificationData) => {
    const notification: Notification = {
      ...notificationData,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      duration: notificationData.duration || (notificationData.type === 'error' ? 8000 : 5000),
    };

    set((state) => {
      state.notifications.push(notification);
    });

    // Auto-remove notification after duration
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(notification.id);
      }, notification.duration);
    }
  },

  removeNotification: (id) => {
    set((state) => {
      state.notifications = state.notifications.filter(n => n.id !== id);
    });
  },

  clearNotifications: () => {
    set((state) => {
      state.notifications = [];
    });
  },

  // Loading actions
  setLoading: (loading, message = '') => {
    set((state) => {
      state.isLoading = loading;
      state.loadingMessage = message;
    });
  },

  // Modal actions
  openModal: (modalId) => {
    set((state) => {
      state.modals[modalId] = true;
    });
  },

  closeModal: (modalId) => {
    set((state) => {
      state.modals[modalId] = false;
    });
  },

  toggleModal: (modalId) => {
    set((state) => {
      state.modals[modalId] = !state.modals[modalId];
    });
  },

  isModalOpen: (modalId) => {
    return get().modals[modalId] || false;
  },

  // Form state actions
  setFormDirty: (formId, dirty) => {
    set((state) => {
      state.formDirty[formId] = dirty;
    });
  },

  isFormDirty: (formId) => {
    return get().formDirty[formId] || false;
  },

  resetAllForms: () => {
    set((state) => {
      state.formDirty = {};
    });
  },

  // Preferences management
  savePreferences: () => {
    try {
      const preferences = {
        theme: get().theme,
        sidebarOpen: get().sidebarOpen,
      };
      localStorage.setItem('ui-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save UI preferences:', error);
    }
  },

  loadPreferences: () => {
    try {
      const saved = localStorage.getItem('ui-preferences');
      if (saved) {
        const preferences = JSON.parse(saved);
        set((state) => {
          state.theme = preferences.theme || 'system';
          state.sidebarOpen = preferences.sidebarOpen !== undefined ? preferences.sidebarOpen : true;
        });
      }
    } catch (error) {
      console.warn('Failed to load UI preferences:', error);
    }
  },
});
