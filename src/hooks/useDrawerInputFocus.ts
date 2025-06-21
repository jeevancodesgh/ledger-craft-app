import * as React from 'react';

/**
 * useDrawerInputFocus
 * Ensures the focused input is always visible in the drawer by scrolling the drawer content if needed.
 * Returns a callback to use as onFocus for inputs.
 */
export function useDrawerInputFocus() {
  const handleInputFocus = React.useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const inputRect = target.getBoundingClientRect();
    const drawerContent = document.querySelector('.drawer-content');
    if (drawerContent) {
      const drawerRect = drawerContent.getBoundingClientRect();
      const scrollTop = drawerContent.scrollTop;
      const inputTop = inputRect.top - drawerRect.top + scrollTop;
      // Add some padding to ensure the input is not at the very top
      const targetScroll = inputTop - 100;
      drawerContent.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
    }
  }, []);

  return handleInputFocus;
} 