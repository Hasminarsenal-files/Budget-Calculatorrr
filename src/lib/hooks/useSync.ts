'use client';

import { useState, useEffect } from 'react';
import { syncManager, SyncState } from '../sync/syncManager';

export function useSync() {
  const [syncStatus, setSyncStatus] = useState<{
    status: SyncState;
    pendingCount: number;
    lastSyncedAt: string | null;
    error?: string;
  }>({
    status: 'idle',
    pendingCount: 0,
    lastSyncedAt: null
  });

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((state) => {
      setSyncStatus(state);
    });

    syncManager.updatePendingCount();

    return () => {
      unsubscribe();
    };
  }, []);

  const triggerSync = () => {
    syncManager.sync();
  };

  return {
    ...syncStatus,
    triggerSync
  };
}
