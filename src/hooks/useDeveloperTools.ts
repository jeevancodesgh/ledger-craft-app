import { useState, useEffect } from 'react';

/**
 * Hook for managing developer tools visibility
 * Provides keyboard shortcut (Ctrl/Cmd + Shift + D) to toggle developer tools
 */
export const useDeveloperTools = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + D to toggle developer tools
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setIsOpen(prev => !prev);
        
        if (!isOpen) {
          console.log('🛠️ Developer tools opened');
        }
      }
      
      // Escape to close developer tools
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Only enable in development or when explicitly enabled
  const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true';

  return {
    isOpen: isDevelopment ? isOpen : false,
    toggle: () => setIsOpen(prev => !prev),
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
};
