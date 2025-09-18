import { useEffect, useState, useCallback } from "react";
import { registerSW } from "virtual:pwa-register";
import { 
  isVersionOutdated, 
  forceRefresh, 
  clearAllCaches, 
  startVersionPolling,
  enableFocusUpdateCheck 
} from "@/utils/versionManager";

interface UsePwaUpdatePrompt {
  needRefresh: boolean;
  offlineReady: boolean;
  promptUpdate: () => void;
  forceUpdate: () => void;
  dismissPrompt: () => void;
  clearCaches: () => void;
}

export function usePwaUpdatePrompt(): UsePwaUpdatePrompt {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateServiceWorker, setUpdateServiceWorker] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Register service worker
    const updateSW = registerSW({
      onNeedRefresh() {
        console.log('🔄 Service Worker needs refresh');
        setNeedRefresh(true);
      },
      onOfflineReady() {
        console.log('📱 App ready for offline use');
        setOfflineReady(true);
      },
    });
    setUpdateServiceWorker(() => updateSW);

    // Start version polling
    const stopPolling = startVersionPolling(10 * 60 * 1000); // Check every 10 minutes
    
    // Enable focus update checks
    const stopFocusCheck = enableFocusUpdateCheck();

    // Listen for version update events
    const handleVersionUpdate = () => {
      console.log('📱 Version update detected');
      setNeedRefresh(true);
    };
    
    window.addEventListener('app-version-outdated', handleVersionUpdate);

    // Cleanup
    return () => {
      stopPolling();
      stopFocusCheck();
      window.removeEventListener('app-version-outdated', handleVersionUpdate);
    };
  }, []);

  // Skip immediate version check on mount to prevent false positives
  // Version polling will handle updates after app has stabilized

  const promptUpdate = useCallback(() => {
    if (updateServiceWorker) {
      updateServiceWorker();
    }
    setNeedRefresh(false);
    window.location.reload();
  }, [updateServiceWorker]);

  const forceUpdate = useCallback(async () => {
    console.log('💪 Force refreshing app...');
    await forceRefresh();
  }, []);

  const clearCaches = useCallback(async () => {
    console.log('🧹 Clearing all caches...');
    await clearAllCaches();
    setNeedRefresh(false);
  }, []);

  const dismissPrompt = useCallback(() => {
    setNeedRefresh(false);
  }, []);

  return { 
    needRefresh, 
    offlineReady, 
    promptUpdate, 
    forceUpdate, 
    dismissPrompt, 
    clearCaches 
  };
} 