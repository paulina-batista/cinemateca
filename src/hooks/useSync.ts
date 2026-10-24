import { useState, useEffect, useCallback } from 'react';
import type { SyncState } from '../types/media';
import { syncService } from '../services/supabase/syncService';
import { isSupabaseConfigured } from '../services/supabase/client';

export function useSync() {
  const [syncState, setSyncState] = useState<SyncState>(syncService.getState());
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    const unsubscribe = syncService.subscribe((state) => {
      setSyncState(state);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const syncNow = useCallback(async () => {
    return await syncService.syncNow();
  }, []);

  return {
    syncState,
    syncNow,
    isConfigured,
  };
}
