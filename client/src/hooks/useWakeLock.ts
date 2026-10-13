import { useEffect, useRef, useCallback } from "react";

export interface UseWakeLockReturn {
  isSupported: boolean;
  isLocked: boolean;
  requestLock: () => Promise<void>;
  releaseLock: () => Promise<void>;
}

export const useWakeLock = (autoRequest = false): UseWakeLockReturn => {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const isSupported = typeof navigator !== "undefined" && "wakeLock" in navigator;

  const requestLock = useCallback(async () => {
    if (!isSupported) return;
    try {
      if (!sentinelRef.current) {
        sentinelRef.current = await navigator.wakeLock.request("screen");
        sentinelRef.current.addEventListener("release", () => {
          sentinelRef.current = null;
        });
      }
    } catch {
      // Ignorar fallos si el usuario no tiene permisos o está en ahorro de batería
      sentinelRef.current = null;
    }
  }, [isSupported]);

  const releaseLock = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch {
        // Ignorar
      } finally {
        sentinelRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!isSupported || !autoRequest) return;

    void requestLock();

    // Re-adquirir el Wake Lock cuando la pestaña vuelve a tener foco (según especificación W3C)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && autoRequest) {
        void requestLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void releaseLock();
    };
  }, [isSupported, autoRequest, requestLock, releaseLock]);

  return {
    isSupported,
    isLocked: !!sentinelRef.current,
    requestLock,
    releaseLock,
  };
};
