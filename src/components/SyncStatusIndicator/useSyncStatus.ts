import { useMemo } from 'react';
import { useStore } from '@/store';
import { supabaseConfigured } from '@/supabase/client';
import { countPendingMedia } from '@/utils/pendingSync';

export function useSyncStatus() {
  const syncStatus = useStore((s) => s.syncStatus);
  const pendingSyncTables = useStore((s) => s.pendingSyncTables);
  const matches = useStore((s) => s.matches);
  const archivedRounds = useStore((s) => s.archivedRounds);
  const demoMode = useStore((s) => s.demoMode);

  const pendingCount = useMemo(
    () => pendingSyncTables.length + countPendingMedia(matches, archivedRounds),
    [pendingSyncTables, matches, archivedRounds],
  );

  const isSyncing = syncStatus === 'syncing';
  const isError = syncStatus === 'error';
  const visible = supabaseConfigured && !demoMode && (isSyncing || isError || pendingCount > 0);

  return { visible, pendingCount, isSyncing, isError };
}
