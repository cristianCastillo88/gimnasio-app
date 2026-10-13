import { useState, useEffect, useCallback, useRef } from "react";
import { gymDb, type PendingSyncSession } from "../db/gymDatabase";
import { workoutsApi } from "../api/apiClient";

export interface UseOfflineSyncReturn {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncError: string | null;
  syncPendingSessions: () => Promise<void>;
  pendingSessions: PendingSyncSession[];
}

export const useOfflineSync = (): UseOfflineSyncReturn => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true;
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingSessions, setPendingSessions] = useState<PendingSyncSession[]>([]);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  const isSyncingRef = useRef(false);
  const retryTimeoutRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [3000, 8000, 20000];

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Cargar lista de sesiones pendientes desde IndexedDB
  const refreshPendingSessions = useCallback(async () => {
    try {
      const sessions = await gymDb.getPendingSessions();
      setPendingSessions(sessions);
    } catch {
      // Ignorar errores al leer IndexedDB si está cerrándose
    }
  }, []);

  // Función de sincronización por lotes con reintento progresivo
  const syncPendingSessions = useCallback(async () => {
    if (isSyncingRef.current) return;
    clearRetryTimeout();

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await refreshPendingSessions();
      return;
    }

    isSyncingRef.current = true;
    setIsSyncing(true);
    setLastSyncError(null);

    try {
      const pending = await gymDb.getPendingSessions();
      setPendingSessions(pending);

      if (pending.length === 0) {
        retryCountRef.current = 0;
        setIsSyncing(false);
        isSyncingRef.current = false;
        return;
      }

      const payloads = pending.map((p) => p.payload);
      const response = await workoutsApi.syncBatch({ sessions: payloads });

      if (response && response.results) {
        for (const item of response.results) {
          if (item.status === "CREATED" || item.status === "ALREADY_EXISTS") {
            await gymDb.markAsSynced(item.idempotencyKey);
          } else {
            await gymDb.markAsFailed(item.idempotencyKey, "Error en procesamiento del backend");
          }
        }
      }

      // Reiniciar contador de reintentos tras éxito
      retryCountRef.current = 0;
      await refreshPendingSessions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido al sincronizar";
      setLastSyncError(message);

      // Si aún hay conectividad según el navegador y no superamos el límite, programar reintento
      if (typeof navigator !== "undefined" && navigator.onLine && retryCountRef.current < MAX_RETRIES) {
        const delay = RETRY_DELAYS[retryCountRef.current] || 20000;
        retryCountRef.current += 1;
        retryTimeoutRef.current = window.setTimeout(() => {
          void syncPendingSessions();
        }, delay);
      }
    } finally {
      setIsSyncing(false);
      isSyncingRef.current = false;
    }
  }, [refreshPendingSessions, clearRetryTimeout]);

  // Manejo de eventos de red y sincronización inicial
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      retryCountRef.current = 0;
      void syncPendingSessions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      clearRetryTimeout();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Carga inicial de cola y sincronización tentativa
    void refreshPendingSessions().then(() => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        void syncPendingSessions();
      }
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearRetryTimeout();
    };
  }, [syncPendingSessions, refreshPendingSessions, clearRetryTimeout]);

  return {
    isOnline,
    isSyncing,
    pendingCount: pendingSessions.length,
    lastSyncError,
    syncPendingSessions,
    pendingSessions,
  };
};
