import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';

export const useAutoSync = () => {
  const {
    clients, products, orders, categories,
    setSyncStatus, setLastSyncedAt, addSyncLog
  } = useStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFirstMount = useRef(true);
  const isSyncing = useRef(false);

  const performSync = useCallback(async () => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    setSyncStatus('SYNCING');

    try {
      // Simulation of a heavy payload push to backend
      await new Promise<void>((resolve) => setTimeout(resolve, 800));

      addSyncLog({
        id: `sync-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'CLOUD_SYNC',
        status: 'SUCCESS',
        details: `Synced ${clients.length} clients, ${products.length} products, ${orders.length} orders.`
      });

      setSyncStatus('SAVED');
      setLastSyncedAt(new Date().toISOString());

      setTimeout(() => setSyncStatus('IDLE'), 3000);
    } catch (err) {
      addSyncLog({
        id: `sync-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'CLOUD_SYNC',
        status: 'FAILED',
        details: err instanceof Error ? err.message : 'Unknown network error'
      });
      setSyncStatus('ERROR');
      console.error('[AutoSync] Sync failed:', err);
    } finally {
      isSyncing.current = false;
    }
  }, [setSyncStatus, setLastSyncedAt, addSyncLog, clients.length, products.length, orders.length]);

  // Debounced sync on data changes
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const handler = setTimeout(() => {
      performSync();
    }, 1000);
    return () => clearTimeout(handler);
  }, [clients, products, orders, categories, performSync]);

  // Periodic heartbeat
  const performSyncRef = useRef(performSync);
  useEffect(() => {
    performSyncRef.current = performSync;
  }, [performSync]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      performSyncRef.current();
    }, 15_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { performSync };
};
