import { useEffect, useState, useCallback } from "react";
import { registerSW } from "virtual:pwa-register";

interface UsePwaUpdatePrompt {
  needRefresh: boolean;
  offlineReady: boolean;
  promptUpdate: () => void;
  dismissPrompt: () => void;
}

export function usePwaUpdatePrompt(): UsePwaUpdatePrompt {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateServiceWorker, setUpdateServiceWorker] = useState<(() => void) | null>(null);

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
    });
    setUpdateServiceWorker(() => updateSW);
  }, []);

  const promptUpdate = useCallback(() => {
    if (updateServiceWorker) {
      updateServiceWorker(true);
    }
    setNeedRefresh(false);
    window.location.reload();
  }, [updateServiceWorker]);

  const dismissPrompt = useCallback(() => {
    setNeedRefresh(false);
  }, []);

  return { needRefresh, offlineReady, promptUpdate, dismissPrompt };
} 